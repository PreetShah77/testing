from flask import Flask, request, jsonify, url_for, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import csv
from datetime import datetime
import os
import pymysql.cursors

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MySQL Configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'crimereports'
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
        timestamp DATETIME NOT NULL,
        anonymous BOOLEAN NOT NULL,
        user_info TEXT,
        media_url VARCHAR(200)
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
                FROM crime_reports 
            """
            cursor.execute(sql)
            crimes = cursor.fetchall()
            
            # Convert timestamp to string to make it JSON serializable
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
        # Handle form data
        type = request.form.get('type')
        description = request.form.get('description')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        anonymous = request.form.get('anonymous', 'false').lower() == 'true'

        # Always handle user info, even for anonymous reports
        user_id = request.form.get('userId')
        user_email = request.form.get('userEmail')
        user_name = request.form.get('username')
        user_phone = request.form.get('phonenumber')
        user_info = f"User ID: {user_id}, Email: {user_email}, Name: {user_name}, Phone-number: {user_phone}"

        # Handle file upload
        media_url = None
        if 'media' in request.files:
                file = request.files['media']
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    media_url = f"http://localhost:5050/static/uploads/{filename}" 

        timestamp = datetime.now()

        # Insert into database
        cursor = connection.cursor()
        insert_query = """
        INSERT INTO crime_reports (type, description, latitude, longitude, timestamp, anonymous, user_info, media_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            type,
            description,
            latitude,
            longitude,
            timestamp,
            anonymous,
            user_info,
            media_url
        ))
        connection.commit()

        new_report = {
            'id': cursor.lastrowid,
            'type': type,
            'description': description,
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': timestamp.isoformat(),
            'anonymous': anonymous,
            'user_info': user_info if not anonymous else None,
            'media_url': media_url
        }



        return jsonify(new_report), 201

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            close_db_connection(connection)

@app.route('/api/solve_case/<int:case_id>', methods=['PUT'])
def solve_case(case_id):
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            sql = "UPDATE crime_reports SET status = 'solved' WHERE id = %s"
            cursor.execute(sql, (case_id,))
            connection.commit()
        return jsonify({'message': 'Case marked as solved'}), 200
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
            sql = """
                SELECT id, type, description, latitude, longitude, timestamp, anonymous, media_url,
                CASE WHEN anonymous = 0 THEN user_info ELSE NULL END as user_info, status
                FROM crime_reports 
                WHERE status = 'active'
            """
            cursor.execute(sql)
            reports = cursor.fetchall()
            return jsonify(reports)
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
                SELECT id, type, description, latitude, longitude, timestamp, anonymous, media_url, user_info, status
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

if __name__ == '__main__':
    create_table()
    app.run(debug=True,port=5050)