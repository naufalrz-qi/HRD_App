from app.extensions import db
from datetime import datetime

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Karyawan yang cuti
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    
    # Siapa yang menginputkan cuti ini (bisa karyawan itu sendiri, admin, atau superadmin)
    requester_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    tanggal_mulai = db.Column(db.Date, nullable=False)
    tanggal_selesai = db.Column(db.Date, nullable=False)
    jumlah_hari = db.Column(db.Integer, nullable=False)
    
    alasan = db.Column(db.Text, nullable=False)
    alasan_tolak = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='PENDING') # PENDING, APPROVED, REJECTED
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', backref='leave_requests', lazy=True)
