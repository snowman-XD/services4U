import flask_excel as excel
import os
import traceback
import only_customer
import only_professional
import routes

import only_admin
from flask_security.utils import verify_password , hash_password
from flask import Flask, request ,jsonify, render_template 
from flask_login import current_user
from flask_security import SQLAlchemyUserDatastore, Security , auth_required 
from models import db
from datetime import datetime
from flask_caching import Cache
from flask_cors import CORS # cross origin resource sharing important as without this my ffrontend was running on diffrent port and backed on diffrent port 
from werkzeug.utils import secure_filename
from models import Services , ProfessionalServices,User ,Role
import logging
from celery_init import celery_init_app
from initial_data import cooking_data
from extension import mail ,db ,security ,cache
from celery.schedules import crontab

logging.basicConfig(level=logging.DEBUG) #setting the basic logging level(DEBUG,INFO,WARNING,ERROR,CRITICAL)



#user_datastore = None #declareing the user_datastore globally
def create_app():
    
    app = Flask(__name__)

   
    app.config["SECRET_KEY"] = "ABHINAV"
    app.config["SECURITY_PASSWORD_SALT"] = "salty_password" 
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.sqlite3"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = 'uploads/' #folder where zip files will be stored
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'
    app.config['SECURITY_TOKEN_MAX_AGE'] = 3600 #1HR
    app.config['SECURITY_LOGIN_WITHOUT_CONFIRMATION'] = True
    CORS(app, supports_credentials=True)  #cross originr resource sharing 
    app.config['SECURITY_LOGIN_URL'] = '/user_login' #routes that my flsk security login will be using as the default login
    app.config['SECURITY_LOGOUT_URL'] = '/logout'
    
    app.config["DEBUG"] = True

     # Cache config
    app.config["DEBUG"] = True
    app.config["CACHE_TYPE"] = "RedisCache"
    app.config['CACHE_REDIS_HOST'] = 'localhost'
    app.config['CACHE_REDIS_PORT'] = 6379
    app.config['CACHE_REDIS_DB'] = 0
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'
    app.config["CACHE_DEFAULT_TIMEOUT"] = 120  # 2 min default timeout any data stored in redis data will automaaticallly be cleared out

    db.init_app(app) # initializiing the database
    
    try: # ensuring that uploadas folder exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
    except Exception as e:
        print(f"Error creating upload folder: {e}")
        raise

    # Flask-Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True # transport layer security set tru so no need to set ssl false 
    app.config['MAIL_USERNAME'] = 'ourworld34513@gmail.com'
    app.config['MAIL_PASSWORD'] = 'nbrh aafg rjaq xmjz'
    app.config['MAIL_DEFAULT_SENDER'] = 'ourworld34513@gmail.com'
    
    mail.init_app(app)  # Initialize Flask-Mail

    # Initialize extensions
    cache.init_app(app) #cache init 
    
   
    with app.app_context():
        
        
        user_datastore = SQLAlchemyUserDatastore(db , User , Role)
        security.init_app(app, user_datastore, register_blueprint=False)
        db.create_all()#create the tables
        
        cooking_data(user_datastore)# initial data
    app.config['WTF_CSRF_CHECK_DEFAULT'] = False
    app.config['SECURITY_CSRF_PROTECT_MECHANISHMS'] = []
    app.config['SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS'] = True
    
    only_customer.create_cust(app, user_datastore, cache)
    only_professional.create_prof(app, user_datastore, cache)
    routes.okaayy(app, user_datastore, cache)
    only_admin.create_admin(app,user_datastore) #python files and thier functionas 
    return app



#global scope
app  = create_app()
celery_app =  celery_init_app(app) #from the cylery_init.py 
excel.init_excel(app)
from tasks import send_reminder, professionals_pending_request_remainder , monthly_report_of_professional

#setting up the tasks in the celery  beat
@celery_app.on_after_configure.connect
def  setup_periodic_tasks(sender, **kwargs):
    
    #remainder sendendiing one after another at a set times
    sender.add_periodic_task(
        crontab(minute='*/1'),  # seet the time fro flask mail  to execute
        send_reminder.s("Reminder 11 am","we miss you check out our latest  services!"),
        # send_remainder(subject, body) 

        name=' 11 AM reminder'
    )
    sender.add_periodic_task(
        crontab(minute='*/2'),  # seet the time fro flask mail  to execute
        send_reminder.s("Reminder 7 pm","we miss you check out our latest  services!"),

        name=' 7PM reminder'
    )
    sender.add_periodic_task(
        crontab (minute='*/3'),     #   (hour=21, minute=00),  # seet the time fro flask mail  to execute
        send_reminder.s("Reminder 9 pm","we miss you check out our latest  services!"),

        name='9PM reminder'
    )
    
    sender.add_periodic_task(
        crontab(minute='*/3'), #hour=0),we can set time for real world accordingly i have done only for the live demonstration
        professionals_pending_request_remainder.s(), 
        name='sending emils for pending requests in every 1 min'
    )
    
    sender.add_periodic_task(
        crontab  (minute='*/2'),#(hour=14, minute=0, day_of_month=1), 
        monthly_report_of_professional.s(), 
        name='send monthly reports to professionals'  # sending in every 2 minutes for demo
    )
        
        





if __name__ == "__main__":
    app.run(debug =True)
