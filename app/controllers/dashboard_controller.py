from flask import render_template, session
from app.controllers.auth_controller import login_required
from app.models.user import User
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from datetime import datetime, date, timedelta
from collections import Counter

@login_required
def index():
    role = session.get('role')
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    if role in ['SUPERADMIN', 'ADMIN']:
        today = date.today()
        current_month = today.month
        
        all_employees = Employee.query.all()
        total_karyawan = len(all_employees)
        
        # Birthday Reminders (this month)
        birthdays_this_month = [e for e in all_employees if e.tanggal_lahir and e.tanggal_lahir.month == current_month]
        birthdays_this_month.sort(key=lambda e: e.tanggal_lahir.day)
        
        # Upcoming birthdays (next 7 days)
        upcoming_birthdays = []
        for e in all_employees:
            if e.tanggal_lahir:
                try:
                    bday_this_year = e.tanggal_lahir.replace(year=today.year)
                except ValueError:
                    bday_this_year = e.tanggal_lahir.replace(year=today.year, month=3, day=1)
                diff = (bday_this_year - today).days
                if 0 <= diff <= 7:
                    upcoming_birthdays.append({"employee": e, "date": bday_this_year, "days_left": diff})
        upcoming_birthdays.sort(key=lambda x: x["days_left"])
        
        # Contract Reminders 
        contract_reminders = []
        expiring_contracts = []
        
        for e in all_employees:
            if e.tanggal_mulai_bekerja:
                start = e.tanggal_mulai_bekerja
                
                training_end = start + timedelta(days=90)
                if training_end.year == today.year and training_end.month == today.month:
                    contract_reminders.append({"employee": e, "type": "Habis Masa Training", "date": training_end})
                    continue
                
                if start.month == today.month and today.year > start.year:
                    try:
                        anniversary = start.replace(year=today.year)
                    except ValueError:
                        anniversary = start.replace(year=today.year, month=3, day=1)
                    contract_reminders.append({"employee": e, "type": f"Kontrak Tahun ke-{today.year - start.year}", "date": anniversary})
            
            # Expiring contract (next 30 days)
            if e.tanggal_berakhir_kontrak:
                days_left = (e.tanggal_berakhir_kontrak - today).days
                if 0 <= days_left <= 30:
                    expiring_contracts.append({"employee": e, "days_left": days_left, "date": e.tanggal_berakhir_kontrak})
                    
        contract_reminders.sort(key=lambda x: x["date"])
        expiring_contracts.sort(key=lambda x: x["days_left"])
        
        # Pending leaves
        pending_leaves = LeaveRequest.query.filter_by(status='PENDING').all()
        
        # Recent approved/rejected
        recent_decisions = LeaveRequest.query.filter(
            LeaveRequest.status.in_(['APPROVED', 'REJECTED'])
        ).order_by(LeaveRequest.updated_at.desc()).limit(5).all()
        
        # Division distribution
        divisi_counts = Counter(e.divisi for e in all_employees if e.divisi)
        divisi_distribution = dict(divisi_counts.most_common(8))
        max_divisi = max(divisi_distribution.values()) if divisi_distribution else 1
        
        # Greeting
        hour = datetime.now().hour
        if hour < 12:
            greeting = "Selamat Pagi"
        elif hour < 15:
            greeting = "Selamat Siang"
        elif hour < 18:
            greeting = "Selamat Sore"
        else:
            greeting = "Selamat Malam"
        
        return render_template('admin/dashboard.html', 
                               user=user,
                               greeting=greeting,
                               today=today,
                               total_karyawan=total_karyawan,
                               birthdays=birthdays_this_month,
                               upcoming_birthdays=upcoming_birthdays,
                               contracts=contract_reminders,
                               expiring_contracts=expiring_contracts,
                               pending_leaves=pending_leaves,
                               recent_decisions=recent_decisions,
                               divisi_distribution=divisi_distribution,
                               max_divisi=max_divisi)
    else:
        # Employee Dashboard
        recent_requests = []
        sisa_cuti = 0
        total_cuti = 0
        cuti_terpakai = 0
        if user.employee:
            recent_requests = LeaveRequest.query.filter_by(employee_id=user.employee.id).order_by(LeaveRequest.created_at.desc()).limit(5).all()
            sisa_cuti = user.employee.get_total_sisa_cuti()
            total_cuti = user.employee.hak_cuti_tahunan + user.employee.sisa_cuti_tambahan
            cuti_terpakai = user.employee.cuti_terpakai
        
        # Greeting
        hour = datetime.now().hour
        if hour < 12:
            greeting = "Selamat Pagi"
        elif hour < 15:
            greeting = "Selamat Siang"
        elif hour < 18:
            greeting = "Selamat Sore"
        else:
            greeting = "Selamat Malam"
        
        return render_template('employee/dashboard.html', 
                               user=user, 
                               greeting=greeting,
                               recent_requests=recent_requests, 
                               sisa_cuti=sisa_cuti,
                               total_cuti=total_cuti,
                               cuti_terpakai=cuti_terpakai)
