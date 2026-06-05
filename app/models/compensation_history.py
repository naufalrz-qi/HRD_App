from app.extensions import db
from datetime import datetime

class CompensationHistory(db.Model):
    __tablename__ = 'compensation_histories'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    jumlah_hari = db.Column(db.Integer, nullable=False)
    alasan = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    employee = db.relationship('Employee', backref='compensation_histories', lazy=True)
