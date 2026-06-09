from main import create_app
from app.scheduler import check_and_send_reminders

app = create_app()
check_and_send_reminders(app)
