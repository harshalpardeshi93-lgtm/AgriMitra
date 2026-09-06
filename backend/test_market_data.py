import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def main():
    print("=========================================")
    print("   PHASE 7 MARKET DATA & ADVISOR TESTS   ")
    print("=========================================")
    
    # Crop IDs:
    # 1: Tomato, 2: Onion, 3: Potato, 4: Wheat
    # 5: Rice, 6: Soybean, 7: Cotton, 8: Maize
    # Let's test a seeded crop: Cotton (7)
    
    print("\n--- TEST 1: Seeded Crop (Cotton - ID 7) ---")
    resp_cotton = requests.get(f"{BASE_URL}/advisor?crop_id=7&quantity_kg=500&quality_grade=Grade A")
    if resp_cotton.status_code == 200:
        data = resp_cotton.json()
        print(f"Crop: {data['crop_name']}")
        print(f"Recommended Market: {data['recommended_market']}")
        print(f"Current Modal Price: {data['current_modal_price']}")
        print(f"Expected Price: {data['expected_price']}")
        if data['current_modal_price'] is not None and data['current_modal_price'] > 0:
            print("PASS: Valid price returned for seeded crop.")
        else:
            print("FAIL: No valid price returned for seeded crop.")
    else:
        print(f"FAIL: HTTP {resp_cotton.status_code}")
        
    print("\n--- TEST 2: Unseeded Crop (Crop ID 99) ---")
    # This crop doesn't exist, it should return an empty response or 404/null
    resp_fake = requests.get(f"{BASE_URL}/advisor?crop_id=99&quantity_kg=500")
    if resp_fake.status_code == 200:
        data = resp_fake.json()
        print(f"Crop Name: {data.get('crop_name')}")
        print(f"Recommended Market: {data.get('recommended_market')}")
        print(f"Current Modal Price: {data.get('current_modal_price')}")
        print(f"Expected Price: {data.get('expected_price')}")
        
        if data.get('current_modal_price') is None and data.get('expected_price') is None:
            print("PASS: Missing data returns explicitly as `null` (None), not 0.0.")
        else:
            print(f"FAIL: Expected None, got {data.get('current_modal_price')}")
    else:
        print("Note: Expected if crop ID does not exist.")

    # Since crop 99 doesn't exist in DB, let's create a new crop without any prices in DB
    # We can't easily create a crop without an admin endpoint, so let's rely on the trend API for a market that has no data for crop 7
    # Market 2 (Pune) has no data for Crop 7 (Cotton) based on seed.py
    
    print("\n--- TEST 3: Trend API for Missing Market Data (Crop 7, Market 2) ---")
    resp_trend = requests.get(f"{BASE_URL}/trends?crop_id=7&market_id=2")
    if resp_trend.status_code == 404:
        print("PASS: Trend API correctly returns 404 for entirely missing data.")
    elif resp_trend.status_code == 200:
        data = resp_trend.json()
        print(f"Trend Direction: {data['trend_direction']}")
        if data['latest_price'] is None:
            print("PASS: Missing data returns `null` for prices.")
        else:
            print(f"FAIL: Expected None for latest_price, got {data['latest_price']}")
    else:
        print(f"FAIL: Unexpected status {resp_trend.status_code}")

if __name__ == "__main__":
    main()
