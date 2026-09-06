import requests

BASE_URL = "http://localhost:8000/api"

def print_result(scenario, expected, actual, passed):
    status = "PASS" if passed else "FAIL"
    print(f"| {scenario} | {expected} | {actual} | {status} |")
    return passed

def run_tests():
    print("==================================================")
    print("      PHASE 9 API CONTRACT TEST MATRIX            ")
    print("==================================================")
    print("| Scenario | Expected | Actual | Result |")
    print("|----------|----------|--------|--------|")

    all_passed = True

    # Get valid tokens
    buyer_login = requests.post(f"{BASE_URL}/auth/login", json={"phone": "9876543211", "password": "demo123"})
    farmer_login = requests.post(f"{BASE_URL}/auth/login", json={"phone": "9876543210", "password": "demo123"})
    
    buyer_token = buyer_login.json().get("token")
    farmer_token = farmer_login.json().get("token")
    
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 1. No JWT -> 401
    res = requests.get(f"{BASE_URL}/lots")
    passed = print_result("No JWT", 401, res.status_code, res.status_code == 401)
    all_passed = all_passed and passed

    # 2. Invalid JWT -> 401
    res = requests.get(f"{BASE_URL}/lots", headers={"Authorization": "Bearer invalid"})
    passed = print_result("Invalid JWT", 401, res.status_code, res.status_code == 401)
    all_passed = all_passed and passed

    # 3. Wrong role (Farmer tries to create offer) -> 403
    res = requests.post(f"{BASE_URL}/offers", headers=farmer_headers, json={"lot_id": 1, "offered_price": 5000, "quantity": 10})
    passed = print_result("Wrong role", 403, res.status_code, res.status_code == 403)
    all_passed = all_passed and passed

    # 4. Missing lot (404)
    res = requests.get(f"{BASE_URL}/lots/9999", headers=buyer_headers)
    passed = print_result("Missing lot", 404, res.status_code, res.status_code == 404)
    all_passed = all_passed and passed

    # 5. Invalid body (422)
    res = requests.post(f"{BASE_URL}/lots", headers=farmer_headers, json={"invalid_field": "test"})
    passed = print_result("Invalid body", 422, res.status_code, res.status_code == 422)
    all_passed = all_passed and passed

    # 6. Duplicate/invalid offer transition (409) - Needs setup
    # Setup: Create lot, offer, accept offer, then try accepting again
    lot_res = requests.post(f"{BASE_URL}/lots", headers=farmer_headers, json={"crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "A", "expected_price_per_quintal": 2000})
    lot_id = lot_res.json()["id"]
    offer_res = requests.post(f"{BASE_URL}/offers", headers=buyer_headers, json={"lot_id": lot_id, "offered_price": 2000, "quantity": 10})
    offer_id = offer_res.json()["id"]
    requests.patch(f"{BASE_URL}/offers/{offer_id}/status", headers=farmer_headers, json={"status": "Accepted"})
    # Attempt to accept again
    conflict_res = requests.patch(f"{BASE_URL}/offers/{offer_id}/status", headers=farmer_headers, json={"status": "Accepted"})
    passed = print_result("Sold lot conflict / duplicate accept", 409, conflict_res.status_code, conflict_res.status_code == 409)
    all_passed = all_passed and passed

    # 7. Invalid payment transition (409)
    # Setup: fetch transaction created by the acceptance
    txns = requests.get(f"{BASE_URL}/transactions/farmer/1", headers=farmer_headers).json()
    txn_id = [t["id"] for t in txns if t["offer_id"] == offer_id][0]
    requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", headers=buyer_headers, json={"payment_status": "Processing"})
    requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", headers=buyer_headers, json={"payment_status": "Paid"})
    # Attempt backward transition
    pay_conflict = requests.patch(f"{BASE_URL}/transactions/{txn_id}/payment-status", headers=buyer_headers, json={"payment_status": "Pending"})
    passed = print_result("Invalid payment transition", 409, pay_conflict.status_code, pay_conflict.status_code == 409)
    all_passed = all_passed and passed

    # 8. Invalid transaction transition (409)
    # Attempt backward transition on status
    requests.patch(f"{BASE_URL}/transactions/{txn_id}/status", headers=farmer_headers, json={"transaction_status": "In Progress"})
    requests.patch(f"{BASE_URL}/transactions/{txn_id}/status", headers=farmer_headers, json={"transaction_status": "Completed"})
    txn_conflict = requests.patch(f"{BASE_URL}/transactions/{txn_id}/status", headers=farmer_headers, json={"transaction_status": "In Progress"})
    passed = print_result("Invalid transaction transition", 409, txn_conflict.status_code, txn_conflict.status_code == 409)
    all_passed = all_passed and passed

    # 9. Valid GET (200)
    res = requests.get(f"{BASE_URL}/crops")
    passed = print_result("Valid GET", 200, res.status_code, res.status_code == 200)
    all_passed = all_passed and passed

    # 10. Valid creation (200 OK because lots/offers return 200 not 201 in this codebase, but let's check what it actually returns)
    valid_res = requests.post(f"{BASE_URL}/lots", headers=farmer_headers, json={"crop_id": 2, "market_id": 2, "quantity_quintals": 5, "quality_grade": "B", "expected_price_per_quintal": 1000})
    passed = print_result("Valid creation", "200", valid_res.status_code, valid_res.status_code in [200, 201])
    all_passed = all_passed and passed

    print("==================================================")
    if all_passed:
        print("ALL API CONTRACT TESTS PASSED!")
    else:
        print("SOME TESTS FAILED.")
        exit(1)

if __name__ == "__main__":
    run_tests()
