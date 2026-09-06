import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def main():
    crops_to_test = {
        1: "Tomato",
        4: "Wheat",
        7: "Cotton",
        3: "Potato",
        5: "Rice",
        8: "Maize"
    }

    print("==================================================")
    print("1. & 2. VERIFY ADVISOR FOR ALL SIX CROPS")
    print("==================================================")
    
    for crop_id, crop_name in crops_to_test.items():
        resp = requests.get(f"{BASE_URL}/advisor?crop_id={crop_id}&quantity_kg=500&quality_grade=Grade A")
        if resp.status_code == 200:
            data = resp.json()
            print(f"--- {crop_name} (ID: {crop_id}) ---")
            print(f"Recommended Market: {data['recommended_market']}")
            print(f"Current Price: {data['current_modal_price']}")
            print(f"Expected Price: {data['expected_price']}")
            print(f"Confidence Level: {data['confidence_level']}")
            obs = data['observation_count']
            print(f"Historical Data (Observations): {obs}")
            if data['current_modal_price'] is not None and data['current_modal_price'] > 0:
                print("Status: PASS")
            else:
                print("Status: FAIL (No valid price > 0)")
        else:
            print(f"--- {crop_name} (ID: {crop_id}) --- FAILED (HTTP {resp.status_code})")

    print("\n==================================================")
    print("3. VERIFY TRENDS FOR ALL SIX CROPS")
    print("==================================================")
    
    # Let's map some known markets for each crop based on seed.py
    # Tomato (1): Market 1 (Mumbai)
    # Wheat (4): Market 8 (Indore)
    # Cotton (7): Market 8 (Indore)
    # Potato (3): Market 8 (Indore)
    # Rice (5): Market 8 (Indore)
    # Maize (8): Market 8 (Indore)
    market_map = {1: 1, 4: 8, 7: 8, 3: 8, 5: 8, 8: 8}
    
    for crop_id, crop_name in crops_to_test.items():
        market_id = market_map[crop_id]
        resp = requests.get(f"{BASE_URL}/trends?crop_id={crop_id}&market_id={market_id}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"--- {crop_name} (ID: {crop_id}) in Market {market_id} ---")
            print(f"Trend Direction: {data['trend_direction']}")
            print(f"Latest Price: {data['latest_price']}")
            obs = len(data.get('historical_points', []))
            print(f"Observations: {obs}")
            if data['latest_price'] is not None and data['latest_price'] > 0 and obs > 0:
                print("Status: PASS")
            else:
                print("Status: FAIL (Missing data or ₹0)")
        else:
            print(f"--- {crop_name} (ID: {crop_id}) --- FAILED (HTTP {resp.status_code})")

    print("\n==================================================")
    print("4. VERIFY MISSING-DATA SAFETY")
    print("==================================================")
    
    # Missing Market (Crop 7 Cotton in Market 2 Pune)
    resp = requests.get(f"{BASE_URL}/trends?crop_id=7&market_id=2")
    print(f"Missing Trend Data (Crop 7, Market 2): HTTP {resp.status_code}")
    if resp.status_code == 404:
        print("Status: PASS (Correctly returns 404 for entirely missing data)")
    
    # Missing Advisor Data (Crop 99)
    resp = requests.get(f"{BASE_URL}/advisor?crop_id=99&quantity_kg=500")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Missing Advisor Data (Crop 99): Current Price={data.get('current_modal_price')}")
        if data.get('current_modal_price') is None:
            print("Status: PASS (No ₹0 returned)")
        else:
            print("Status: FAIL")

if __name__ == "__main__":
    main()
