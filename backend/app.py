from flask import Flask, request, jsonify, url_for, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import csv
from datetime import datetime
import os
import pymysql.cursors
from werkzeug.utils import secure_filename
import g4f
from g4f import Provider
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import base64
import openai
import textwrap
import pandas as pd
import requests
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from geopy.distance import geodesic

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MySQL Configuration
db_config = {
    'host': 'seslo6rad1a892smqsn38aub0o.ingress.d3akash.cloud',
    'user': 'root',
    'password': 'root',
    'database': 'crimereports',
    'port': 32651
}

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    return None

def close_db_connection(connection):
    if connection.is_connected():
        connection.close()

def create_table():
    connection = create_db_connection()
    if connection is None:
        return

    create_table_query = """
    CREATE TABLE IF NOT EXISTS crime_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        address TEXT,
        area VARCHAR(100),
        timestamp DATETIME NOT NULL,
        anonymous BOOLEAN NOT NULL,
        user_info TEXT,
        media_url VARCHAR(200),
        status enum('active','solved'),
        severity TEXT,
        solved_by VARCHAR(255)
    )
    """
    
    try:
        cursor = connection.cursor()
        cursor.execute(create_table_query)
        connection.commit()
    except Error as e:
        print(f"Error creating table: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            close_db_connection(connection)

def send_email(to_email, subject, body):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "preetshah0707@gmail.com"
    sender_password = "halwqybnedqhxpql"

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, sender_password)
        text = message.as_string()
        server.sendmail(sender_email, to_email, text)
        print(f"Email sent successfully to {to_email}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {str(e)}")
    except smtplib.SMTPException as e:
        print(f"SMTP Exception: {str(e)}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
    finally:
        try:
            server.quit()
        except:
            pass

def get_address(latitude, longitude):
    geolocator = Nominatim(user_agent="crime_report_app")
    try:
        location = geolocator.reverse(f"{latitude}, {longitude}", timeout=10)
        if location:
            address = location.raw.get('address', {})
            postcode = address.get('postcode', '')
            return {
                'full_address': location.address,
                'postcode': postcode
            }
        return None
    except GeocoderTimedOut:
        return None

def get_area_by_pincode(postcode):
    try:
        response = requests.get(f"https://api.postalpincode.in/pincode/384012")
        if response.status_code == 200:
            data = response.json()
            if data[0]['Status'] == 'Success' and data[0]['PostOffice']:
                post_office = data[0]['PostOffice'][0]
                area = post_office['Name']
                return area
        return "Unknown Area"
    except Exception as e:
        return "Unknown Area"
    
@app.route('/api/reports', methods=['GET'])
def get_reports():
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM crime_reports")
        reports = cursor.fetchall()
        return jsonify(reports)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            close_db_connection(connection)

@app.route('/api/crimes', methods=['GET'])
def get_crimes():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            search = request.args.get('search', '')
            sql = f"""
                SELECT id, type, description, latitude, longitude, timestamp, anonymous, media_url, user_info 
                FROM crime_reports 
                WHERE type LIKE %s OR description LIKE %s
            """
            cursor.execute(sql, (f'%{search}%', f'%{search}%'))
            crimes = cursor.fetchall()

            for crime in crimes:
                crime['timestamp'] = crime['timestamp'].isoformat()

            return jsonify(crimes)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Failed to fetch data'}), 500
    finally:
        connection.close()

@app.route('/api/crimes_for_map', methods=['GET'])
def get_crimes_for_map():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT id, type, description, latitude, longitude, timestamp, media_url
                FROM crime_reports WHERE status = 'active'
            """
            cursor.execute(sql)
            crimes = cursor.fetchall()
            
            for crime in crimes:
                crime['timestamp'] = crime['timestamp'].isoformat()
            
            return jsonify(crimes)
    except Exception as e:
        print(f"Error fetching crimes for map: {e}")
        return jsonify({'error': 'Failed to fetch crimes for map'}), 500
    finally:
        connection.close()

@app.route('/api/reports', methods=['POST'])
def create_report():
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        type = request.form.get('type')
        description = request.form.get('description')
        latitude = float(request.form.get('latitude'))
        longitude = float(request.form.get('longitude'))
        anonymous = request.form.get('anonymous', 'false').lower() == 'true'

        user_id = request.form.get('userId')
        user_email = request.form.get('userEmail')
        user_name = request.form.get('username')
        user_info = f"User ID: {user_id}, Email: {user_email}, Name: {user_name}"

        media_url = None
        if 'media' in request.files:
            file = request.files['media']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                media_url = f"http://localhost:5050/static/uploads/{filename}"

        timestamp = datetime.now()
        severity = get_crime_severity(type, description)
        
        address_info = get_address(latitude, longitude)
        address = address_info['full_address'] if address_info else None
        postcode = address_info['postcode'] if address_info else None
        area = get_area_by_pincode(postcode) if postcode else None

        cursor = connection.cursor()
        insert_query = """
        INSERT INTO crime_reports (type, description, latitude, longitude, address, area, timestamp, anonymous, user_info, media_url, severity, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            type, description, latitude, longitude, address, area, timestamp,
            anonymous, user_info, media_url, severity, 'active'
        ))
        connection.commit()

        new_report = {
            'id': cursor.lastrowid,
            'type': type,
            'description': description,
            'latitude': latitude,
            'longitude': longitude,
            'address': address,
            'area': area,
            'timestamp': timestamp.isoformat(),
            'anonymous': anonymous,
            'user_info': user_info if not anonymous else None,
            'media_url': media_url,
            'severity': severity,
            'status': 'active'
        }
        return jsonify(new_report), 201

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def get_crime_severity(type, description):
    client = openai.OpenAI(
        api_key="sk-Wq92WAfzC2S6_3-HsyC_0A",
        base_url="https://chatapi.akash.network/api/v1"
    )

    prompt = f"Given the crime type: '{type}' and description: '{description}', classify the severity as HIGH, MEDIUM, or LOW. Respond with only the severity level."

    try:
        response = client.chat.completions.create(
            model="llama3-8b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        severity = response.choices[0].message.content.strip().upper()
        if severity not in ["HIGH", "MEDIUM", "LOW"]:
            raise ValueError("Unexpected severity level")
        return severity
    except openai.APIConnectionError as e:
        print(f"Error connecting to the API: {str(e)}")
        return "CONNECTION_ERROR"
    except openai.APIError as e:
        print(f"API error: {str(e)}")
        return "API_ERROR"
    except Exception as e:
        print(f"Unexpected error in determining severity: {str(e)}")
        return "UNKNOWN"

@app.route('/api/solve_case/<int:case_id>', methods=['PUT'])
def solve_case(case_id):
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            solved_by = request.json.get('solvedBy', 'Unknown Officer')
            
            sql_select = "SELECT * FROM crime_reports WHERE id = %s"
            cursor.execute(sql_select, (case_id,))
            case = cursor.fetchone()

            if not case:
                return jsonify({'error': 'Case not found'}), 404

            sql_update = "UPDATE crime_reports SET status = 'solved', solved_by = %s WHERE id = %s"
            cursor.execute(sql_update, (solved_by, case_id))
            connection.commit()

            user_info = case['user_info']
            user_email = None
            if user_info:
                email_start = user_info.find("Email: ") + 7
                email_end = user_info.find(",", email_start)
                user_email = user_info[email_start:email_end].strip()

            if user_email:
                subject = "Your Reported Crime Case Has Been Solved"
                body = f"""
                Dear User,

                We are pleased to inform you that the crime case you reported has been solved.

                Case Details:
                ID: {case['id']}
                Type: {case['type']}
                Description: {case['description']}
                Location: Latitude {case['latitude']}, Longitude {case['longitude']}
                Reported on: {case['timestamp']}

                Thank you for your cooperation in helping us maintain a safer community.

                Best regards,
                Your Local Police Department
                """

                send_email(user_email, subject, body)

            return jsonify({'message': 'Case marked as solved and user notified'}), 200
    except Exception as e:
        print(f"Error solving case: {e}")
        return jsonify({'error': 'Failed to mark case as solved'}), 500
    finally:
        connection.close()

@app.route('/api/police_dashboard', methods=['GET'])
def get_police_dashboard():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            admin_latitude = float(request.args.get('latitude', 0))
            admin_longitude = float(request.args.get('longitude', 0))
            
            sql = """
                SELECT id, type, description, latitude, longitude, timestamp, anonymous, media_url, area, severity,
                CASE WHEN anonymous = 0 THEN user_info ELSE NULL END as user_info, status
                FROM crime_reports 
                WHERE status = 'active'
            """
            cursor.execute(sql)
            reports = cursor.fetchall()
            
            # Filter reports within 5km radius
            filtered_reports = []
            for report in reports:
                report_location = (report['latitude'], report['longitude'])
                admin_location = (admin_latitude, admin_longitude)
                distance = geodesic(admin_location, report_location).kilometers
                if distance <= 0.5:
                    filtered_reports.append(report)
            
            return jsonify(filtered_reports)
    except Exception as e:
        print(f"Error fetching police dashboard reports: {e}")
        return jsonify({'error': 'Failed to fetch police dashboard reports'}), 500
    finally:
        connection.close()

@app.route('/api/user_reports/<user_email>', methods=['GET'])
def get_user_reports(user_email):
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT id, type, description, latitude, longitude, timestamp, anonymous, media_url, user_info, status, area, solved_by
                FROM crime_reports 
                WHERE user_info LIKE %s
            """
            cursor.execute(sql, (f'%{user_email}%',))
            reports = cursor.fetchall()
            return jsonify(reports)
    except Exception as e:
        print(f"Error fetching user reports: {e}")
        return jsonify({'error': 'Failed to fetch user reports'}), 500
    finally:
        connection.close()

@app.route('/static/uploads/<path:filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/image_gallery')
def image_gallery():
    image_files = [f for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)]
    
    html = '<h1>Image Gallery</h1>'
    for image in image_files:
        html += f'<p><a href="/uploads/{image}">{image}</a></p>'
    
    return html

@app.route('/api/download_crimes', methods=['GET'])
def download_crimes():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT id, type, description, latitude, longitude, area, anonymous, media_url, user_info, status, severity FROM crime_reports WHERE status = 'solved'")
            solved_crimes = cursor.fetchall()
            
            cursor.execute("SELECT id, type, description, latitude, longitude, area, anonymous, media_url, user_info, status, severity FROM crime_reports WHERE status = 'active'")
            unsolved_crimes = cursor.fetchall()

            df_solved = pd.DataFrame(solved_crimes)
            df_unsolved = pd.DataFrame(unsolved_crimes)

            file_path = 'crime_reports.xlsx'
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df_solved.to_excel(writer, sheet_name='Solved Crimes', index=False)
                df_unsolved.to_excel(writer, sheet_name='Unsolved Crimes', index=False)

        return send_from_directory(directory='.', path=file_path, as_attachment=True)
    except Exception as e:
        print(f"Error downloading crimes: {e}")
        return jsonify({'error': 'Failed to download crime reports'}), 500
    finally:
        connection.close()

@app.route('/api/reraise_case/<int:case_id>', methods=['PUT'])
def reraise_case(case_id):
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql_select = "SELECT * FROM crime_reports WHERE id = %s"
            cursor.execute(sql_select, (case_id,))
            case = cursor.fetchone()

            if not case:
                return jsonify({'error': 'Case not found'}), 404

            sql_update = "UPDATE crime_reports SET status = 'active', solved_by = NULL WHERE id = %s"
            cursor.execute(sql_update, (case_id,))
            connection.commit()

            user_info = case['user_info']
            user_email = None
            if user_info:
                email_start = user_info.find("Email: ") + 7
                email_end = user_info.find(",", email_start)
                user_email = user_info[email_start:email_end].strip()

            if user_email:
                subject = "Your Reported Crime Case Has Been Re-opened"
                body = f"""
                Dear User,

                We are writing to inform you that the crime case you reported has been re-opened.

                Case Details:
                ID: {case['id']}
                Type: {case['type']}
                Description: {case['description']}
                Location: Latitude {case['latitude']}, Longitude {case['longitude']}
                Reported on: {case['timestamp']}

                Thank you for your cooperation.

                Best regards,
                Your Local Police Department
                """

                send_email(user_email, subject, body)

            return jsonify({'message': 'Case re-opened and user notified'}), 200
    except Exception as e:
        print(f"Error re-opening case: {e}")
        return jsonify({'error': 'Failed to re-open case'}), 500
    finally:
        connection.close()

@app.route('/api/sos', methods=['POST'])
def handle_sos():
    data = request.json
    image_data = data['image']
    latitude = data['latitude']
    longitude = data['longitude']

    filename = f"sos_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    image_data = image_data.split(',')[1]  # Remove the data URL prefix
    with open(file_path, "wb") as f:
        f.write(base64.b64decode(image_data))

    try:
        connection = create_db_connection()
        cursor = connection.cursor()
        insert_query = """
        INSERT INTO crime_reports (type, description, latitude, longitude, timestamp, anonymous, media_url, severity, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            "SOS",
            "Emergency SOS report",
            latitude,
            longitude,
            datetime.now(),
            True,
            f"http://localhost:5050/static/uploads/{filename}",
            "HIGH",
            "active"
        ))
        connection.commit()

        return jsonify({"message": "SOS received and processed"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    create_table()
    app.run(debug=True, port=5050, host='0.0.0.0')