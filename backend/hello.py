from geopy.geocoders import Photon
import time

def get_location_info(latitude, longitude):
    # Initialize Photon geocoder
    geolocator = Photon(user_agent="YourAppName/1.0")

    # Add a small delay to avoid overwhelming the service
    time.sleep(1)

    # Reverse geocoding
    location = geolocator.reverse(f"{latitude}, {longitude}")

    if location:
        address = location.raw['properties']
        
        # Extract relevant information
        country = address.get('country', '')
        state = address.get('state', '')
        city = address.get('city', '')
        postcode = address.get('postcode', '')
        road = address.get('street', '')
        house_number = address.get('housenumber', '')

        return {
            'full_address': location.address,
            'country': country,
            'state': state,
            'city': city,
            'postcode': postcode,
            'road': road,
            'house_number': house_number
        }
    else:
        return None

# Example usage
latitude = 23.5275
longitude =72.4582

location_info = get_location_info(latitude, longitude)

if location_info:
    print("Full Address:", location_info['full_address'])
    print("Country:", location_info['country'])
    print("State:", location_info['state'])
    print("City:", location_info['city'])
    print("Postcode:", location_info['postcode'])
    print("Road:", location_info['road'])
    print("House Number:", location_info['house_number'])
else:
    print("Location not found")

# Function to get pincode for a given latitude and longitude
def get_pincode(latitude, longitude):
    location_info = get_location_info(latitude, longitude)
    if location_info and location_info['postcode']:
        return location_info['postcode']
    else:
        return "Pincode not found"

# Example usage of get_pincode function
pincode = get_pincode(23.5275, 72.4582)
print(f"Pincode for the given coordinates: {pincode}")