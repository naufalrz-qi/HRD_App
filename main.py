from flask import Flask
from config import Config
from app.extensions import db
from routes import register_routes

def create_app(config_class=Config):
    app = Flask(__name__, template_folder='app/views', static_folder='app/static')
    app.config.from_object(config_class)
    
    # Initialize Flask extensions
    from app.extensions import db, migrate
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register all routes
    register_routes(app)
    
    with app.app_context():
        # Import models so SQLAlchemy knows about them
        from app.models.user import User
        from app.models.employee import Employee
        from app.models.leave_request import LeaveRequest
        from app.models.compensation_history import CompensationHistory
        from app.models.public_holiday import PublicHoliday
        from app.models.reminder_contact import ReminderContact
        db.create_all()
        
    from app.scheduler import start_scheduler
    start_scheduler(app)
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0',port=5012, debug=True)
