from flask import jsonify, logging, render_template, render_template_string, request, send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore, Security, login_user
from flask_security.utils import hash_password, verify_password
from extension import db
from models import Services, ServiceRequest, ProfessionalServices, User, Review, UserRoles
from datetime import datetime
from celery.result import AsyncResult
import os
from werkzeug.utils import secure_filename
from flask_mail import Message

def create_cust(app, user_datastore: SQLAlchemyUserDatastore, cache):

    @roles_required('cust')# flask security checks  for the role cust in the json data returned after login 
   
   
    #all active professionals based on given location and service requirement 
    @app.route('/active_professional', methods=['GET'])
    def get_active_professionals():
        USERS = user_datastore.user_model.query.all()# all users are being queried and stored in the value users
        #cleaning the values
        location_search = request.args.get('location', '').strip().lower()
        service_search = request.args.get('service', '').strip().lower()

        active_professionals = [
            user for user in USERS if user.active and not user.blocked and any(role.name == 'prof' for role in user.roles)
        ]  # USING THIS METHOD TO SAVE REDUNDENCY AND MEMORY  CONSUMPTIONS  AND ITERATE IN A SINGLE PASS

        #active_professionals = [] # list of all the active and not blocked users in the database
        #for user in USERS:
         #   if user.active and not user.blocked:
          #      if any (role.name == "prof" for role in user.roles):
           #         active_professionals.append(user)  # will append all user who r not blocked and are active professionals to the list 

        if location_search:
            active_professionals = [
                user for user in active_professionals if user.location and location_search in user.location.lower()
            ]

            #active_professionals =[]
            #for user in active_professionals: #all the users in the previos active professionla list
             #   if user.location and location_search in user.location.lower():
              #      active_professionals.append(user)# new list will be having the all the active professional based on the location given 
        
        if service_search:
            active_professionals = [
                user for user in active_professionals if user.service_type and service_search in user.service_type.lower()
            ]

            #active_professionals = []
            #for user in active_professionals:
             #   if user.service_type  and service_search in user.service_type.lower(): #all the users based on location if thier service matches the enterd service 
              #      active_professionals .append(user)

       
        final_data = []
        for user in active_professionals: #professionals in the list
            all_id = [prof.service_id for prof in user.professional_services] 
            #list storing all the service id of that professional by fetching it from professional_services table name of the model in database 
            reviews = user.reviews_received # reviews_recieved accociated withe the user in list in database
            average_rating = average(reviews) # function above

            final_data.append({   # field related to professionals who is being searched 
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'mobile': user.mobile,
                'location': user.location,
                'pincode': user.pincode,
                'service_type': user.service_type,
                'experience_years': user.experience_years,
                'blocked': user.blocked,
                'active': user.active,
                "service_ids": all_id,
                'average_rating': average_rating
            })
        #for displaying  the highest rating first sorted it in decending order
        final_data.sort(key=lambda x: x['average_rating'] if x['average_rating'] is not None else 0, reverse=True)
        
        return jsonify(final_data), 200
    
   
    def average(reviews):  # fumction for calculating 
        if not reviews:
            return None
        total_rating = sum(rev.rating for rev in reviews)
        return total_rating / len(reviews)

    #fro submitting the request 
    @app.route('/service_request_api', methods=['POST'])
    @auth_required('token')
    def requestService():
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json() #getting json value from vuejs 
        service_id = data.get('service_id')
        professional_id = data.get('professional_id')
        remarks = data.get('remarks')  

        if not service_id or not professional_id:
            return jsonify({"error": "Missing required fields"}), 400

        try:
            service_request = ServiceRequest(
                service_id=service_id,
                customer_id=current_user.id,
                professional_id=professional_id,
                remarks=remarks or "No  remarks "  
            )
            db.session.add(service_request)#adding the newly created  seervice_request  to sqlalchemy session record is not saved permanently to the database
            db.session.commit() # finally added tto  the database permanently
            return jsonify({'message': 'Service request submitted successfully!'}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        


    #markin the service request complete
    @app.route('/complete_request_api/<int:Id>', methods=['PATCH'])
    @auth_required('token')
    def completeServiceRequest(Id):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_request = ServiceRequest.query.get_or_404(Id)
        service_request.service_status = "Completed"
        
        review_text = request.json.get('remarks')
        rating = request.json.get('rating')

        if review_text and rating:
            new_review = Review(
                professional_id=service_request.professional_id,
                customer_id=current_user.id,
                rating=rating,
                review_text=review_text,
            )
            db.session.add(new_review)

        db.session.commit()
        return jsonify({"message": "Service request marked as completed."}), 200
    
    
    #canceling
    @app.route('/cancel_request_api/<int:Id>', methods=['PATCH'])
    @auth_required('token')
    def service_request_cancel(Id):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_request = ServiceRequest.query.get_or_404(Id)
        service_request.service_status = "Canceled"
        
        db.session.commit()
        return jsonify({"message": "Service request canceled successfully."}), 200
    




    # service request history 
    @app.route('/request_history_api', methods=['GET'])
    @auth_required('token')
    def fetchrequesthistory():
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_requests = ServiceRequest.query.filter_by(customer_id=current_user.id).all()
        #customer id will be searched for current user id 
        
      
        

        
        requests_history = [
                    {
                        'id': req.id,
                        'professional': {'id': req.professional.id, 'full_name': req.professional.full_name},
                        'service': {'id': req.service.id, 'name': req.service.name},
                        'date_of_request': req.date_of_request,
                        'service_status': req.service_status,
                        'remarks': req.remarks   
                    }
                    for req in service_requests
                ]
        


        return jsonify(requests_history), 200
    

    
    #sybmit review
    @app.route('/submit_review_api/<int:request_id>/review', methods=['POST'])
    @auth_required('token')
    @roles_required('cust')
    def Submitreview(request_id):
        data = request.get_json()
        app.logger.debug(f"Received review data: {data}")

        rating = data.get('rating')
        review_text = data.get('review_text')

        if rating is None or review_text is None:
            return jsonify({'error': 'Rating and review_text are required.'}), 400

        try:
            rating = int(rating)
        except ValueError:
            return jsonify({'error': 'Rating must be a number between 1 and 5.'}), 400

        if not (1 <= rating <= 5):
            return jsonify({'error': 'Rating must be a number between 1 and 5.'}), 400

        try:
            app.logger.debug(f"Fetching service request with ID {request_id}")
            service_request = ServiceRequest.query.get(request_id)
            if not service_request:
                app.logger.debug(f"Service request with ID {request_id} not found.")
                return jsonify({'error': 'Service request not found.'}), 404

            app.logger.debug(f"Service request found: {service_request}")
            app.logger.debug(f"Current user ID: {current_user.id}")
            new_review = Review(
                professional_id=service_request.professional_id,
                customer_id=current_user.id,
                rating=rating,
                review_text=review_text
            )

            db.session.add(new_review)
            db.session.commit()

            return jsonify({'message': 'Review submitted successfully!'}), 201

        except Exception as e:
            app.logger.error(f"Error saving review for request {request_id} by user {current_user.id}: {str(e)}")
            return jsonify({'error': 'An error occurred while saving the review.'}), 500






    @app.route('/api/customer/statistics', methods=['GET'])
    @roles_required('cust')  # Ensure the user has the 'cust' role
    @auth_required('token')  # Ensure the user is authenticated with a valid token
    def get_customer_statistics():
        token = request.headers.get("Authentication-Token")
        
        # Extract customer ID from token
        customer_id = extract_customer_id_from_token(token)

        try:
            # Statistics calculations
            total_service_requests = ServiceRequest.query.filter_by(customer_id=customer_id).count()
            pending_requests = ServiceRequest.query.filter_by(customer_id=customer_id, service_status='Pending').count()
            
            
            total_spending = db.session.query(db.func.sum(Services.price)).join(ServiceRequest).filter(ServiceRequest.customer_id == customer_id).scalar() or 0
            
            most_requested_service = (db.session.query(ServiceRequest.service_id)
                                    .filter(ServiceRequest.customer_id == customer_id)
                                    .group_by(ServiceRequest.service_id)
                                    .order_by(db.func.count(ServiceRequest.id).desc())
                                    .first())
            
            most_requested_service_name = None
            if most_requested_service:
                service = Services.query.get(most_requested_service.service_id)
                most_requested_service_name = service.name if service else 'N/A'
            
         
            total_professionals_engaged = (db.session.query(ServiceRequest.professional_id)
                                            .filter(ServiceRequest.customer_id == customer_id)
                                            .distinct().count())
            
            # Spending by service
            spending_by_service = (db.session.query(Services.name, db.func.sum(Services.price))
                                    .join(ServiceRequest)
                                    .filter(ServiceRequest.customer_id == customer_id)
                                    .group_by(Services.name)
                                    .all())
            
            spending_by_service_dict = {service_name: total_spending for service_name, total_spending in spending_by_service}

            response = {
                "totalServiceRequests": total_service_requests,
                "pendingRequests": pending_requests,
                "totalSpending": total_spending,
                "mostRequestedService": most_requested_service_name,
                "totalProfessionalsEngaged": total_professionals_engaged,
                "spendingByService": spending_by_service_dict,  # Now a dictionary
            }

            return jsonify(response), 200

        except Exception as e:
            logging.error(f"Error fetching customer statistics: {e}")
            return jsonify({"error": "An error occurred while fetching statistics."}), 500

    def extract_customer_id_from_token(token):
        # Implement your logic to extract the customer ID from the token
        return current_user.id