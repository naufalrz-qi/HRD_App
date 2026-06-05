from flask import render_template, request, redirect, url_for, session, flash
from app.controllers.auth_controller import login_required, role_required
from app.models.user import User
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from app.extensions import db
from datetime import datetime, date, timedelta

@login_required
def request_leave():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    role = session.get('role')
    
    # If Superadmin, they can pick which employee to add leave for
    employees = []
    if role == 'SUPERADMIN':
        employees = Employee.query.all()
        
    if request.method == 'POST':
        # Determine target employee
        target_employee_id = None
        if role == 'SUPERADMIN':
            target_employee_id = request.form.get('employee_id')
        else:
            if not user.employee:
                flash('Anda tidak memiliki data karyawan terkait. Tidak dapat mengajukan cuti.', 'danger')
                return redirect(url_for('dashboard_controller.index'))
            target_employee_id = user.employee.id
            
        target_employee = Employee.query.get(target_employee_id)
        if not target_employee:
            flash('Karyawan tidak ditemukan.', 'danger')
            return redirect(url_for('leave_controller.request_leave'))
            
        tgl_mulai_str = request.form.get('tanggal_mulai')
        tgl_selesai_str = request.form.get('tanggal_selesai')
        alasan = request.form.get('alasan')
        
        tgl_mulai = datetime.strptime(tgl_mulai_str, '%Y-%m-%d').date()
        tgl_selesai = datetime.strptime(tgl_selesai_str, '%Y-%m-%d').date()
        
        # Determine if employee has 3 years tenure precisely
        is_senior = False
        if target_employee.tanggal_mulai_bekerja:
            try:
                anniversary_3yr = target_employee.tanggal_mulai_bekerja.replace(year=target_employee.tanggal_mulai_bekerja.year + 3)
            except ValueError:
                anniversary_3yr = target_employee.tanggal_mulai_bekerja.replace(year=target_employee.tanggal_mulai_bekerja.year + 3, month=3, day=1)
            if date.today() >= anniversary_3yr:
                is_senior = True
                
        from app.models.public_holiday import PublicHoliday
        holidays_in_range = PublicHoliday.query.filter(
            PublicHoliday.tanggal >= tgl_mulai,
            PublicHoliday.tanggal <= tgl_selesai
        ).all()
        holiday_dates = [h.tanggal for h in holidays_in_range]
        
        jumlah_hari = 0
        current_date = tgl_mulai
        while current_date <= tgl_selesai:
            if current_date.weekday() != 6: # Skip Sunday
                # If senior, skip public holidays
                if is_senior and current_date in holiday_dates:
                    pass
                else:
                    jumlah_hari += 1
            current_date += timedelta(days=1)
        
        if jumlah_hari <= 0:
            flash('Tanggal tidak valid.', 'danger')
            return redirect(url_for('leave_controller.request_leave'))
            
        sisa_cuti = target_employee.get_total_sisa_cuti()
        if jumlah_hari > sisa_cuti:
            flash(f'Sisa cuti tidak cukup. Sisa cuti: {sisa_cuti} hari.', 'danger')
            return redirect(url_for('leave_controller.request_leave'))
            
        # Check eligibility
        if target_employee.tanggal_mulai_bekerja:
            days_worked = (date.today() - target_employee.tanggal_mulai_bekerja).days
            if days_worked < 90:
                flash('Karyawan belum memenuhi syarat masa kerja (Minimal 3 bulan).', 'danger')
                return redirect(url_for('leave_controller.request_leave'))
                
        new_request = LeaveRequest(
            employee_id=target_employee.id,
            requester_user_id=user.id,
            tanggal_mulai=tgl_mulai,
            tanggal_selesai=tgl_selesai,
            jumlah_hari=jumlah_hari,
            alasan=alasan,
            status='APPROVED' if role == 'SUPERADMIN' else 'PENDING'
        )
        db.session.add(new_request)
        if role == 'SUPERADMIN':
            target_employee.cuti_terpakai += jumlah_hari
            flash('Cuti berhasil ditambahkan secara instan.', 'success')
        else:
            flash('Pengajuan cuti berhasil dikirim dan menunggu persetujuan.', 'success')
            
        db.session.commit()
        
        if role == 'SUPERADMIN':
            return redirect(url_for('leave_controller.manage_leaves'))
        return redirect(url_for('dashboard_controller.index'))
        
    return render_template('employee/request_leave.html', user=user, employees=employees, role=role)

@login_required
def history():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    if not user.employee:
        flash('Anda tidak memiliki data karyawan terkait.', 'danger')
        return redirect(url_for('dashboard_controller.index'))
        
    requests = LeaveRequest.query.filter_by(employee_id=user.employee.id).order_by(LeaveRequest.created_at.desc()).all()
    return render_template('employee/leave_history.html', user=user, requests=requests)

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def manage_leaves():
    leaves = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    return render_template('admin/manage_leaves.html', leaves=leaves)

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def approve_leave(leave_id):
    leave = LeaveRequest.query.get_or_404(leave_id)
    if leave.status == 'PENDING':
        leave.status = 'APPROVED'
        leave.employee.cuti_terpakai += leave.jumlah_hari
        db.session.commit()
        flash('Cuti berhasil disetujui.', 'success')
    return redirect(url_for('leave_controller.manage_leaves'))

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def reject_leave(leave_id):
    leave = LeaveRequest.query.get_or_404(leave_id)
    if leave.status == 'PENDING':
        if request.method == 'POST':
            alasan_tolak = request.form.get('alasan_tolak')
            leave.alasan_tolak = alasan_tolak
            leave.status = 'REJECTED'
            db.session.commit()
            flash('Cuti ditolak.', 'info')
    return redirect(url_for('leave_controller.manage_leaves'))

@login_required
@role_required('ADMIN', 'SUPERADMIN')
def adjust_leave(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    if request.method == 'POST':
        jumlah_hari = int(request.form.get('jumlah_hari', 0))
        alasan = request.form.get('alasan')
        
        employee.sisa_cuti_tambahan += jumlah_hari
        
        from app.models.compensation_history import CompensationHistory
        history = CompensationHistory(
            employee_id=employee.id,
            jumlah_hari=jumlah_hari,
            alasan=alasan
        )
        db.session.add(history)
        
        db.session.commit()
        flash(f'Berhasil menambahkan {jumlah_hari} hari cuti kompensasi untuk {employee.nama}.', 'success')
    return redirect(url_for('employee_controller.index'))
