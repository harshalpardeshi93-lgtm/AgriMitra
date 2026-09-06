import requests
import threading
import sys
import uuid

BASE_URL = "http://localhost:8000"

def get_token(phone, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"phone": phone, "password": password})
    return res.json().get("token")

def test_same_offer_concurrency():
    print("\n--- TEST 1: 10 REQUESTS FOR SAME OFFER ---")
    farmer_token = get_token("9876543210", "demo123")
    buyer_token = get_token("9876543211", "demo123")
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Get a crop
    crops = requests.get(f"{BASE_URL}/api/crops").json()
    maize_id = next(c['id'] for c in crops if c['name'] == 'Maize')

    # Create 1 Lot
    lot_payload = {
        "crop_id": maize_id,
        "quantity_quintals": 10.0,
        "quality_grade": "Grade A",
        "expected_price_per_quintal": 2400.0,
        "market_id": 1
    }
    res_lot = requests.post(f"{BASE_URL}/api/lots", json=lot_payload, headers=farmer_headers)
    lot_id = res_lot.json()["id"]

    # Create 1 Offer
    offer_payload = {
        "lot_id": lot_id,
        "offered_price": 2450.0,
        "quantity": 10.0,
        "message": "I will buy all"
    }
    res_offer = requests.post(f"{BASE_URL}/api/offers", json=offer_payload, headers=buyer_headers)
    offer_id = res_offer.json()["id"]

    # Concurrently Accept Offer 10 times
    accept_results = []
    
    def accept_offer():
        res = requests.post(f"{BASE_URL}/api/transactions/", json={"offer_id": offer_id}, headers=farmer_headers)
        accept_results.append(res.status_code)

    threads = []
    for _ in range(10):
        t = threading.Thread(target=accept_offer)
        threads.append(t)
    
    for t in threads: t.start()
    for t in threads: t.join()

    successes = accept_results.count(200)
    conflicts = accept_results.count(409)

    print(f"Results for SAME offer: {successes} x 200, {conflicts} x 409")
    print(f"All codes: {accept_results}")

    # Check transactions
    me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=farmer_headers)
    farmer_id = me_res.json()["id"]
    res_txns = requests.get(f"{BASE_URL}/api/transactions/farmer/{farmer_id}", headers=farmer_headers)
    txns = [t for t in res_txns.json() if t["lot_id"] == lot_id]
    print(f"Transaction count for lot {lot_id}: {len(txns)}")

def test_competing_offers_concurrency():
    print("\n--- TEST 2: COMPETING OFFERS FOR SAME LOT ---")
    farmer_token = get_token("9876543210", "demo123")
    buyer_token = get_token("9876543211", "demo123")
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Get a crop
    crops = requests.get(f"{BASE_URL}/api/crops").json()
    maize_id = next(c['id'] for c in crops if c['name'] == 'Maize')

    # Create 1 Lot
    lot_payload = {
        "crop_id": maize_id,
        "quantity_quintals": 10.0,
        "quality_grade": "Grade A",
        "expected_price_per_quintal": 2400.0,
        "market_id": 1
    }
    res_lot = requests.post(f"{BASE_URL}/api/lots", json=lot_payload, headers=farmer_headers)
    lot_id = res_lot.json()["id"]

    # Create Offer A
    offer_a_payload = {
        "lot_id": lot_id,
        "offered_price": 2450.0,
        "quantity": 10.0,
        "message": "Offer A"
    }
    res_offer_a = requests.post(f"{BASE_URL}/api/offers", json=offer_a_payload, headers=buyer_headers)
    offer_a_id = res_offer_a.json()["id"]

    # Create Offer B
    offer_b_payload = {
        "lot_id": lot_id,
        "offered_price": 2480.0,
        "quantity": 10.0,
        "message": "Offer B"
    }
    res_offer_b = requests.post(f"{BASE_URL}/api/offers", json=offer_b_payload, headers=buyer_headers)
    offer_b_id = res_offer_b.json()["id"]

    # Concurrently Accept Offer A (5 times) and Offer B (5 times)
    accept_results_a = []
    accept_results_b = []
    
    def accept_offer(o_id, results_list):
        res = requests.post(f"{BASE_URL}/api/transactions/", json={"offer_id": o_id}, headers=farmer_headers)
        results_list.append(res.status_code)

    threads = []
    for _ in range(5):
        t1 = threading.Thread(target=accept_offer, args=(offer_a_id, accept_results_a))
        t2 = threading.Thread(target=accept_offer, args=(offer_b_id, accept_results_b))
        threads.extend([t1, t2])
    
    for t in threads: t.start()
    for t in threads: t.join()

    print(f"Results for Offer A: {accept_results_a.count(200)} x 200, {accept_results_a.count(409)} x 409")
    print(f"All codes A: {accept_results_a}")
    print(f"Results for Offer B: {accept_results_b.count(200)} x 200, {accept_results_b.count(409)} x 409")
    print(f"All codes B: {accept_results_b}")

    # Check lot state
    res_lot = requests.get(f"{BASE_URL}/api/lots/{lot_id}", headers=farmer_headers)
    lot_state = res_lot.json()["status"]
    print(f"Final lot state: {lot_state}")

    # Check transactions
    me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=farmer_headers)
    farmer_id = me_res.json()["id"]
    res_txns = requests.get(f"{BASE_URL}/api/transactions/farmer/{farmer_id}", headers=farmer_headers)
    txns = [t for t in res_txns.json() if t["lot_id"] == lot_id]
    print(f"Transaction count for lot {lot_id}: {len(txns)}")

if __name__ == "__main__":
    test_same_offer_concurrency()
    test_competing_offers_concurrency()
