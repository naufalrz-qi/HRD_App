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
        
        # Contract Reminders
        contract_reminders = []
        for e in all_employees:
            if e.tanggal_mulai_bekerja:
                delta = today - e.tanggal_mulai_bekerja
                days_worked = delta.days
                
                if 60 <= days_worked <= 90:
                    contract_reminders.append({"employee": e, "type": "Habis Masa Training"})
                elif days_worked > 90:
                    days_after_training = days_worked - 90
                    days_in_current_year = days_after_training % 365
                    if days_in_current_year >= 335:
                        contract_reminders.append({"employee": e, "type": "Perpanjangan Kontrak"})
                        
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
