import requests
import sys
import uuid

BASE_URL = "http://localhost:8000"

def test_scenario_b_quantity_validation():
    print("\n--- SCENARIO B: QUANTITY VALIDATION ---")
    res = requests.get(f"{BASE_URL}/api/crops")
    crops = res.json()
    maize_id = next((c['id'] for c in crops if c['name'] == 'Maize'), None)
    if not maize_id:
        print("❌ Maize not found in crops")
        return False

    quantities = [100, 250, 500, 1000, 2500, 5000, 10000]
    for q in quantities:
        res = requests.get(
            f"{BASE_URL}/api/advisor",
            params={
                "crop_id": maize_id,
                "district": "Indore",
                "quantity_kg": q,
                "quality_grade": "Grade A"
            }
        )
        if res.status_code != 200:
            print(f"❌ Failed for quantity {q}: {res.status_code} {res.text}")
            return False
        data = res.json()
        
        expected_price = data.get("expected_price")
        print(f"Qty: {q}kg -> Expected Price: ₹{expected_price}/qtl. Recommended: {data.get('recommended_window')}")

    print("✅ Scenario B: Quantity validation script completed.")
    return True

def test_scenario_c_crop_validation():
    print("\n--- SCENARIO C: CROP VALIDATION ---")
    res = requests.get(f"{BASE_URL}/api/crops")
    crops = {c['name']: c['id'] for c in res.json()}
    
    target_crops = ["Tomato", "Wheat", "Cotton", "Potato", "Rice", "Maize"]
    for crop_name in target_crops:
        crop_id = crops.get(crop_name)
        if not crop_id:
            print(f"⚠️ Crop {crop_name} not found in DB.")
            continue
        
        # Check prices
        res = requests.get(
            f"{BASE_URL}/api/prices",
            params={"crop_id": crop_id}
        )
        if res.status_code == 200:
            data = res.json()
            if not data or len(data) == 0:
                print(f"✅ Crop {crop_name}: Valid empty state returned (No market data).")
            else:
                first_market = data[0]
                if first_market.get("modal_price", 0) == 0:
                    print(f"❌ Crop {crop_name} returned ₹0 price! Bug found.")
                    return False
                print(f"✅ Crop {crop_name}: Data exists. Price > 0.")
        else:
            print(f"❌ Failed to fetch prices for {crop_name}: {res.status_code}")
            return False
            
        # Check advisor
        res_adv = requests.get(
            f"{BASE_URL}/api/advisor",
            params={"crop_id": crop_id, "quantity_kg": 500, "quality_grade": "Grade A"}
        )
        data_adv = res_adv.json()
        if res_adv.status_code != 200:
            print(f"❌ AI Advisor failed for {crop_name}.")
            return False
        if data_adv.get("current_modal_price", 1) == 0:
            print(f"❌ AI Advisor for {crop_name} returned ₹0 price! Bug found.")
            return False

    print("✅ Scenario C: Crop validation completed.")
    return True

def main():
    print("Starting Final Real-World Audit Tests...")
    b = test_scenario_b_quantity_validation()
    c = test_scenario_c_crop_validation()
    if not (b and c):
        print("❌ Some tests failed.")
        sys.exit(1)
    print("\n✅ All initial tests passed.")

if __name__ == "__main__":
    main()
