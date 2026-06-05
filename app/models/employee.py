from app.extensions import db

class Employee(db.Model):
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=True)
    
    nama = db.Column(db.String(150), nullable=False)
    divisi = db.Column(db.String(100))
    jabatan = db.Column(db.String(100))
    jabatan_2 = db.Column(db.String(100))
    
    tanggal_lahir = db.Column(db.Date)
    tanggal_mulai_bekerja = db.Column(db.Date)
    
    hak_cuti_tahunan = db.Column(db.Integer, default=0)
    cuti_terpakai = db.Column(db.Integer, default=0)
    sisa_cuti_tambahan = db.Column(db.Integer, default=0)
    
    def get_total_sisa_cuti(self):
        return (self.hak_cuti_tahunan + self.sisa_cuti_tambahan) - self.cuti_terpakai

    def is_senior_eligible(self):
        from datetime import date
        if not self.tanggal_mulai_bekerja:
            return False
        try:
            anniversary_3yr = self.tanggal_mulai_bekerja.replace(year=self.tanggal_mulai_bekerja.year + 3)
        except ValueError:
            anniversary_3yr = self.tanggal_mulai_bekerja.replace(year=self.tanggal_mulai_bekerja.year + 3, month=3, day=1)
        return date.today() >= anniversary_3yr

