from flask import jsonify, render_template, render_template_string, request, send_file,send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore
from flask_security.utils import hash_password, verify_password
from extension import db
from models import Review, Services, ServiceRequest, ProfessionalServices,User,UserRoles
from datetime import datetime


def admin_creation(app, user_datastore: SQLAlchemyUserDatastore):




    @app.route('/api/services', methods=['GET'])
    def list_services():
        services = Services.query.all()
        return jsonify([{
            'id': service.id,
            'name': service.name,
            'price': service.price,
            'time_required': service.time_required,
            'description': service.description
        } for service in services]), 200

    # Add service
    @roles_required('admin')
    @app.route('/add-service', methods=['POST'])
    def add_service():
        data = request.get_json()
        new_service = Services(
            name=data.get('name'),
            price=data.get('price'),
            time_required=data.get('time_required'),
            description=data.get('description')
        )
        db.session.add(new_service)
        db.session.commit()
        return jsonify({'message': 'Service added successfully'}), 201
    
    @app.route('/services', methods=['GET'])
    def get_services_list():  
        services = Services.query.all()
        return jsonify([{
            'id': service.id,
            'name': service.name,
            'price': service.price,
            'time_required': service.time_required,
            'description': service.description
        } for service in services]), 200
   
    @roles_required('admin')
    @app.route('/update-service/<int:service_id>', methods=['PUT'])
    def update_service(service_id):
        service_data = request.get_json()
        service = Services.query.get(service_id) 
        if not service:
            return jsonify({'message': 'Service not found'}), 404

        # Updating service fields
        service.name = service_data['name']
        service.price = service_data['price']
        service.time_required = service_data['time_required']
        service.description = service_data['description']
        
        db.session.commit()  
        return jsonify({'message': 'Service updated successfully'}), 200

    @roles_required('admin')
    @app.route('/delete-service/<id>', methods=['DELETE'])
    def delete_service(id):
        service = Services.query.get(id)
        if not service:
            return jsonify({'message': 'Service not found'}), 404

        db.session.delete(service)
        db.session.commit()
        return jsonify({'message': 'Service deleted successfully'}), 200

