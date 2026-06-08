import random
from datetime import datetime, timedelta
from main import create_app
from app.extensions import db
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from app.models.reminder_contact import ReminderContact

app = create_app()

first_names = ["Budi", "Andi", "Joko", "Siti", "Ayu", "Dewi", "Rina", "Dian", "Eko", "Hadi", "Agus", "Putra", "Rizky", "Bayu", "Fajar", "Hendra", "Nia", "Maya", "Dina", "Tari", "Kusuma", "Lestari", "Setiawan", "Wijaya", "Rani", "Rudi", "Candra", "Dede", "Gilang"]
last_names = ["Santoso", "Pratama", "Saputra", "Wibowo", "Kurniawan", "Sari", "Purnama", "Hidayat", "Lubis", "Siregar", "Sihombing", "Sinaga", "Wahyuni", "Kusuma", "Lestari", "Nugroho", "Gunawan", "Wijaya", "Putri", "Mahendra"]
divisi_list = ["IT", "HRD", "Marketing", "Sales", "Finance", "Operations", "Design", "Product", "Engineering", "Customer Service"]
jabatan_list = ["Staff", "Supervisor", "Manager", "Senior Staff", "Lead", "Director", "Executive", "Analyst", "Coordinator"]

with app.app_context():
    print("Menghapus data karyawan lama...")
    LeaveRequest.query.delete()
    ReminderContact.query.delete()
    Employee.query.delete()
    db.session.commit()
    
    print("Membuat 200 data karyawan acak...")
    today = datetime.now().date()
    
    for i in range(200):
        # 10% chance to have a duplicate name to simulate real scenarios, otherwise unique combination
        nama = f"{random.choice(first_names)} {random.choice(last_names)}"
        if random.random() > 0.8:
            nama += f" {random.choice(last_names)}"
            
        divisi = random.choice(divisi_list)
        jabatan = random.choice(jabatan_list)
        
        # Tanggal lahir: antara 22 dan 55 tahun lalu
        umur_hari = random.randint(22*365, 55*365)
        tgl_lahir = today - timedelta(days=umur_hari)
        
        # Beberapa karyawan kita set ultahnya hari ini atau besok untuk testing reminder (5% chance)
        if random.random() < 0.05:
            tgl_lahir = tgl_lahir.replace(month=today.month, day=(today.day + random.randint(0, 1)) % 28 + 1)
            
        # Tanggal masuk: antara 1 bulan dan 5 tahun lalu
        masuk_hari = random.randint(30, 5*365)
        tgl_masuk = today - timedelta(days=masuk_hari)
        
        # Status
        status = random.choices(["Tetap", "Kontrak", "Magang"], weights=[60, 35, 5])[0]
        
        # Kontrak
        tgl_kontrak = None
        if status == "Kontrak":
            # Berakhir antara H-40 s/d 1 tahun ke depan
            sisa_hari = random.randint(-40, 365)
            
            # Khusus untuk memicu banyak data H-30 atau H-7 (20% chance)
            if random.random() < 0.2:
                sisa_hari = random.choice([7, 30])
                
            tgl_kontrak = today + timedelta(days=sisa_hari)
            
        # Hak Cuti
        hak = 12 if status == "Tetap" else 0
        
        emp = Employee(
            nama=nama,
            divisi=divisi,
            jabatan=jabatan,
            tanggal_lahir=tgl_lahir,
            tanggal_mulai_bekerja=tgl_masuk,
            status_karyawan=status,
            tanggal_berakhir_kontrak=tgl_kontrak,
            hak_cuti_tahunan=hak,
            cuti_terpakai=random.randint(0, 5) if hak > 0 else 0
        )
        db.session.add(emp)
        
    db.session.commit()
    print("Selesai memasukkan 200 data karyawan!")
