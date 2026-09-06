import requests
import sys
import uuid
import threading
import time

BASE_URL = "http://localhost:8000"

def get_token(phone, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"phone": phone, "password": password})
    if res.status_code != 200:
        print("Login failed with:", res.text)
    return res.json().get("token")

def test_workflow_concurrency():
    print("\n--- SCENARIOS I-M: WORKFLOW & CONCURRENCY ---")
    # 1. Login Farmer
    farmer_token = get_token("9876543210", "demo123")
    if not farmer_token:
        print("❌ Farmer login failed")
        return False
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 2. Login Buyer
    buyer_token = get_token("9876543211", "demo123")
    if not buyer_token:
        print("❌ Buyer login failed")
        return False
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Get crops
    crops = requests.get(f"{BASE_URL}/api/crops").json()
    maize_id = next(c['id'] for c in crops if c['name'] == 'Maize')

    # 3. Create Lot (Scenario I)
    lot_payload = {
        "crop_id": maize_id,
        "quantity_quintals": 10.0, # 1000 kg
        "quality_grade": "Grade A",
        "expected_price_per_quintal": 2400.0,
        "market_id": 1
    }
    res_lot = requests.post(f"{BASE_URL}/api/lots", json=lot_payload, headers=farmer_headers)
    if res_lot.status_code != 200:
        print("❌ Lot creation failed:", res_lot.text)
        return False
    lot = res_lot.json()
    lot_id = lot["id"]
    print(f"✅ Lot created successfully: ID {lot_id}")

    # 4. Create Offer (Scenario J)
    offer_payload = {
        "lot_id": lot_id,
        "offered_price": 2450.0,
        "quantity": 10.0,
        "message": "I will buy all 1000 kg"
    }
    res_offer = requests.post(f"{BASE_URL}/api/offers", json=offer_payload, headers=buyer_headers)
    if res_offer.status_code != 200:
        print("❌ Offer creation failed:", res_offer.text)
        return False
    offer = res_offer.json()
    offer_id = offer["id"]
    print(f"✅ Offer created successfully: ID {offer_id}")

    # 5. Concurrency Test - Duplicate Acceptance (Scenario M)
    # The farmer will try to accept the same offer 10 times concurrently
    print("Testing concurrent acceptance of the same offer...")
    accept_results = []
    
    def accept_offer():
        res = requests.post(f"{BASE_URL}/api/transactions/", json={"offer_id": offer_id}, headers=farmer_headers)
        accept_results.append(res.status_code)

    threads = []
    for _ in range(10):
        t = threading.Thread(target=accept_offer)
        threads.append(t)
    
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    successes = accept_results.count(200)
    conflicts = accept_results.count(409)

    print(f"Concurrency results: {successes} Success, {conflicts} Conflicts. All codes: {accept_results}")
    if successes < 1:
        print("❌ Concurrency failed! Expected at least 1 success.")
        return False

    print("✅ Scenario M: Concurrent acceptance handled correctly (Exactly 1 transaction created).")
    
    # Check transaction state
    me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=farmer_headers)
    farmer_id = me_res.json()["id"]
    res_txns = requests.get(f"{BASE_URL}/api/transactions/farmer/{farmer_id}", headers=farmer_headers)
    txns = [t for t in res_txns.json() if t["lot_id"] == lot_id]
    if len(txns) != 1:
        print(f"❌ Expected 1 transaction for this lot, found {len(txns)}")
        return False
    print("✅ Transaction verification complete.")

    return True

if __name__ == "__main__":
    if test_workflow_concurrency():
        print("\n✅ All workflow tests passed.")
    else:
        print("\n❌ Workflow tests failed.")
        sys.exit(1)
