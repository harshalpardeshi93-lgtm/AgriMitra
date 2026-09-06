import requests
import concurrent.futures
import time

BASE_URL = "http://127.0.0.1:8000/api"

def login(phone, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": phone, "password": password})
    return resp.json()["token"]

def main():
    print("=========================================")
    print("      PHASE 5 CONCURRENCY TESTS         ")
    print("=========================================")
    
    # 1. Login
    farmer_token = login("9876543210", "demo123")
    buyer1_token = login("9876543211", "demo123")
    buyer2_token = login("9876543212", "demo123") 
    
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    buyer1_headers = {"Authorization": f"Bearer {buyer1_token}"}
    buyer2_headers = {"Authorization": f"Bearer {buyer2_token}"}
    
    # 2. Create Lot
    lot_data = {
        "crop_id": 1,
        "market_id": 1,
        "quantity_quintals": 50,
        "quality_grade": "Grade A",
        "expected_price_per_quintal": 5000,
        "status": "Available"
    }
    lot_resp = requests.post(f"{BASE_URL}/lots/", json=lot_data, headers=farmer_headers)
    lot_id = lot_resp.json()["id"]
    print(f"Created Lot ID: {lot_id}")
    
    # 3. Create Offers
    offer1_resp = requests.post(f"{BASE_URL}/offers/", json={
        "lot_id": lot_id,
        "offered_price": 4900,
        "quantity": 20,
        "message": "Buyer 1 offer"
    }, headers=buyer1_headers)
    offer1_id = offer1_resp.json()["id"]
    
    offer2_resp = requests.post(f"{BASE_URL}/offers/", json={
        "lot_id": lot_id,
        "offered_price": 5100,
        "quantity": 30,
        "message": "Buyer 2 offer"
    }, headers=buyer1_headers) 
    offer2_id = offer2_resp.json()["id"]
    
    print(f"Created Offer 1 ID: {offer1_id}")
    print(f"Created Offer 2 ID: {offer2_id}")
    
    # SCENARIO A: DUPLICATE ACCEPTANCE (Same offer accepted multiple times concurrently)
    print("\n--- SCENARIO A: DUPLICATE ACCEPTANCE ---")
    
    def accept_offer(offer_id):
        # We use PATCH /offers/{offer_id}/status
        return requests.patch(
            f"{BASE_URL}/offers/{offer_id}/status", 
            json={"status": "Accepted"}, 
            headers=farmer_headers
        )
    
    # Send 10 concurrent requests to accept offer 1
    num_requests = 10
    success_count = 0
    conflict_count = 0
    
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_requests) as executor:
        futures = [executor.submit(accept_offer, offer1_id) for _ in range(num_requests)]
        for future in concurrent.futures.as_completed(futures):
            resp = future.result()
            if resp.status_code == 200:
                success_count += 1
            elif resp.status_code == 409:
                conflict_count += 1
            else:
                print(f"Unexpected status: {resp.status_code} - {resp.text}")
                
    end_time = time.time()
    print(f"Sent {num_requests} concurrent requests to accept Offer {offer1_id} in {end_time - start_time:.2f}s")
    print(f"Successful (200): {success_count}")
    print(f"Conflicts (409): {conflict_count}")
    
    if success_count == 1 and conflict_count == num_requests - 1:
        print("SCENARIO A: PASS")
    else:
        print("SCENARIO A: FAIL")
        
    # SCENARIO B: OVERSELLING / COMPETING OFFERS FOR SAME LOT
    print("\n--- SCENARIO B: COMPETING OFFERS FOR SAME LOT ---")
    
    # Lot was sold to Offer 1. Now try accepting Offer 2.
    # It should fail because lot is no longer Available/Offer Received.
    resp2 = accept_offer(offer2_id)
    print(f"Attempting to accept Offer {offer2_id} sequentially. Result: {resp2.status_code}")
    if resp2.status_code == 409:
        print("Sequential Overselling check: PASS")
    else:
        print("Sequential Overselling check: FAIL")

    # Let's create a NEW lot and test pure concurrent competing offers
    print("\n--- SCENARIO C: CONCURRENT COMPETING OFFERS ---")
    lot2_resp = requests.post(f"{BASE_URL}/lots/", json=lot_data, headers=farmer_headers)
    lot2_id = lot2_resp.json()["id"]
    
    offer3_resp = requests.post(f"{BASE_URL}/offers/", json={
        "lot_id": lot2_id,
        "offered_price": 5000,
        "quantity": 25
    }, headers=buyer1_headers)
    offer3_id = offer3_resp.json()["id"]
    
    offer4_resp = requests.post(f"{BASE_URL}/offers/", json={
        "lot_id": lot2_id,
        "offered_price": 5200,
        "quantity": 25
    }, headers=buyer1_headers)
    offer4_id = offer4_resp.json()["id"]
    
    # We will race accepting Offer 3 and Offer 4
    success_c_count = 0
    conflict_c_count = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(accept_offer, offer3_id)
        f2 = executor.submit(accept_offer, offer4_id)
        
        for future in concurrent.futures.as_completed([f1, f2]):
            resp = future.result()
            if resp.status_code == 200:
                success_c_count += 1
            elif resp.status_code == 409:
                conflict_c_count += 1
            else:
                print(f"Unexpected status: {resp.status_code} - {resp.text}")
                
    print(f"Successful Acceptances (200): {success_c_count}")
    print(f"Conflicts (409): {conflict_c_count}")
    
    if success_c_count == 1 and conflict_c_count == 1:
        print("SCENARIO C: PASS")
    else:
        print("SCENARIO C: FAIL")
        
    # Verify final transactions for Lot 2
    # Only 1 transaction should exist
    txns = requests.get(f"{BASE_URL}/transactions/farmer/1", headers=farmer_headers).json()
    lot2_txns = [t for t in txns if t["lot_id"] == lot2_id]
    
    final_lot = requests.get(f"{BASE_URL}/lots/{lot2_id}", headers=farmer_headers).json()
    final_offer3 = requests.get(f"{BASE_URL}/offers/lot/{lot2_id}", headers=farmer_headers).json()
    
    o3 = next((o for o in final_offer3 if o["id"] == offer3_id), None)
    o4 = next((o for o in final_offer3 if o["id"] == offer4_id), None)
    
    print("\n--- FINAL SCENARIO C STATE EVIDENCE ---")
    print(f"Lot {lot2_id} Final Status: {final_lot.get('status')}")
    print(f"Offer {offer3_id} Final Status: {o3.get('status') if o3 else 'Unknown'}")
    print(f"Offer {offer4_id} Final Status: {o4.get('status') if o4 else 'Unknown'}")
    print(f"Total transactions for Lot {lot2_id}: {len(lot2_txns)}")
    
    if len(lot2_txns) == 1 and final_lot.get("status") == "Sold" and (o3.get("status") == "Accepted" or o4.get("status") == "Accepted"):
        print("Final Invariant Check: PASS")
    else:
        print("Final Invariant Check: FAIL")

if __name__ == "__main__":
    main()
