from flask import render_template, request, redirect, url_for, session, flash
from werkzeug.security import check_password_hash, generate_password_hash
from app.extensions import db
from app.models.user import User
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth_controller.login'))
            
        user = User.query.get(session['user_id'])
        if user and user.must_change_password and request.endpoint != 'auth_controller.change_password' and request.endpoint != 'auth_controller.logout':
            flash('Anda harus mengganti password default Anda.', 'warning')
            return redirect(url_for('auth_controller.change_password'))
            
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('auth_controller.login'))
                
            user = User.query.get(session['user_id'])
            if user and user.must_change_password and request.endpoint != 'auth_controller.change_password' and request.endpoint != 'auth_controller.logout':
                flash('Anda harus mengganti password default Anda.', 'warning')
                return redirect(url_for('auth_controller.change_password'))
                
            if session.get('role') not in roles:
                flash('Anda tidak memiliki akses ke halaman ini.', 'danger')
                return redirect(url_for('auth_controller.index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard_controller.index'))
    return redirect(url_for('auth_controller.login'))

def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            if not user.is_active:
                flash('Akun Anda telah dinonaktifkan.', 'danger')
                return redirect(url_for('auth_controller.login'))
                
            session['user_id'] = user.id
            session['role'] = user.role
            # We get nama from the associated employee record
            session['nama'] = user.employee.nama if user.employee else user.email.split('@')[0]
            return redirect(url_for('dashboard_controller.index'))
        else:
            flash('Email atau password salah', 'danger')
            
    return render_template('auth/login.html')

def logout():
    session.clear()
    return redirect(url_for('auth_controller.login'))

@login_required
def change_password():
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if new_password != confirm_password:
            flash('Konfirmasi password tidak cocok.', 'danger')
            return redirect(url_for('auth_controller.change_password'))
            
        if len(new_password) < 6:
            flash('Password minimal 6 karakter.', 'danger')
            return redirect(url_for('auth_controller.change_password'))
            
        user.password_hash = generate_password_hash(new_password)
        user.must_change_password = False
        db.session.commit()
        
        flash('Password berhasil diubah. Silakan lanjutkan.', 'success')
        return redirect(url_for('dashboard_controller.index'))
        
    return render_template('auth/change_password.html', user=user)
