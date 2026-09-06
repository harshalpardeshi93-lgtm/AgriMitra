#!/bin/bash

BASE_URL="http://127.0.0.1:8000"

echo "==================================="
echo "A. GET /api/health"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/health
echo "==================================="

echo "B. Access protected endpoint without Authorization header"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/lots/ -X POST -H "Content-Type: application/json" -d '{"crop_id": 1, "market_id": 1, "quantity_quintals": 10}'
echo "==================================="

echo "C. Access protected endpoint with malformed/invalid JWT"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/lots/ -X POST -H "Authorization: Bearer invalid123" -H "Content-Type: application/json" -d '{"crop_id": 1, "market_id": 1, "quantity_quintals": 10}'
echo "==================================="

echo "D. Login as farmer"
FARMER_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"phone": "9876543210", "password": "demo123"}')
echo "$FARMER_RES"
FARMER_TOKEN=$(echo "$FARMER_RES" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "==================================="

echo "E. Use farmer JWT on farmer-authorized endpoint"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/lots/ -X POST -H "Authorization: Bearer $FARMER_TOKEN" -H "Content-Type: application/json" -d '{"crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "Grade A", "expected_price_per_quintal": 2000}'
echo "==================================="

echo "F. Login as buyer"
BUYER_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"phone": "9876543211", "password": "demo123"}')
echo "$BUYER_RES"
BUYER_TOKEN=$(echo "$BUYER_RES" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "==================================="

echo "G. Use buyer JWT against farmer-only mutation"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/lots/ -X POST -H "Authorization: Bearer $BUYER_TOKEN" -H "Content-Type: application/json" -d '{"crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "Grade A", "expected_price_per_quintal": 2000}'
echo "==================================="

echo "H. Attempt identity forgery (Buyer tries to view another buyer's transactions)"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" $BASE_URL/api/transactions/buyer/3 -H "Authorization: Bearer $BUYER_TOKEN"
echo "==================================="

echo "I. Verify unauthenticated requests cannot fall back to demo identities"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST $BASE_URL/api/lots/ -H "Content-Type: application/json" -d '{"crop_id": 1, "market_id": 1, "quantity_quintals": 10, "quality_grade": "Grade A", "expected_price_per_quintal": 2000}'
echo "==================================="

echo "J. Test protected transaction/payment mutation without JWT"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH $BASE_URL/api/transactions/1/payment-status -H "Content-Type: application/json" -d '{"payment_status": "Paid"}'
echo "==================================="

echo "K. Test transaction/payment mutation with a valid but unauthorized user's JWT"
# A farmer cannot mutate a buyer's payment status, or buyer 2 cannot mutate buyer 3's payment status.
# Here we use the farmer's token (from step D) to mutate the buyer's payment status.
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH $BASE_URL/api/transactions/1/payment-status -H "Authorization: Bearer $FARMER_TOKEN" -H "Content-Type: application/json" -d '{"payment_status": "Paid"}'
echo "==================================="
