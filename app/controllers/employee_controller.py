from flask import render_template, request, redirect, url_for, session, flash, send_file
from app.controllers.auth_controller import login_required, role_required
from app.models.user import User
from app.models.employee import Employee
from app.extensions import db
from werkzeug.security import generate_password_hash
from datetime import datetime, date
import pandas as pd
import io

def _get_filtered_users(req):
    query = Employee.query.join(User, isouter=True)
    
    # Selalu filter PEGAWAI atau yang tidak punya akun login
    query = query.filter((User.role == 'PEGAWAI') | (User.id == None))
        
    role_filter = req.args.get('role')
    if role_filter:
        query = query.filter(User.role == role_filter)
        
    status_filter = req.args.get('status')
    if status_filter == '1':
        query = query.filter(User.is_active == True)
    elif status_filter == '0':
        query = query.filter(User.is_active == False)
        
    divisi_filter = req.args.get('divisi')
    if divisi_filter:
        query = query.filter(Employee.divisi == divisi_filter)
        
    jabatan_filter = req.args.get('jabatan')
    if jabatan_filter:
        query = query.filter(Employee.jabatan == jabatan_filter)
        
    employees = query.all()
    
    # Filter tambahan yang butuh logic python
    bulan_masuk = req.args.get('bulan_masuk')
    punya_cuti = req.args.get('punya_cuti')
    status_kontrak = req.args.get('status_kontrak')
    
    filtered_emps = []
    today = date.today()
    
    for emp in employees:
        keep = True
        if bulan_masuk and emp.tanggal_mulai_bekerja:
            if str(emp.tanggal_mulai_bekerja.month) != str(bulan_masuk):
                keep = False
        elif bulan_masuk and not emp.tanggal_mulai_bekerja:
            keep = False
            
        if punya_cuti == '1' and emp.get_total_sisa_cuti() <= 0:
            keep = False
        elif punya_cuti == '0' and emp.get_total_sisa_cuti() > 0:
            keep = False
            
        if status_kontrak and emp.tanggal_mulai_bekerja:
            days_worked = (today - emp.tanggal_mulai_bekerja).days
            kontrak_tipe = "Aman"
            if 60 <= days_worked <= 90:
                kontrak_tipe = "Habis Masa Training"
            elif days_worked > 90:
                days_after_training = days_worked - 90
                days_in_current_year = days_after_training % 365
                if days_in_current_year >= 335:
                    kontrak_tipe = "Perpanjangan Kontrak"
            
            if status_kontrak != kontrak_tipe:
                keep = False
        elif status_kontrak and not emp.tanggal_mulai_bekerja:
            keep = False
            
        masa_kerja_filter = req.args.get('masa_kerja')
        if masa_kerja_filter and emp.tanggal_mulai_bekerja:
            days_worked = (today - emp.tanggal_mulai_bekerja).days
            years_worked = days_worked / 365.25
            if masa_kerja_filter == '<1' and years_worked >= 1:
                keep = False
            elif masa_kerja_filter == '1-3' and (years_worked < 1 or years_worked > 3):
                keep = False
            elif masa_kerja_filter == '>3' and years_worked <= 3:
                keep = False
        elif masa_kerja_filter and not emp.tanggal_mulai_bekerja:
            keep = False
            
        if keep:
            filtered_emps.append(emp)
            
    return filtered_emps

def calculate_hak_cuti(tanggal_mulai, jabatan):
    if not tanggal_mulai:
        return 0
    
    days_worked = (date.today() - tanggal_mulai).days
    years_worked = days_worked / 365.25
    
    if years_worked >= 1:
        if jabatan and jabatan.upper() == 'HO':
            return 12
        else:
            return 6
    return 0

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def index():
    employees = _get_filtered_users(request)
    
    # Ambil list divisi unik buat dropdown
    divisi_list = db.session.query(Employee.divisi).distinct().all()
    divisi_list = [d[0] for d in divisi_list if d[0]]
    
    # Ambil list jabatan unik buat dropdown
    jabatan_list = db.session.query(Employee.jabatan).distinct().all()
    jabatan_list = [j[0] for j in jabatan_list if j[0]]
    
    return render_template('admin/manage_employees.html', employees=employees, divisi_list=divisi_list, jabatan_list=jabatan_list)

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def create():
    if request.method == 'POST':
        email = request.form.get('email')
        role = 'PEGAWAI'
        
        if User.query.filter_by(email=email).first():
            flash('Email sudah terdaftar.', 'danger')
            return redirect(url_for('employee_controller.create'))
            
        tgl_lahir_str = request.form.get('tanggal_lahir')
        tgl_mulai_str = request.form.get('tanggal_mulai_bekerja')
        
        tgl_lahir = datetime.strptime(tgl_lahir_str, '%Y-%m-%d').date() if tgl_lahir_str else None
        tgl_mulai = datetime.strptime(tgl_mulai_str, '%Y-%m-%d').date() if tgl_mulai_str else None
        
        jabatan = request.form.get('jabatan')
        hak_cuti = calculate_hak_cuti(tgl_mulai, jabatan)
        
        default_password = 'SCT-' + tgl_lahir.strftime('%d%m%Y')
        
        new_user = User(
            email=email,
            password_hash=generate_password_hash(default_password),
            role=role,
            is_active=True,
            must_change_password=True
        )
        db.session.add(new_user)
        db.session.flush()
        
        new_emp = Employee(
            user_id=new_user.id,
            nama=request.form.get('nama'),
            divisi=request.form.get('divisi'),
            jabatan=jabatan,
            jabatan_2=request.form.get('jabatan_2'),
            tanggal_lahir=tgl_lahir,
            tanggal_mulai_bekerja=tgl_mulai,
            hak_cuti_tahunan=hak_cuti
        )
        db.session.add(new_emp)
        db.session.commit()
        
        flash('Data Karyawan dan Akun Login berhasil ditambahkan.', 'success')
        return redirect(url_for('employee_controller.index'))
        
    return render_template('admin/create_employee.html')

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def edit(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    
    if request.method == 'POST':
        user_id = request.form.get('user_id')
        employee.user_id = int(user_id) if user_id else None
        
        employee.nama = request.form.get('nama')
        employee.divisi = request.form.get('divisi')
        employee.jabatan = request.form.get('jabatan')
        employee.jabatan_2 = request.form.get('jabatan_2')
        
        tgl_lahir_str = request.form.get('tanggal_lahir')
        tgl_mulai_str = request.form.get('tanggal_mulai_bekerja')
        
        if tgl_lahir_str:
            employee.tanggal_lahir = datetime.strptime(tgl_lahir_str, '%Y-%m-%d').date()
        if tgl_mulai_str:
            employee.tanggal_mulai_bekerja = datetime.strptime(tgl_mulai_str, '%Y-%m-%d').date()
            
        db.session.commit()
        flash('Data Karyawan berhasil diupdate.', 'success')
        return redirect(url_for('employee_controller.index'))
        
    available_users = User.query.filter((~User.employee.has()) | (User.id == employee.user_id)).all()
    return render_template('admin/edit_employee.html', employee=employee, available_users=available_users)

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def delete(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    
    # We don't delete the user, only the employee
    db.session.delete(employee)
    db.session.commit()
    
    flash('Data Karyawan berhasil dihapus. Akun Login tidak ikut terhapus.', 'success')
    return redirect(url_for('employee_controller.index'))

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def import_excel():
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            flash('Tidak ada file yang diunggah.', 'danger')
            return redirect(url_for('employee_controller.index'))
            
        if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
            flash('Format file tidak didukung. Harap unggah file .xlsx atau .xls', 'danger')
            return redirect(url_for('employee_controller.index'))
            
        try:
            df = pd.read_excel(file)
            added_count = 0
            for index, row in df.iterrows():
                email = str(row.get('E-MAIL', '')).strip()
                if not email or pd.isna(email) or email == 'nan':
                    continue
                    
                if User.query.filter_by(email=email).first():
                    continue
                    
                tgl_lahir_val = row.get('TANGGAL LAHIR')
                tgl_mulai_val = row.get('TANGGAL MULAI BEKERJA')
                
                tgl_lahir = pd.to_datetime(tgl_lahir_val).date() if pd.notna(tgl_lahir_val) else None
                tgl_mulai = pd.to_datetime(tgl_mulai_val).date() if pd.notna(tgl_mulai_val) else None
                
                # if tanggal_lahir is missing in excel, fallback to SCT-123456
                default_password = 'SCT-' + tgl_lahir.strftime('%d%m%Y') if tgl_lahir else 'SCT-123456'
                
                jabatan = str(row.get('JABATAN', '')).strip()
                hak_cuti = calculate_hak_cuti(tgl_mulai, jabatan)
                
                new_user = User(
                    email=email,
                    password_hash=generate_password_hash(default_password),
                    role='PEGAWAI',
                    is_active=True,
                    must_change_password=True
                )
                db.session.add(new_user)
                db.session.flush()
                
                new_emp = Employee(
                    user_id=new_user.id,
                    nama=str(row.get('NAMA', '')).strip(),
                    divisi=str(row.get('DIVISI', '')).strip(),
                    jabatan=jabatan,
                    jabatan_2=str(row.get('JABATAN 2', '')).strip(),
                    tanggal_lahir=tgl_lahir,
                    tanggal_mulai_bekerja=tgl_mulai,
                    hak_cuti_tahunan=hak_cuti
                )
                db.session.add(new_emp)
                added_count += 1
                
            db.session.commit()
            flash(f'Berhasil mengimpor {added_count} karyawan. Password default adalah SCT-DDMMYYYY (Tanggal Lahir).', 'success')
        except Exception as e:
            flash(f'Terjadi kesalahan saat membaca file: {str(e)}', 'danger')
            
    return redirect(url_for('employee_controller.index'))

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def export_excel():
    employees = _get_filtered_users(request)
    
    data = []
    today = date.today()
    for emp in employees:
        u = emp.user
        
        kontrak_tipe = "-"
        if emp.tanggal_mulai_bekerja:
            days_worked = (today - emp.tanggal_mulai_bekerja).days
            kontrak_tipe = "Aman"
            if 60 <= days_worked <= 90:
                kontrak_tipe = "Habis Masa Training"
            elif days_worked > 90:
                days_after_training = days_worked - 90
                days_in_current_year = days_after_training % 365
                if days_in_current_year >= 335:
                    kontrak_tipe = "Perpanjangan Kontrak"

        data.append({
            'Nama': emp.nama,
            'Email': u.email if u else '-',
            'Role': u.role if u else '-',
            'Status': ('Aktif' if u.is_active else 'Nonaktif') if u else '-',
            'Divisi': emp.divisi if emp.divisi else '-',
            'Jabatan 1': emp.jabatan if emp.jabatan else '-',
            'Jabatan 2': emp.jabatan_2 if emp.jabatan_2 else '-',
            'Tanggal Lahir': emp.tanggal_lahir.strftime('%Y-%m-%d') if emp.tanggal_lahir else '-',
            'Tanggal Mulai Bekerja': emp.tanggal_mulai_bekerja.strftime('%Y-%m-%d') if emp.tanggal_mulai_bekerja else '-',
            'Sisa Cuti': emp.get_total_sisa_cuti(),
            'Status Kontrak': kontrak_tipe
        })
        
    df = pd.DataFrame(data)
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Data Karyawan')
        
    output.seek(0)
    
    return send_file(
        output,
        download_name='data_karyawan_filtered.xlsx',
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
