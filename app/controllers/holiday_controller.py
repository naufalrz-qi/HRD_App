from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.extensions import db
from app.models.public_holiday import PublicHoliday
from datetime import datetime
from functools import wraps
from flask import session

bp = Blueprint('holiday_controller', __name__, url_prefix='/holidays')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Silakan login terlebih dahulu.', 'danger')
            return redirect(url_for('auth_controller.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if session.get('role') not in roles:
                flash('Anda tidak memiliki akses ke halaman ini.', 'danger')
                return redirect(url_for('employee_controller.dashboard'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@bp.route('/', methods=['GET'])
@login_required
@role_required('ADMIN', 'SUPERADMIN')
def index():
    holidays = PublicHoliday.query.order_by(PublicHoliday.tanggal.desc()).all()
    return render_template('admin/manage_holidays.html', holidays=holidays)

@bp.route('/create', methods=['POST'])
@login_required
@role_required('ADMIN', 'SUPERADMIN')
def create():
    tanggal_str = request.form.get('tanggal')
    keterangan = request.form.get('keterangan')
    
    if not tanggal_str or not keterangan:
        flash('Tanggal dan keterangan wajib diisi.', 'danger')
        return redirect(url_for('holiday_controller.index'))
        
    try:
        tanggal = datetime.strptime(tanggal_str, '%Y-%m-%d').date()
        
        # Check if already exists
        existing = PublicHoliday.query.filter_by(tanggal=tanggal).first()
        if existing:
            flash(f'Tanggal merah untuk {tanggal_str} sudah ada di database.', 'warning')
            return redirect(url_for('holiday_controller.index'))
            
        new_holiday = PublicHoliday(tanggal=tanggal, keterangan=keterangan)
        db.session.add(new_holiday)
        db.session.commit()
        flash('Berhasil menambahkan tanggal merah.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Terjadi kesalahan: {str(e)}', 'danger')
        
    return redirect(url_for('holiday_controller.index'))

@bp.route('/<int:holiday_id>/delete', methods=['POST'])
@login_required
@role_required('ADMIN', 'SUPERADMIN')
def delete(holiday_id):
    holiday = PublicHoliday.query.get_or_404(holiday_id)
    try:
        db.session.delete(holiday)
        db.session.commit()
        flash('Berhasil menghapus tanggal merah.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Terjadi kesalahan saat menghapus: {str(e)}', 'danger')
    return redirect(url_for('holiday_controller.index'))
