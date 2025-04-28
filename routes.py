from tasks import monthly_report_of_professional,  send_reminder
from flask_security.utils import verify_password , hash_password
from flask import Flask, request ,jsonify, render_template, send_file 
from flask_login import current_user
from flask_security import SQLAlchemyUserDatastore, Security , auth_required ,login_user
from extension import db
from datetime import datetime
from flask_caching import Cache
from flask_cors import CORS # cross origin resource sharing important as without this my ffrontend was running on diffrent port and backed on diffrent port 
from werkzeug.utils import secure_filename
from models import Services , ProfessionalServices,User ,Role
import logging
from celery.result import AsyncResult
import os
import traceback
#from tasks import send_offers, send_reminders, send_customer_monthly_report

def allowed_filename(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ["zip"] # checking of the file uploaded in correct zip format

logging.basicConfig(level=logging.DEBUG) #setting the basic logging level(DEBUG,INFO,WARNING,ERROR,CRITICAL)

def okaayy(app, user_datastore: SQLAlchemyUserDatastore, cache):
    @app.route('/')
    def Home():
        return render_template("index.html")

    
    
    
    @app.route('/user_login', methods =['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if not password or not email:
            logging.warning('fill the entry')
            return jsonify({"message":" no entry"}), 400
        user = user_datastore.find_user(email=email)# finds the user data from database based on the email
        if not user:
            logging.warning(f"{user.email}  login attempt without registeration")
            return jsonify({"message":"user not found"}), 404
        if not user.active:
            logging.warning(f"{user.email} is not active , documents under verification")
            return jsonify({"message":"documents under verification"}), 403
        if user.blocked:
            logging.warning(f"{user.email} is blocked")
            return jsonify({"message":"your account has been blocked"}), 403
        if verify_password(password, user.password):
            user.last_login = datetime.now()
            db.session.commit()
            logging.info(f"{user.email} logged in successfully !! ")
            res = {
                "token": user.get_auth_token(),
                "role": user.roles[0].name ,
                "id": user.id,
                "email": user.email
            }
            #print(f"login data {res}",flush=True)#debug
            return jsonify(res), 200
        else:
            logging.warning("incorrect password or email id")
            return jsonify({"message":"incorrect credentials"}), 401
    
                
        

        




    @app.route('/Register', methods=['POST'])
    def register():
        data = request.form
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        roles = data.get('role')
        location = data.get('location')
        pincode = data.get('pincode')
        mobile = data.get('mobile')
        service_type = data.get('service_type') if roles == 'prof' else None
        experience_years = data.get('experience_years') if roles == 'prof' else None

        if not email or not password or not full_name or not roles in ['prof' ,'cust']:
            return jsonify({"message": "invalid input provided"}),400
        if user_datastore.find_user(email=email):
            return jsonify({"message":"user already existing"}),409
            #file upload
        #documents= request.files.get('document')
        #file_path = None
        #if roles == 'prof' and documents: 
           # if allowed_filename(documents.filename):
               # filename = secure_filename(documents.filename)# sanitizing the file name by removing any other chars and prevents dangerous file uploads
             #   filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
             #   documents.save(file_path)
          #  else:
                #return jsonify({"message": "invalid file upload"}),400
        
        activation = roles == 'cust'
        
        try:
            
            
            user = user_datastore.create_user(
                email = email,
                password = hash_password(password),
                full_name = full_name,
                roles = [roles] ,
                active= activation,
                location = location ,
                pincode = pincode ,
                mobile = mobile ,
                service_type = service_type,
                experience_years = experience_years,
                #documents = file_path
                )
            db.session.commit()
            if roles == 'prof' and service_type:
                work = Services.query.filter_by(name= service_type).first()
                if work:
                    professional_work= ProfessionalServices(professional_id = user.id, service_id= work.id)
                    db.session.add(professional_work)
                    db.session.commit()
                else:
                    return jsonify({"message":"service field provided is invalid"}), 400
            return jsonify({"message":"user created sucessfully"}), 201
        except Exception as e:
            error_message = f"Error during registration: {str(e)}"
            app.logger.error(error_message)
            app.logger.error(traceback.format_exc())  # Log the full traceback
            db.session.rollback()
            return jsonify({"message": "internal server error", "error": error_message}), 500




    #retrivin user profile data
    @app.route('/user/<int:user_id>' , methods = ['GET']) 

    def retrive_user_data(user_id):
        if user_id != current_user.id:
            return jsonify({'message': "unautorized"}),403
        user = User.query.get(user_id)
        if user:
            return jsonify({
                "full_name" : user.full_name,
                'mobile' : user.mobile,
                "location" : user. location,
                "pincode" : user.pincode
            }), 200 #never use commas with space while returning jason it becomes tuple lol
        else:
            return jsonify({"message":"user not found"}),404

    # for updating the user profile data 
    @app.route ('/user/update' , methods = ["PUT"])
    @auth_required('token')
    def update_profile():
        if not current_user.is_authenticated: #after the auth_required("token") validates the user is_authentication returns true or false 
            return jsonify({"message":"unauthorized "}),401
        data  = request.get_json()
        user = User.query.get(current_user.id)
        try:
            if user:
                user.full_name = data.get("full_name", user.full_name)
                user.mobile = data.get("mobile", user.mobile)
                user.location = data.get("location", user.location)
                user.pincode = data.get("pincode", user.pincode)
                user.last_updated = datetime.utcnow()
                db.session.commit()
                return jsonify({"message":"updated successfully"}), 200
            else:
                return jsonify({"message":"user not found"}),404
                
        except Exception as e:
            db.session.rollback()
            return jsonify({"message":f"error in updating the profile: {str(e)}"}), 500
    

    #celery tasks .... 


   # will send monthly reports 
    @app.route('/test_send_monthly_report')
    def test_send_monthly_report():
        monthly_report_of_professional.delay()  # Call the task asynchronously from task.py
        return "Monthly report task has been triggered!"


    
    #sends daily remainders
    @app.route('/reminder')
    def reminder():
        task=send_reminder.delay("Hey !!!", "It's been a while since you logged in. ")


        return jsonify({'task_id_for_mail' : task.id})
    

    @app.route('/get-csv/<task_id>')
    def get_csv(task_id):
        result = AsyncResult(task_id)

        if result.ready():
            return send_file('./user-downloads/file.csv')
        else:
            return jsonify({'state': result.state}), 202 

    @app.route('/cache-test')
    @cache.cached(timeout=5)
    def cache_test():
        return jsonify({"time": datetime.now()})
