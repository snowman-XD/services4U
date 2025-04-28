from flask import jsonify, logging, render_template, render_template_string, request, send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore, Security, login_user
from flask_security.utils import hash_password, verify_password
from models import  ServiceRequest, ProfessionalServices, User, Review ,Role
from extension import db
from datetime import datetime
from celery.result import AsyncResult
import os
from werkzeug.utils import secure_filename
from flask_mail import Message
from sqlalchemy import func

def create_prof(app, user_datastore: SQLAlchemyUserDatastore, cache):

    @app.route('/prof-dashboard')
    @roles_accepted('prof')
    def prof_dashboard():
        return render_template_string(
            """
                <h1> Professional Profile </h1>
                <p> It should only be visible to professionals.</p>
            """
        )
    # fetch for the compleated requests 
    @app.route('/api/prof/completed-requests', methods=['GET'])
    @auth_required('token')
    @roles_required('prof')
    def get_completed_services():
        if not current_user.is_authenticated or not current_user.has_role('prof'):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            completed_services = ServiceRequest.query.filter_by(professional_id=current_user.id, service_status="Completed").all()

            completed_list = [
                {
                    'id': req.id,
                    'customer_name': req.customer.full_name if req.customer else "Unknown",
                    'service_name': req.service.name if req.service else "Unknown",
                    'date_completed': req.date_of_request.strftime('%Y-%m-%d'),
                    'remarks': req.remarks
                }
                for req in completed_services
            ]

            return jsonify(completed_list), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500






    #for fetching the new requests 
    @app.route('/professional/request_api', methods=['GET'])
    @auth_required('token')
    @roles_required('prof')
    def get_professional_service_requests():
        if not current_user.is_authenticated or not current_user.has_role('prof'):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            # Fetch all service requests for the current professional
            #service_requests = ServiceRequest.query.filter_by(professional_id=current_user.id , service_status = "Pending" or 'Accepted').all()
            service_requests = ServiceRequest.query.filter(
    ServiceRequest.professional_id == current_user.id,
    ServiceRequest.service_status.in_(['Pending'])
).all()
            # Construct the response to include customer full name and location
            requests_list = [
                {
                    'id': req.id,
                    'customer_id': req.customer_id,
                    'customer_full_name': req.customer.full_name if req.customer else None,
                    'customer_location': req.customer.location if req.customer else None,
                    'customer_mobile': req.customer.mobile if req.customer else None,
                    'service_id': req.service_id,
                    'date_of_request': req.date_of_request,
                    'service_status': req.service_status,
                    'remarks': req.remarks
                }
                for req in service_requests
            ]

            return jsonify(requests_list), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

# for accepting the requests 
    @app.route('/professional/request_api/<int:Id>/approve', methods=['PATCH'])
    @auth_required('token')
    @roles_required('prof')
    def accept_service_request(Id):
        if not current_user.is_authenticated or not current_user.has_role('prof'):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            service_request = ServiceRequest.query.get(Id)
            
            if not service_request or service_request.professional_id != current_user.id:
                return jsonify({"error": "Service request not found or unauthorized"}), 404

            service_request.service_status = 'Accepted'
            db.session.commit()

            return jsonify({"message": "Service request accepted successfully!"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        

# for rejecting the requests
    @app.route('/professional/request_api/<int:Id>/reject', methods=['PATCH'])
    @auth_required('token')# token authentication
    @roles_required('prof')
    def reject_service_request(Id):
        if not current_user.is_authenticated or not current_user.has_role('prof'):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            service_request = ServiceRequest.query.get(Id)
            
            if not service_request or service_request.professional_id != current_user.id:
                return jsonify({"error": "Service request not found or unauthorized"}), 404

            service_request.service_status = 'Canceled'
            db.session.commit()

            return jsonify({"message": "Service request rejected successfully!"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        

   
    @app.route('/api/level', methods=['GET']) # for making the badge for professionals
    @roles_required('prof')
    def display_badge():
        profu =  User.query.filter(User.roles.any(Role.name == 'prof'))
        for pro in profu:
            compleated_services = ServiceRequest.query.filter_by(professional_id = pro.id, service_status = 'Compleated').all()
            reviews_recieved = Review.query.filter_by(professional_id = pro.id).all()
            level_data = {
                'no_ofcompleated_task': len(compleated_services),
                'average_rating': round(sum(review.rating for review in reviews_recieved) / len(reviews_recieved), 2) if reviews_recieved else 0,}
        return jsonify(level_data),200

    
    

    @app.route('/api/professional_statistics', methods=['GET'])
    @roles_required('prof')  # assuming only professionals access this
    def get_professional_statistics():
        try:
            # Get the current logged-in professional's ID
            current_professional_id = current_user.id
            
            # Total service requests handled by this professional
            total_service_requests = ServiceRequest.query.filter_by(professional_id=current_professional_id).count()
            
            # Total completed service requests
            total_completed_services = ServiceRequest.query.filter_by(professional_id=current_professional_id, service_status='Completed').count()

            # Status data for this professional
            status_data = {
                "Pending": ServiceRequest.query.filter_by(professional_id=current_professional_id, service_status='Pending').count(),
                "Accepted": ServiceRequest.query.filter_by(professional_id=current_professional_id, service_status='Accepted').count(),
                "Completed": total_completed_services,
                "Canceled": ServiceRequest.query.filter_by(professional_id=current_professional_id, service_status='Canceled').count(),
            }

            # Average rating for this professional
            average_rating = db.session.query(db.func.avg(Review.rating)).filter_by(professional_id=current_professional_id).scalar() or 0

            return jsonify({
                "totalServiceRequests": total_service_requests,
                "totalCompletedServices": total_completed_services,
                "statusData": status_data,
                "averageRating": average_rating
            }), 200

        except Exception as e:
            print(f"Error in get_professional_statistics: {e}")
            return jsonify({"error": "An error occurred while fetching statistics."}), 500
