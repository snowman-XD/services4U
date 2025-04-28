from  flask_security import SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from extension import db
from datetime import datetime

def cooking_data(user_datastore: SQLAlchemyUserDatastore):
    print('--creating data--')
    #INITIALIZING THE 3 ROLES
    user_datastore.find_or_create_role(name='admin', descryption="Administration")
    user_datastore.find_or_create_role(name= 'prof', descryption = "Professional")
    user_datastore.find_or_create_role(name= 'cust', descryption = 'costumer')

    #default data storing admin info hardcoded
    if not user_datastore.find_user(email = 'admin'):
        user_datastore.create_user(email = 'admin', 
                                   password = hash_password('admin'),
                                    active = True ,
                                    roles = ['admin'],
                                    full_name = 'admin ji',
                                    mobile = '9999999999',
                                    location= 'city',
                                    pincode = '001222',
                                    date_created = datetime.utcnow()
                                   )
    db.session.commit()
