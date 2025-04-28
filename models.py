from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, UserMixin , RoleMixin #using them for RBAC
from flask_security.models import fsqla_v3 as fsq
from datetime import datetime
from sqlalchemy.orm import validates


from extension import db
#security = Security()
fsq.FsModels.set_db_info(db)# will setup flask security to use the flask sql alchemy as the backend


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(90), unique = True)
    descryption = db.Column(db.String(100), unique = False)

    
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String(90), nullable=False, unique=True)
    password = db.Column(db.String(90), nullable=False)
    active = db.Column(db.Boolean)
    fs_uniquifier = db.Column(db.String(), nullable=False)
    roles = db.relationship('Role', secondary='user_roles') #many to many a user can have multiple roles  , and a role can belong to the multiple users
    
    # Common Fields inputs
    full_name = db.Column(db.String(90), nullable=False)
    mobile = db.Column(db.String(10), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    pincode = db.Column(db.String(10), nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)  # Default to UTC
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Professional inputs
    service_type = db.Column(db.String(90), nullable=True)
    experience_years = db.Column(db.Integer, nullable=True)
    documents = db.Column(db.String, nullable=True)
    blocked = db.Column(db.Boolean, default=False)
    #for the reviews one to many relation ship 
    reviews_received = db.relationship('Review', foreign_keys='Review.professional_id', backref='professional', lazy=True) # one professional can recieve many reviews 
    reviews_written = db.relationship('Review', foreign_keys='Review.customer_id', backref='customer', lazy=True) # one customer can write many reviews
 # lazy  loading has been used here for loading relationship only when needed thus saving resources

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) 
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    review_text = db.Column(db.Text, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)  

    @validates('rating')
    def validate_rating(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError("Rating must be a number.")
        if value < 1 or value > 5:
            raise ValueError("Rating must be between 1 and 5")
        return value    

class UserRoles(db.Model ):# association many to many relationship
    __tablename__= 'user_roles'
    id =db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id')) #as User  table has the default name as the user
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))# same

    
class Services(db.Model):
    __tablename__="services"
    id = db.Column(db.Integer,primary_key = True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    time_required = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable = True)
    professionals = db.relationship('ProfessionalServices', back_populates= 'service')# a professoinal can offer multiple services (many to many)  and backpopulates are used for bidirectional linkage
    def __repr__(self):
        return f"<Services(name={self.name}, price={self.price})>"   # in output for class we get <service(name="" , price="") , we can modify it to include whats important for us , helpful in debugging

class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    date_of_request = db.Column(db.DateTime, default=datetime.utcnow)
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String(20), default='Pending')
    remarks = db.Column(db.Text, nullable=True)
    service = db.relationship('Services', backref='service_requests')# a service can have multiple requests
    customer = db.relationship('User', foreign_keys=[customer_id]) # a customer can make multile requests
    professional = db.relationship('User', foreign_keys=[professional_id])  #a professional can fulfill multiple requests 
    def __repr__(self):
        return f"<ServiceRequest(name={self.service_id}, customer_id ={self.customer_id}, status={self.service_status})>" # so for the service reqest onlythe  name , customer_id  and request will be returned 

class ProfessionalServices(db.Model):
    __tablename__ = 'professional_services'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)  
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  
    service = db.relationship('Services', back_populates='professionals') # a service can be offeered by multiple professionals  
    professional = db.relationship('User', backref='professional_services') 
    def __repr__(self):
        return f"<ProfessionalServices(service_id={self.service_id}, professional_id={self.professional_id})>"
