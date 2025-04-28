from celery import Celery, Task
from flask import Flask

class celery_config(): 
    broker_url = "redis://localhost:6379/0"   #using redis as broker to store the background tasks of celery
    result_backend = "redis://localhost:6379/1" #and results will be stored here

    # Timezone and schedules
    timezone = "Asia/Kolkata"
    enable_utc = True  # If you want to enable UTC timing (adjust based on your preference)

    # Task settings
    task_serializer = 'json'
    result_serializer = 'json'
    accept_content = ['json']  # Restrict the accepted content types to JSON
    task_track_started = True
    task_time_limit = 300  # Timeout for tasks (in seconds)

    # Retry policy
    broker_connection_retry_on_startup = True
    task_acks_late = True  # Tasks will be acknowledged after completion


# runs the task in application context, thats why in separate file
def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(celery_config)
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app

#just a black box setup ...cant understand logic behind it for now