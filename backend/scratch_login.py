import requests
BASE_URL = "http://localhost:8000/api"

def debug():
    buyer_login = requests.post(f"{BASE_URL}/auth/login", json={"phone": "9876543211", "password": "password123"})
    print("Buyer login:", buyer_login.status_code, buyer_login.text)
    
    farmer_login = requests.post(f"{BASE_URL}/auth/login", json={"phone": "9876543210", "password": "password123"})
    print("Farmer login:", farmer_login.status_code, farmer_login.text)

if __name__ == "__main__":
    debug()
