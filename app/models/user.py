from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='PEGAWAI') # SUPERADMIN, ADMIN, PEGAWAI
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    must_change_password = db.Column(db.Boolean, default=False, nullable=False)
    
    # One-to-One relationship with Employee
    # A user might not have an employee record (e.g., SUPERADMIN might just be an IT account)
    employee = db.relationship('Employee', backref='user', uselist=False, cascade="all, delete-orphan")
    
    # Leave requests made by this user (sebagai penginput)
    requests_made = db.relationship('LeaveRequest', backref='requester', lazy=True, cascade="all, delete-orphan")
