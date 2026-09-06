import requests

BASE_URL = "http://127.0.0.1:8000/api"

def login(phone, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": phone, "password": password})
    return resp.json()["token"]

def main():
    print("=========================================")
    print("      PHASE 6 STATE TRANSITION TESTS    ")
    print("=========================================")
    
    farmer_token = login("9876543210", "demo123")
    buyer_token = login("9876543211", "demo123")
    
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # 1. Create Lot
    lot_resp = requests.post(f"{BASE_URL}/lots/", json={
        "crop_id": 1,
        "market_id": 1,
        "quantity_quintals": 10,
        "quality_grade": "Grade A",
        "expected_price_per_quintal": 5000,
        "status": "Available"
    }, headers=farmer_headers)
    lot_id = lot_resp.json()["id"]
    
    # 2. Create Offer
    offer_resp = requests.post(f"{BASE_URL}/offers/", json={
        "lot_id": lot_id,
        "offered_price": 4900,
        "quantity": 10,
        "message": "Buyer offer"
    }, headers=buyer_headers)
    offer_id = offer_resp.json()["id"]
    
    # 3. Accept Offer (Creates Transaction)
    accept_resp = requests.patch(
        f"{BASE_URL}/offers/{offer_id}/status", 
        json={"status": "Accepted"}, 
        headers=farmer_headers
    )
    
    # Find the transaction
    txns = requests.get(f"{BASE_URL}/transactions/farmer/1", headers=farmer_headers).json()
    txn = next(t for t in txns if t["offer_id"] == offer_id)
    txn_id = txn["id"]
    print(f"Transaction ID {txn_id} created. Initial states:")
    print(f"  Payment: {txn['payment_status']} | Transaction: {txn['transaction_status']}")
    
    # ==========================================================
    # PAYMENT STATE TESTS (Buyer Only)
    # ==========================================================
    print("\n--- Testing Payment States ---")
    
    # Valid: Pending -> Processing
    resp = requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", json={"payment_status": "Processing"}, headers=buyer_headers)
    print(f"Update to Processing: {resp.status_code}")
    
    # Invalid: Processing -> Pending
    resp = requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", json={"payment_status": "Pending"}, headers=buyer_headers)
    print(f"Backward to Pending: {resp.status_code}") # Expect 409
    
    # Valid: Processing -> Paid
    resp = requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", json={"payment_status": "Paid"}, headers=buyer_headers)
    print(f"Update to Paid: {resp.status_code}")
    
    # Invalid: Paid -> Pending
    resp = requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", json={"payment_status": "Pending"}, headers=buyer_headers)
    print(f"Backward from Paid to Pending: {resp.status_code}") # Expect 409
    
    # Fetch latest state (Payment Paid should auto-set Transaction to Completed)
    txn = requests.get(f"{BASE_URL}/transactions/{txn_id}", headers=buyer_headers).json()
    print(f"State after Paid - Payment: {txn['payment_status']} | Transaction: {txn['transaction_status']}")
    
    # ==========================================================
    # TRANSACTION STATE TESTS (Farmer Only)
    # ==========================================================
    print("\n--- Testing Transaction States ---")
    
    # Invalid: Completed -> In Progress
    resp = requests.patch(f"{BASE_URL}/transactions/{txn_id}/status", json={"transaction_status": "In Progress"}, headers=farmer_headers)
    print(f"Backward from Completed to In Progress: {resp.status_code}") # Expect 409
    
    # Let's create another transaction to test other forward states cleanly
    lot2_resp = requests.post(f"{BASE_URL}/lots/", json={"crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "Grade B", "expected_price_per_quintal": 4000, "status": "Available"}, headers=farmer_headers)
    offer2_resp = requests.post(f"{BASE_URL}/offers/", json={"lot_id": lot2_resp.json()["id"], "offered_price": 4000, "quantity": 10, "message": "Offer 2"}, headers=buyer_headers)
    requests.patch(f"{BASE_URL}/offers/{offer2_resp.json()['id']}/status", json={"status": "Accepted"}, headers=farmer_headers)
    
    txns2 = requests.get(f"{BASE_URL}/transactions/farmer/1", headers=farmer_headers).json()
    txn2 = next(t for t in txns2 if t["offer_id"] == offer2_resp.json()["id"])
    txn2_id = txn2["id"]
    
    print(f"\nTransaction ID {txn2_id} created. Initial states:")
    print(f"  Payment: {txn2['payment_status']} | Transaction: {txn2['transaction_status']}")
    
    # Valid: Confirmed -> In Progress
    resp = requests.patch(f"{BASE_URL}/transactions/{txn2_id}/status", json={"transaction_status": "In Progress"}, headers=farmer_headers)
    print(f"Update to In Progress: {resp.status_code}")
    
    # Invalid: In Progress -> Confirmed
    resp = requests.patch(f"{BASE_URL}/transactions/{txn2_id}/status", json={"transaction_status": "Confirmed"}, headers=farmer_headers)
    print(f"Backward to Confirmed: {resp.status_code}") # Expect 409
    
    # Valid: In Progress -> Cancelled
    resp = requests.patch(f"{BASE_URL}/transactions/{txn2_id}/status", json={"transaction_status": "Cancelled"}, headers=farmer_headers)
    print(f"Update to Cancelled: {resp.status_code}")
    
    # Invalid: Cancelled -> Completed
    resp = requests.patch(f"{BASE_URL}/transactions/{txn2_id}/status", json={"transaction_status": "Completed"}, headers=farmer_headers)
    print(f"Backward/Invalid Cancelled to Completed: {resp.status_code}") # Expect 409
    
if __name__ == "__main__":
    main()
