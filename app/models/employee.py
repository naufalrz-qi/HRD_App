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
    
    status_karyawan = db.Column(db.String(50), default='Kontrak')
    tanggal_berakhir_kontrak = db.Column(db.Date, nullable=True)
    
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

    def get_masa_kerja(self):
        from datetime import date
        if not self.tanggal_mulai_bekerja:
            return "-"
        
        today = date.today()
        years = today.year - self.tanggal_mulai_bekerja.year
        months = today.month - self.tanggal_mulai_bekerja.month
        
        if today.day < self.tanggal_mulai_bekerja.day:
            months -= 1
            
        if months < 0:
            years -= 1
            months += 12
            
        parts = []
        if years > 0:
            parts.append(f"{years} Tahun")
        if months > 0:
            parts.append(f"{months} Bulan")
            
        if not parts:
            return "< 1 Bulan"
            
        return " ".join(parts)
