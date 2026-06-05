from app.extensions import db

class PublicHoliday(db.Model):
    __tablename__ = 'public_holidays'
    
    id = db.Column(db.Integer, primary_key=True)
    tanggal = db.Column(db.Date, unique=True, nullable=False)
    keterangan = db.Column(db.String(255), nullable=False)
