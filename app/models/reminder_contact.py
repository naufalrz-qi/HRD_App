from app.extensions import db

class ReminderContact(db.Model):
    __tablename__ = 'reminder_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(150), nullable=True) # Optional if linked to employee
    nomor_telepon = db.Column(db.String(20), nullable=False) # e.g. +628...
    kategori = db.Column(db.String(50), nullable=True) # e.g., HRD, Admin, Karyawan
    is_active = db.Column(db.Boolean, default=True)
    
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    employee = db.relationship('Employee', backref='reminder_contact_ref', lazy=True)

    def get_nama(self):
        if self.employee:
            return self.employee.nama
        return self.nama
