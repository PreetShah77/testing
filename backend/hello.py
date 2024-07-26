import mysql.connector
from mysql.connector import Error

# Database configuration
db_config = {
    'host': 'seslo6rad1a892smqsn38aub0o.ingress.d3akash.cloud',
    'user': 'root',
    'password': 'root',
    'database': 'crimereports',
    'port': 32651
}

# Function to alter the table
def alter_table():
    try:
        # Connect to the database
        connection = mysql.connector.connect(**db_config)

        if connection.is_connected():
            cursor = connection.cursor()
            # SQL command to alter the table
            alter_table_query = "select * from crime_reports;"
            cursor.execute(alter_table_query)
            result = cursor.fetchall()
            connection.commit()
            print(result)
        else:
            print("Failed to connect to the database")

    except Error as e:
        print(f"Error: {e}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")

# Call the function to alter the table
alter_table()
