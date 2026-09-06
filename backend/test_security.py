import requests
import sys

BASE_URL = "http://localhost:8000"

def get_token(phone, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"phone": phone, "password": password})
    return res.json().get("token")

def test_security_and_transactions():
    print("\n--- SCENARIOS N-Q: PAYMENTS & SECURITY ---")
    farmer_token = get_token("9876543210", "demo123")
    buyer_token = get_token("9876543211", "demo123")
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 1. Get farmer transactions to find an existing transaction
    me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=farmer_headers)
    farmer_id = me_res.json()["id"]
    res_txns = requests.get(f"{BASE_URL}/api/transactions/farmer/{farmer_id}", headers=farmer_headers)
    txns = res_txns.json()
    if not txns:
        print("❌ No transactions found for farmer.")
        return False
    
    txn_id = txns[0]["id"]
    print(f"Using transaction ID: {txn_id}")

    # 2. IDOR Test: Farmer tries to update payment status (should fail 403)
    res_idor = requests.patch(
        f"{BASE_URL}/api/transactions/{txn_id}/payment-status",
        json={"payment_status": "Processing"},
        headers=farmer_headers
    )
    if res_idor.status_code != 403:
        print(f"❌ IDOR failed! Expected 403, got {res_idor.status_code}")
        return False
    print("✅ Scenario P: IDOR protection works. Farmer cannot update payment.")

    # 3. Invalid Transition: Paid -> Processing (should fail 409)
    # First set it to Paid
    requests.patch(
        f"{BASE_URL}/api/transactions/{txn_id}/payment-status",
        json={"payment_status": "Paid"},
        headers=buyer_headers
    )
    
    # Now try to transition back to Processing
    res_invalid = requests.patch(
        f"{BASE_URL}/api/transactions/{txn_id}/payment-status",
        json={"payment_status": "Processing"},
        headers=buyer_headers
    )
    if res_invalid.status_code != 409:
        print(f"❌ Invalid transition failed! Expected 409, got {res_invalid.status_code}")
        return False
    print("✅ Scenario O: Invalid state transition prevented.")

    return True

if __name__ == "__main__":
    if test_security_and_transactions():
        print("\n✅ All security tests passed.")
    else:
        print("\n❌ Security tests failed.")
        sys.exit(1)
