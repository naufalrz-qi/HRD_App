from main import create_app
from app.extensions import db
from app.models.user import User
from app.models.employee import Employee
from werkzeug.security import generate_password_hash
from datetime import date

app = create_app()

with app.app_context():
    db.create_all()
    
    superadmin_email = 'superadmin@hrapp.com'
    if not User.query.filter_by(email=superadmin_email).first():
        sa_user = User(
            email=superadmin_email,
            password_hash=generate_password_hash('superadmin123'),
            role='SUPERADMIN',
            is_active=True
        )
        db.session.add(sa_user)
        db.session.commit()
        
        sa_emp = Employee(
            user_id=sa_user.id,
            nama='System Superadmin',
            divisi='IT',
            jabatan='Superadmin',
            tanggal_mulai_bekerja=date.today(),
            hak_cuti_tahunan=12
        )
        db.session.add(sa_emp)
        db.session.commit()
        print("Superadmin created: superadmin@hrapp.com / superadmin123")
    else:
        print("Superadmin already exists.")
