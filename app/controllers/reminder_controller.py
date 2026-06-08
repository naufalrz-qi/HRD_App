from flask import render_template, request, redirect, url_for, flash
from app.extensions import db
from app.models.reminder_contact import ReminderContact
from app.models.employee import Employee

from app.controllers.auth_controller import login_required, role_required

@login_required
@role_required('SUPERADMIN')
def list_reminders():
    from app.scheduler import get_schedule_settings
    contacts = ReminderContact.query.all()
    employees = Employee.query.all()
    
    hour, minute, max_text_limit = get_schedule_settings()
    current_time = f"{hour:02d}:{minute:02d}"
    
    return render_template('admin/manage_reminders.html', contacts=contacts, employees=employees, current_time=current_time, max_text_limit=max_text_limit)

@login_required
@role_required('SUPERADMIN')
def update_schedule():
    from app.scheduler import update_schedule_settings
    time_str = request.form.get('schedule_time')
    max_text_limit_str = request.form.get('max_text_limit', '10')
    
    if time_str:
        try:
            hour, minute = map(int, time_str.split(':'))
            max_text_limit = int(max_text_limit_str)
            if update_schedule_settings(hour, minute, max_text_limit):
                flash('Pengaturan jadwal berhasil disimpan.', 'success')
            else:
                flash('Gagal menyimpan pengaturan jadwal.', 'danger')
        except ValueError:
            flash('Format data tidak valid.', 'danger')
            
    return redirect(url_for('admin.manage_reminders'))

@login_required
@role_required('SUPERADMIN')
def schedule_test():
    from app.scheduler import schedule_one_off_test
    from flask import current_app
    time_str = request.form.get('test_time')
    
    if time_str:
        try:
            hour, minute = map(int, time_str.split(':'))
            run_time = schedule_one_off_test(current_app._get_current_object(), hour, minute)
            flash(f'Test pengiriman dijadwalkan pada {run_time.strftime("%H:%M")}. Jadwal utama tidak berubah.', 'success')
        except ValueError:
            flash('Format waktu tidak valid.', 'danger')
            
    return redirect(url_for('admin.manage_reminders'))

@login_required
@role_required('SUPERADMIN')
def add_reminder():
    if request.method == 'POST':
        employee_id = request.form.get('employee_id')
        nama = request.form.get('nama')
        nomor_telepon = request.form.get('nomor_telepon')
        kategori = request.form.get('kategori')
        
        if employee_id:
            new_contact = ReminderContact(
                employee_id=employee_id,
                nomor_telepon=nomor_telepon,
                kategori=kategori
            )
        else:
            new_contact = ReminderContact(
                nama=nama,
                nomor_telepon=nomor_telepon,
                kategori=kategori
            )
            
        db.session.add(new_contact)
        db.session.commit()
        flash('Kontak reminder berhasil ditambahkan.', 'success')
        return redirect(url_for('admin.manage_reminders'))
        
    employees = Employee.query.all()
    return render_template('admin/create_reminder.html', employees=employees)

@login_required
@role_required('SUPERADMIN')
def edit_reminder(id):
    contact = ReminderContact.query.get_or_404(id)
    if request.method == 'POST':
        contact.employee_id = request.form.get('employee_id') or None
        contact.nama = request.form.get('nama')
        contact.nomor_telepon = request.form.get('nomor_telepon')
        contact.kategori = request.form.get('kategori')
        contact.is_active = 'is_active' in request.form
        
        db.session.commit()
        flash('Kontak reminder berhasil diperbarui.', 'success')
        return redirect(url_for('admin.manage_reminders'))
        
    employees = Employee.query.all()
    return render_template('admin/edit_reminder.html', contact=contact, employees=employees)

@login_required
@role_required('SUPERADMIN')
def trigger_reminder_test():
    from app.scheduler import check_and_send_reminders
    from flask import current_app
    
    try:
        check_and_send_reminders(current_app._get_current_object())
        flash('Pengecekan dan pengiriman reminder berhasil dijalankan manual.', 'success')
    except Exception as e:
        flash(f'Terjadi kesalahan saat menjalankan reminder: {str(e)}', 'danger')
        
    return redirect(url_for('admin.manage_reminders'))

@login_required
@role_required('SUPERADMIN')
def delete_reminder(id):
    contact = ReminderContact.query.get_or_404(id)
    db.session.delete(contact)
    db.session.commit()
    flash('Kontak reminder berhasil dihapus.', 'success')
    return redirect(url_for('admin.manage_reminders'))
