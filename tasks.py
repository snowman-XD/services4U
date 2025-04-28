from celery import shared_task
from flask import current_app
import time
import csv
import os
from io import StringIO
from flask_excel import make_response_from_query_sets
from models import User, ServiceRequest, Review, Role
from extension import mail
from flask_mail import  Message
from sqlalchemy import and_
from datetime import datetime, timedelta
import logging
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import matplotlib.pyplot as plt


logging.basicConfig(level=logging.INFO)

@shared_task() #decorator for celery
def send_reminder(subject, body):
    time_threshold = datetime.utcnow() - timedelta(minutes=1) # ucan set threshold time for real world i need to do demo
    inactive_users = User.query.filter(User.last_login < time_threshold).all()
    
    for user in inactive_users:
        msg = Message(subject, recipients=[user.email]) # sending  to user mail id as recipitant
        msg.body = body
        try:
            mail.send(msg)
            logging.info(f"Email sent to {user.email}")
        except Exception as e:
            logging.error(f"Error sending email to {user.email}: {e}")

    return f"Emails sent to {len(inactive_users)} inactive users."




@shared_task
def export_closed_requests_to_csv():
    time.sleep(10) #will generate aafter10 sec
    closed_requests = ServiceRequest.query.filter_by(service_status='Completed').all()
    csv_data = StringIO()
    writer = csv.writer(csv_data)# creating the csv 
    writer.writerow(['Service ID', 'Customer ID', 'Professional ID', 'Date of Request', 'Remarks']) #table

    for request in closed_requests:
        writer.writerow([request.id, request.customer_id, request.professional_id, request.date_of_request, request.remarks])#values

    file_path = os.path.join('./admin-downloads', 'closed_requests.csv')
    os.makedirs(os.path.dirname(file_path), exist_ok=True)  
    with open(file_path, 'w') as f:
        f.write(csv_data.getvalue())

    logging.info("Exported closed requests ")
    return file_path

@shared_task
def export_canceled_requests_to_csv():
    time.sleep(10)
    closed_requests = ServiceRequest.query.filter_by(service_status='Canceled').all()
    csv_data = StringIO()
    writer = csv.writer(csv_data)# creating the csv 
    writer.writerow(['Service ID', 'Customer ID', 'Professional ID', 'Date of Request', 'Remarks']) #table

    for request in closed_requests:
        writer.writerow([request.id, request.customer_id, request.professional_id, request.date_of_request, request.remarks])#values

    file_path = os.path.join('./admin-downloads', 'canceled_requests.csv')
    os.makedirs(os.path.dirname(file_path), exist_ok=True)  
    with open(file_path, 'w') as f:
        f.write(csv_data.getvalue())

    logging.info("canceled requests exported to csv.")
    return file_path


# task to send monthly report to professionals --------------------



@shared_task()
def monthly_report_of_professional():
      
    professionals = User.query.filter(User.roles.any(Role.name == 'prof')).all()

    for prof in professionals:
        completed_requests = ServiceRequest.query.filter_by(
            professional_id=prof.id, 
            service_status='Completed'
        ).all()

        received_reviews = Review.query.filter_by(professional_id = prof.id).all()

        report_data = {
            'professional_name': prof.full_name,
            'total_completed_requests': len(completed_requests),
            'total_reviews': len(received_reviews),
            'average_rating': round(sum(review.rating for review in received_reviews) / len(received_reviews), 2) if received_reviews else 0,
            'completed_requests': completed_requests,
            'reviews': received_reviews
        }

        pdf_file_path = generate_pdfreport(report_data)

        if pdf_file_path:
            send_email_with_report(prof.email, pdf_file_path)




#  monthly report only for professinol------------------------------------------------

def generate_pdfreport(report_data):
    # Create the reports directory if it does not exist
    os.makedirs('./reports', exist_ok=True)
    
    #  PDF file path
    pdf_file_path = f"./reports/{report_data['professional_name'].replace(' ', '_')}_monthly_report.pdf"
    
    try:
        doc = SimpleDocTemplate(pdf_file_path, pagesize=letter)
        elements = []
        
        #  title
        elements.append(Paragraph(f"Dear -: {report_data['professional_name']},here is your monthly report", style=None))
        elements.append(Spacer(1, 12))
        
        # Summary Information
        elements.append(Paragraph(f"Total Completed_tasks: {report_data['total_completed_requests']}", style=None))
        elements.append(Paragraph(f"Total Reviews : {report_data['total_reviews']}", style=None)) # using the json data key for data from monthly report generation
        elements.append(Paragraph(f"Average Rating: {report_data['average_rating']:.2f}", style=None))
        elements.append(Spacer(1, 12))

        # Service Requests Table
        elements.append(Paragraph("Completed Service Requests:", style=None))
        data = [['Request ID', 'Customer ID', 'Completion Date']] 
        for request in report_data['completed_requests']:
            data.append([request.id, request.customer_id, request.date_of_completion.strftime('%Y-%m-%d') if request.date_of_completion else 'N/A'])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blueviolet),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

        # Reviews Table
        elements.append(Paragraph("Received Reviews:", style=None))
        review_data = [['Review ID', 'Customer ID', 'Rating', 'Review']]
        for review in report_data['reviews']:
            review_data.append([review.id, review.customer_id, review.rating, review.review_text[:50] + '...' if review.review_text and len(review.review_text) > 50 else review.review_text])

        review_table = Table(review_data)
        review_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blueviolet),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(review_table)

        # Build the PDF
        doc.build(elements)
        logging.info(f"PDF report generated for {report_data['professional_name']}")
        return pdf_file_path
    
    except Exception as e:
        logging.error(f"Error generating PDF report for {report_data['professional_name']}: {e}")
        return None

def send_email_with_report(email, pdf_file_path):
    if os.path.exists(pdf_file_path) :
        msg = Message("Your Monthly Report", recipients=[email])
        msg.body = "Please find attached your monthly report ."

        with current_app.app_context():
            with current_app.open_resource(pdf_file_path) as pdf:
                msg.attach("monthly_report.pdf", "application/pdf", pdf.read())
            
            try:
                mail.send(msg)
                logging.info(f"Email with report sent to {email}")
            except Exception as e:
                logging.error(f"Error sending report email to {email}: {e}")
    else:
        logging.error("Cannot send email: PDF or chart file does not exist.")



    

# remainder for  professionals------------------------------------------

@shared_task()
def professionals_pending_request_remainder():
    professionals = User.query.filter(User.roles.any(Role.name == 'prof')).all()

    for professional in professionals:
        pending_requests = ServiceRequest.query.filter(
            and_(
                ServiceRequest.professional_id == professional.id,
                ServiceRequest.service_status == 'Pending'  
            )
        ).all()

        if pending_requests:
            subject = "Pending Service Requests Alert"
            body = f"Dear {professional.full_name},\n\n"
            body += "You have pending service requests that require your attention:\n"

            for request in pending_requests:
                if request.customer:  
                    location = request.customer.location or "Location not provided" 
                    body += (f"- Service ID: {request.id}, Customer Name: {request.customer.full_name}, "
                             f"Location: {location}, Date of Request: {request.date_of_request}\n")

            body += "\nPlease visit your dashboard to accept or reject these requests."
            msg = Message(subject, recipients=[professional.email])
            msg.body = body
            try:
                mail.send(msg)
                logging.info(f"Alert sent to {professional.email} regarding pending requests.")
            except Exception as e:
                logging.error(f"Error sending alert to {professional.email}: {e}")

    return "Pending request alerts sent to professionals."







