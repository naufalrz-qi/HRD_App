from flask import render_template, session
from app.controllers.auth_controller import login_required
from app.models.user import User
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from datetime import datetime, date

@login_required
def index():
    role = session.get('role')
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    if role in ['SUPERADMIN', 'ADMIN']:
        # HR/Admin Dashboard
        today = date.today()
        current_month = today.month
        
        # Birthday Reminders (Birthdays this month)
        all_employees = Employee.query.all()
        birthdays_this_month = [e for e in all_employees if e.tanggal_lahir and e.tanggal_lahir.month == current_month]
        
        # Contract Reminders (Bulan Ini)
        contract_reminders = []
        import datetime
        for e in all_employees:
            if e.tanggal_mulai_bekerja:
                start = e.tanggal_mulai_bekerja
                
                training_end = start + datetime.timedelta(days=90)
                if training_end.year == today.year and training_end.month == today.month:
                    contract_reminders.append({"employee": e, "type": "Habis Masa Training", "date": training_end})
                    continue
                
                if start.month == today.month and today.year > start.year:
                    try:
                        anniversary = start.replace(year=today.year)
                    except ValueError:
                        anniversary = start.replace(year=today.year, month=3, day=1)
                    contract_reminders.append({"employee": e, "type": f"Kontrak Tahun ke-{today.year - start.year}", "date": anniversary})
                    
        contract_reminders.sort(key=lambda x: x["date"])
                        
        pending_leaves = LeaveRequest.query.filter_by(status='PENDING').all()
        
        return render_template('admin/dashboard.html', 
                               user=user,
                               birthdays=birthdays_this_month, 
                               contracts=contract_reminders,
                               pending_leaves=pending_leaves)
    else:
        # Employee Dashboard
        recent_requests = []
        sisa_cuti = 0
        if user.employee:
            recent_requests = LeaveRequest.query.filter_by(employee_id=user.employee.id).order_by(LeaveRequest.created_at.desc()).limit(5).all()
            sisa_cuti = user.employee.get_total_sisa_cuti()
        
        return render_template('employee/dashboard.html', user=user, recent_requests=recent_requests, sisa_cuti=sisa_cuti)
