import os
import json
import tempfile
import pandas as pd
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app

from app.extensions import db
from app.models.employee import Employee
from app.models.reminder_contact import ReminderContact
from app.utils.whatsapp import send_whatsapp_message, send_whatsapp_document

# Global scheduler instance
_scheduler = BackgroundScheduler()
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'scheduler_settings.json')

def get_indonesian_month(month_int):
    months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    return months[month_int - 1]

def get_schedule_settings():
    """Reads the configured time and text limit from the settings file."""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
                return int(data.get('hour', 7)), int(data.get('minute', 0)), int(data.get('max_text_limit', 10))
    except Exception as e:
        print(f"Error reading scheduler settings: {e}")
    return 7, 0, 10

def update_schedule_settings(hour, minute, max_text_limit):
    """Updates the settings file and reschedules the job."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump({"hour": hour, "minute": minute, "max_text_limit": max_text_limit}, f)
        
        # Reschedule the existing job
        if _scheduler.get_job('reminder_job'):
            _scheduler.reschedule_job('reminder_job', trigger='cron', hour=hour, minute=minute)
        print(f"[{datetime.now()}] Reminder schedule updated to {hour:02d}:{minute:02d}, max text limit: {max_text_limit}")
        return True
    except Exception as e:
        print(f"Error updating scheduler settings: {e}")
        return False

def check_and_send_reminders(app):
    with app.app_context():
        print(f"[{datetime.now()}] Menjalankan pengecekan reminder rutin...")
        today = datetime.now().date()
        _, _, max_text_limit = get_schedule_settings()
        
        # 1. Reminder Ulang Tahun (H-1 / Besok)
        tomorrow = today + timedelta(days=1)
        birthday_emps = [
            e for e in Employee.query.all() 
            if e.tanggal_lahir and e.tanggal_lahir.month == tomorrow.month and e.tanggal_lahir.day == tomorrow.day
        ]
        
        if birthday_emps:
            hrd_contacts = ReminderContact.query.filter_by(is_active=True, kategori='HRD').all()
            for emp in birthday_emps:
                jabatan_text = ""
                if emp.jabatan_2 and emp.divisi:
                    jabatan_text = f"{emp.jabatan_2} {emp.divisi}"
                elif emp.jabatan_2:
                    jabatan_text = emp.jabatan_2
                elif emp.divisi:
                    jabatan_text = emp.divisi
                    
                jabatan_display = f" ({jabatan_text})" if jabatan_text else ""
                tgl_indo = f"{tomorrow.strftime('%d')} {get_indonesian_month(tomorrow.month)}"
                
                msg1 = f"Selamat pagi Boss, mau mengingatkan besok tgl {tgl_indo} ultah {emp.nama}{jabatan_display}"
                msg2 = f"Selamat Ulang Tahun {emp.nama}{jabatan_display}\n\nTuhan memberkati {emp.nama} panjang umur, bahagia, sehat dan sukses selalu.. 👏🎂🙏"
                
                for contact in hrd_contacts:
                    send_whatsapp_message(contact.nomor_telepon, msg1)
                    send_whatsapp_message(contact.nomor_telepon, msg2)
                    
        # 2. Reminder Kontrak (H-30 dan H-7)
        expiring_h30 = []
        expiring_h7 = []
        
        for e in Employee.query.all():
            if e.tanggal_berakhir_kontrak:
                days_left = (e.tanggal_berakhir_kontrak - today).days
                if days_left == 30:
                    expiring_h30.append(e)
                elif days_left == 7:
                    expiring_h7.append(e)
                    
        hrd_contacts = ReminderContact.query.filter_by(is_active=True, kategori='HRD').all()
        if not hrd_contacts:
            print("Tidak ada kontak HRD aktif untuk dikirimkan reminder kontrak.")
            return

        def format_employee_list(emps):
            lines = []
            for i, emp in enumerate(emps, 1):
                tgl_indo = f"{emp.tanggal_berakhir_kontrak.day} {get_indonesian_month(emp.tanggal_berakhir_kontrak.month)} {emp.tanggal_berakhir_kontrak.year}"
                lines.append(f"{i}. {emp.nama} ({emp.divisi} - {emp.jabatan_2}) - Habis: {tgl_indo}")
            return "\n".join(lines)

        # Proses H-30
        if expiring_h30:
            next_month_int = (today.month % 12) + 1
            next_month_name = get_indonesian_month(next_month_int)
            header_h30 = f"⚠️ *Reminder Kontrak Bulan {next_month_name}*"
            
            if len(expiring_h30) <= max_text_limit:
                msg = f"{header_h30}\n\nTerdapat {len(expiring_h30)} karyawan yang kontraknya akan habis bulan depan:\n{format_employee_list(expiring_h30)}\n\nMohon segera ditindaklanjuti."
                for contact in hrd_contacts:
                    send_whatsapp_message(contact.nomor_telepon, msg)
            else:
                # Generate Excel
                data = []
                for emp in expiring_h30:
                    data.append({
                        "Nama": emp.nama,
                        "Divisi": emp.divisi,
                        "Jabatan": emp.jabatan_2,
                        "Status": emp.status_karyawan,
                        "Tanggal Habis Kontrak": emp.tanggal_berakhir_kontrak.strftime('%Y-%m-%d')
                    })
                df = pd.DataFrame(data)
                filepath = os.path.join(tempfile.gettempdir(), f"Reminder_Kontrak_H_30_{today.strftime('%Y%m%d')}.xlsx")
                df.to_excel(filepath, index=False)
                
                caption = f"{header_h30}\n\nBerikut terlampir dokumen daftar {len(expiring_h30)} karyawan yang kontraknya akan habis bulan depan. Mohon segera ditindaklanjuti."
                for contact in hrd_contacts:
                    send_whatsapp_document(contact.nomor_telepon, filepath, os.path.basename(filepath), caption=caption)
                
                try:
                    os.remove(filepath)
                except:
                    pass

        # Proses H-7
        if expiring_h7:
            this_month_name = get_indonesian_month(today.month)
            header_h7 = f"⚠️ *Reminder Kontrak Bulan {this_month_name}*"
            
            if len(expiring_h7) <= max_text_limit:
                msg = f"{header_h7}\n\nTerdapat {len(expiring_h7)} karyawan yang kontraknya akan habis dalam 7 hari:\n{format_employee_list(expiring_h7)}\n\nHarap segera mengambil keputusan dan memproses dokumen perpanjangan."
                for contact in hrd_contacts:
                    send_whatsapp_message(contact.nomor_telepon, msg)
            else:
                msg = f"{header_h7}\n\nTerdapat {len(expiring_h7)} karyawan yang kontraknya akan habis dalam 7 hari. Harap segera mengambil keputusan dan memproses dokumen perpanjangan."
                for contact in hrd_contacts:
                    send_whatsapp_message(contact.nomor_telepon, msg)

        print(f"[{datetime.now()}] Pengecekan reminder selesai.")

def schedule_one_off_test(app, hour, minute):
    """Schedules a one-off run at the specified time today (or tomorrow if time passed)."""
    run_time = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
    if run_time < datetime.now():
        run_time += timedelta(days=1)
        
    _scheduler.add_job(
        func=check_and_send_reminders, 
        args=[app], 
        trigger="date", 
        run_date=run_time
    )
    print(f"[{datetime.now()}] One-off test reminder scheduled for {run_time.strftime('%Y-%m-%d %H:%M')}")
    return run_time

def start_scheduler(app):
    hour, minute, _ = get_schedule_settings()
    
    _scheduler.add_job(
        func=check_and_send_reminders, 
        args=[app], 
        trigger="cron", 
        hour=hour, 
        minute=minute,
        id='reminder_job',
        replace_existing=True
    )
    
    if not _scheduler.running:
        _scheduler.start()
        print(f"[{datetime.now()}] Scheduler started. Reminders will run at {hour:02d}:{minute:02d}")
