from flask import render_template, request, redirect, url_for, session, flash
from app.controllers.auth_controller import login_required, role_required
from app.models.user import User
from app.models.employee import Employee
from app.extensions import db
from werkzeug.security import generate_password_hash

@login_required
@role_required('SUPERADMIN')
def index():
    users = User.query.filter(User.role.in_(['ADMIN', 'SUPERADMIN'])).all()
    return render_template('admin/manage_users.html', users=users)

@login_required
@role_required('SUPERADMIN')
def create():
    if request.method == 'POST':
        email = request.form.get('email')
        role = request.form.get('role')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email sudah terdaftar.', 'danger')
            return redirect(url_for('user_controller.create'))
            
        new_user = User(
            email=email,
            password_hash=generate_password_hash(password),
            role=role,
            is_active=True,
            must_change_password=True
        )
        db.session.add(new_user)
        db.session.commit()
        
        flash('Data User berhasil ditambahkan.', 'success')
        return redirect(url_for('user_controller.index'))
        
    return render_template('admin/create_user.html')

@login_required
@role_required('SUPERADMIN')
def edit(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        user.email = request.form.get('email')
        user.role = request.form.get('role')
        
        is_active_val = request.form.get('is_active')
        user.is_active = (is_active_val == '1')
        
        new_password = request.form.get('password')
        if new_password:
            user.password_hash = generate_password_hash(new_password)
            user.must_change_password = True
            
        db.session.commit()
        flash('Data User berhasil diupdate.', 'success')
        return redirect(url_for('user_controller.index'))
        
    return render_template('admin/edit_user.html', user=user)

@login_required
@role_required('SUPERADMIN')
def delete(user_id):
    user = User.query.get_or_404(user_id)
    
    # Prevent deleting oneself
    if user.id == session.get('user_id'):
        flash('Tidak bisa menghapus akun sendiri.', 'danger')
        return redirect(url_for('user_controller.index'))
        
    # Check if there is an employee linked
    if user.employee:
        flash('User ini terhubung dengan data karyawan. Hapus data karyawan terlebih dahulu atau un-link user ini.', 'danger')
        return redirect(url_for('user_controller.index'))
        
    db.session.delete(user)
    db.session.commit()
    flash('User berhasil dihapus.', 'success')
    return redirect(url_for('user_controller.index'))
