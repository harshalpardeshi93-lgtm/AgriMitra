#!/bin/bash

BASE_URL="http://127.0.0.1:8000/api"

echo "====================================="
echo "   PHASE 4 SECURITY AUTHORIZATION   "
echo "====================================="

# Get Tokens
FARMER_A_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"phone": "9876543210", "password": "demo123"}' | jq -r '.token')
BUYER_A_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"phone": "9876543211", "password": "demo123"}' | jq -r '.token')
FPO_A_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"phone": "9876543212", "password": "demo123"}' | jq -r '.token')

if [ -z "$FARMER_A_TOKEN" ] || [ "$FARMER_A_TOKEN" == "null" ]; then echo "Failed to login Farmer A"; exit 1; fi
if [ -z "$BUYER_A_TOKEN" ] || [ "$BUYER_A_TOKEN" == "null" ]; then echo "Failed to login Buyer A"; exit 1; fi

# Wait for a brief moment
sleep 1

echo ""
echo "TEST 1: No JWT -> protected endpoint -> 401"
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me")
if [ "$RESP" -eq 401 ]; then echo "PASS (401)"; else echo "FAIL ($RESP)"; fi

echo "TEST 2: Invalid JWT -> 401"
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalidtoken" "$BASE_URL/auth/me")
if [ "$RESP" -eq 401 ]; then echo "PASS (401)"; else echo "FAIL ($RESP)"; fi

echo "TEST 3: Farmer A -> own resource -> allowed"
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FARMER_A_TOKEN" "$BASE_URL/offers/seller/1")
if [ "$RESP" -eq 200 ]; then echo "PASS (200)"; else echo "FAIL ($RESP)"; fi

echo "TEST 4: Farmer A -> Farmer B (FPO A) resource -> 403"
# Attempting to fetch FPO A's seller offers (FPO A is ID 3)
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FARMER_A_TOKEN" "$BASE_URL/offers/seller/3")
if [ "$RESP" -eq 403 ]; then echo "PASS (403)"; else echo "FAIL ($RESP)"; fi

echo "TEST 5: Buyer A -> Buyer B resource -> 403"
# There is a route /transactions/buyer/{buyer_id}
# Buyer A is ID 2. Attempt to view Buyer B (doesn't exist, we use ID 99)
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $BUYER_A_TOKEN" "$BASE_URL/transactions/buyer/99")
if [ "$RESP" -eq 403 ]; then echo "PASS (403)"; else echo "FAIL ($RESP)"; fi

echo "TEST 6: Buyer -> farmer-only mutation -> 403"
# Buyer attempting to accept an offer (update offer status)
# We assume offer 1 exists, but 403 should trigger before 404 since it's a role check
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $BUYER_A_TOKEN" -H "Content-Type: application/json" -d '{"status":"Accepted"}' "$BASE_URL/offers/1/status")
if [ "$RESP" -eq 403 ]; then echo "PASS (403)"; else echo "FAIL ($RESP)"; fi

echo "TEST 7: Farmer -> buyer-only mutation -> 403"
# Farmer attempting to update payment status (buyer only)
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $FARMER_A_TOKEN" -H "Content-Type: application/json" -d '{"payment_status":"Paid"}' "$BASE_URL/transactions/1/payment-status")
if [ "$RESP" -eq 403 ]; then echo "PASS (403)"; else echo "FAIL ($RESP)"; fi

echo "TEST 8: Buyer A -> attempt buyer_id forgery -> ignored by Pydantic / blocked"
# Buyer creates offer, but we removed buyer_id from schema, so it's ignored/rejected.
# Let's verify it creates successfully but under Buyer A's ID.
OFFER_RESP=$(curl -s -X POST -H "Authorization: Bearer $BUYER_A_TOKEN" -H "Content-Type: application/json" -d '{"lot_id": 1, "buyer_id": 99, "offered_price": 5000, "quantity": 1}' "$BASE_URL/offers/")
OFFER_BUYER_ID=$(echo $OFFER_RESP | jq -r '.buyer_id')
if [ "$OFFER_BUYER_ID" == "2" ]; then echo "PASS (used actual JWT ID: 2)"; else echo "FAIL (Created as: $OFFER_BUYER_ID or $OFFER_RESP)"; fi

echo "TEST 9: Farmer A -> attempt farmer_id forgery -> blocked"
LOT_RESP=$(curl -s -X POST -H "Authorization: Bearer $FARMER_A_TOKEN" -H "Content-Type: application/json" -d '{"farmer_id": 99, "crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "Grade A", "expected_price_per_quintal": 6000}' "$BASE_URL/lots/")
LOT_FARMER_ID=$(echo $LOT_RESP | jq -r '.farmer_id')
if [ "$LOT_FARMER_ID" == "1" ]; then echo "PASS (used actual JWT ID: 1)"; else echo "FAIL (Created as: $LOT_FARMER_ID or $LOT_RESP)"; fi

echo "TEST 10: Unrelated user -> transaction access -> 403"
# Attempting to fetch a transaction that does not belong to FPO A (Farmer 1 and Buyer 2 own txn 1 if it exists)
# Let's see if txn 1 exists and FPO A can access it.
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FPO_A_TOKEN" "$BASE_URL/transactions/1")
if [ "$RESP" -eq 403 ] || [ "$RESP" -eq 404 ]; then echo "PASS ($RESP)"; else echo "FAIL ($RESP)"; fi

echo "TEST 11: Unrelated user -> transaction mutation -> 403"
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $FPO_A_TOKEN" -H "Content-Type: application/json" -d '{"transaction_status":"Completed"}' "$BASE_URL/transactions/1/status")
if [ "$RESP" -eq 403 ] || [ "$RESP" -eq 404 ]; then echo "PASS ($RESP)"; else echo "FAIL ($RESP)"; fi

echo "TEST 12: Unauthorized user -> payment status mutation -> 403"
# Same as Test 7
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $FARMER_A_TOKEN" -H "Content-Type: application/json" -d '{"payment_status":"Paid"}' "$BASE_URL/transactions/1/payment-status")
if [ "$RESP" -eq 403 ] || [ "$RESP" -eq 404 ]; then echo "PASS ($RESP)"; else echo "FAIL ($RESP)"; fi

echo "TEST 13: Authorized user -> legitimate operation -> success"
RESP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FARMER_A_TOKEN" "$BASE_URL/lots/")
if [ "$RESP" -eq 200 ]; then echo "PASS (200)"; else echo "FAIL ($RESP)"; fi

echo "====================================="
echo "   SECURITY TESTS COMPLETE          "
echo "====================================="
