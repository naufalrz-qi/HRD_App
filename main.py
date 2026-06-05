from flask import Flask
from config import Config
from app.extensions import db
from routes import register_routes

def create_app(config_class=Config):
    app = Flask(__name__, template_folder='app/views', static_folder='app/static')
    app.config.from_object(config_class)
    
    # Initialize Flask extensions
    db.init_app(app)
    
    # Register all routes
    register_routes(app)
    
    with app.app_context():
        # Import models so SQLAlchemy knows about them
        from app.models.user import User
        from app.models.leave_request import LeaveRequest
        from app.models.compensation_history import CompensationHistory
        from app.models.public_holiday import PublicHoliday
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(port=5012, debug=True)
