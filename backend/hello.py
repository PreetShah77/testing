import mysql.connector
from mysql.connector import Error

def create_db_connection():
    # Replace with your actual database configuration
    db_config = {
    'host': 'seslo6rad1a892smqsn38aub0o.ingress.d3akash.cloud',
    'user': 'root',
    'password': 'root',
    'database': 'crimereports',
    'port': 32651
    }
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

def insert_report():
    insert_query = """
    INSERT INTO crime_reports 
    (type, description, latitude, longitude, address, area, timestamp, anonymous, user_info, media_url, severity, status) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    values = (
        'Fraud',
        'Fraud of 10 crore dollars',
        30.3753,
        69.3451,
        'D-2',
        'Pakistan',
        '2024-07-27 00:00:00',
        0,
        'User info here',  # Replace with actual user info
        'http://localhost:5000/static/uploads/example.jpg',  # Ensure this URL is correctly formatted
        'HIGH',
        'active'
    )

    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            cursor.execute(insert_query, values)
            connection.commit()
            print("Record inserted successfully.")
        except Error as e:
            print(f"Error inserting record: {e}")
        finally:
            cursor.close()
            close_db_connection(connection)
    else:
        print("Failed to create database connection.")

# Run the insert function
insert_report()
