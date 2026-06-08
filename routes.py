from app.controllers import auth_controller, dashboard_controller, leave_controller, employee_controller, user_controller, holiday_controller

def register_routes(app):
    # Auth Routes
    app.add_url_rule('/login', endpoint='auth_controller.login', view_func=auth_controller.login, methods=['GET', 'POST'])
    app.add_url_rule('/logout', endpoint='auth_controller.logout', view_func=auth_controller.logout)
    app.add_url_rule('/change-password', endpoint='auth_controller.change_password', view_func=auth_controller.change_password, methods=['GET', 'POST'])
    app.add_url_rule('/', endpoint='auth_controller.index', view_func=auth_controller.index)
    
    # Dashboard Routes
    app.add_url_rule('/dashboard', endpoint='dashboard_controller.index', view_func=dashboard_controller.index)
    
    # Leave Routes
    app.add_url_rule('/leave/request', endpoint='leave_controller.request_leave', view_func=leave_controller.request_leave, methods=['GET', 'POST'])
    app.add_url_rule('/leave/history', endpoint='leave_controller.history', view_func=leave_controller.history)
    app.add_url_rule('/leave/manage', endpoint='leave_controller.manage_leaves', view_func=leave_controller.manage_leaves)
    app.add_url_rule('/leave/approve/<int:leave_id>', endpoint='leave_controller.approve_leave', view_func=leave_controller.approve_leave, methods=['POST'])
    app.add_url_rule('/leave/reject/<int:leave_id>', endpoint='leave_controller.reject_leave', view_func=leave_controller.reject_leave, methods=['POST'])
    app.add_url_rule('/leave/adjust/<int:employee_id>', endpoint='leave_controller.adjust_leave', view_func=leave_controller.adjust_leave, methods=['POST'])
    
    # Employee Master Data & Import Routes
    app.add_url_rule('/employees', endpoint='employee_controller.index', view_func=employee_controller.index)
    app.add_url_rule('/employees/create', endpoint='employee_controller.create', view_func=employee_controller.create, methods=['GET', 'POST'])
    app.add_url_rule('/employees/edit/<int:employee_id>', endpoint='employee_controller.edit', view_func=employee_controller.edit, methods=['GET', 'POST'])
    app.add_url_rule('/employees/delete/<int:employee_id>', endpoint='employee_controller.delete', view_func=employee_controller.delete, methods=['POST'])
    app.add_url_rule('/employees/import', endpoint='employee_controller.import_excel', view_func=employee_controller.import_excel, methods=['POST'])
    app.add_url_rule('/employees/export', endpoint='employee_controller.export_excel', view_func=employee_controller.export_excel, methods=['GET'])

    # User Routes (Login accounts)
    app.add_url_rule('/users', endpoint='user_controller.index', view_func=user_controller.index)
    app.add_url_rule('/users/create', endpoint='user_controller.create', view_func=user_controller.create, methods=['GET', 'POST'])
    app.add_url_rule('/users/edit/<int:user_id>', endpoint='user_controller.edit', view_func=user_controller.edit, methods=['GET', 'POST'])
    app.add_url_rule('/users/delete/<int:user_id>', endpoint='user_controller.delete', view_func=user_controller.delete, methods=['POST'])

    # Reminder Routes
    from app.controllers import reminder_controller
    app.add_url_rule('/admin/reminders', endpoint='admin.manage_reminders', view_func=reminder_controller.list_reminders)
    app.add_url_rule('/admin/reminders/add', endpoint='admin.add_reminder', view_func=reminder_controller.add_reminder, methods=['GET', 'POST'])
    app.add_url_rule('/admin/reminders/edit/<int:id>', endpoint='admin.edit_reminder', view_func=reminder_controller.edit_reminder, methods=['GET', 'POST'])
    app.add_url_rule('/admin/reminders/delete/<int:id>', endpoint='admin.delete_reminder', view_func=reminder_controller.delete_reminder, methods=['POST'])
    app.add_url_rule('/admin/reminders/trigger', endpoint='admin.trigger_reminder', view_func=reminder_controller.trigger_reminder_test, methods=['POST'])
    app.add_url_rule('/admin/reminders/schedule', endpoint='admin.update_schedule', view_func=reminder_controller.update_schedule, methods=['POST'])
    app.add_url_rule('/admin/reminders/schedule_test', endpoint='admin.schedule_test', view_func=reminder_controller.schedule_test, methods=['POST'])

    app.register_blueprint(holiday_controller.bp)
