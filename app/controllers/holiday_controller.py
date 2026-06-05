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
    from collections import defaultdict
    holidays = PublicHoliday.query.order_by(PublicHoliday.tanggal.asc()).all()
    
    grouped_holidays = defaultdict(list)
    for h in holidays:
        grouped_holidays[h.tanggal.year].append(h)
        
    # Urutkan tahun dari yang terbaru
    sorted_years = sorted(grouped_holidays.keys(), reverse=True)
    
    return render_template('admin/manage_holidays.html', grouped_holidays=grouped_holidays, sorted_years=sorted_years)

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

@bp.route('/generate_api', methods=['POST'])
@login_required
@role_required('ADMIN', 'SUPERADMIN')
def generate_api():
    import urllib.request
    import json
    from datetime import date
    
    year = request.form.get('year', date.today().year)
    try:
        url = f'https://date.nager.at/api/v3/PublicHolidays/{year}/ID'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        
        count = 0
        for item in data:
            tgl = datetime.strptime(item['date'], '%Y-%m-%d').date()
            existing = PublicHoliday.query.filter_by(tanggal=tgl).first()
            if not existing:
                new_holiday = PublicHoliday(tanggal=tgl, keterangan=item['localName'])
                db.session.add(new_holiday)
                count += 1
                
        if count > 0:
            db.session.commit()
            flash(f'Berhasil menambahkan {count} hari libur nasional dari API Nager.Date untuk tahun {year}.', 'success')
        else:
            flash(f'Tidak ada tanggal baru yang ditambahkan (semua libur tahun {year} sudah ada di database).', 'info')
            
    except Exception as e:
        db.session.rollback()
        flash(f'Gagal menarik data dari API: {str(e)}', 'danger')
        
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
