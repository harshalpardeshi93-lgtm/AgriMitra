import pytest
from app.schemas.advisor import AdvisorResponse
from app.ml.market_advisor import generate_market_recommendation
from datetime import datetime, timedelta

def generate_history(prices, include_arrival=True, high_arrival=False):
    base_date = datetime.now() - timedelta(days=len(prices))
    history = []
    for i, p in enumerate(prices):
        entry = {
            "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
            "district": "Pune",
            "state": "Maharashtra",
            "modal_price": p
        }
        arrival_val = 100
        if high_arrival and i == len(prices) - 1:
            arrival_val = 500
        if include_arrival and i < len(prices) - 1:
            entry["arrival_quantity"] = arrival_val
        elif include_arrival:
            entry["arrival_quantity"] = arrival_val
        else:
            if i == len(prices) - 1:
                entry["arrival_quantity"] = None
            else:
                entry["arrival_quantity"] = arrival_val
        history.append(entry)
    return history

def _get_response_dict(prices, qty=500, storage_available=True, **kwargs):
    history = generate_history(prices, **kwargs)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=qty, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=storage_available
    )
    # Validate with Pydantic
    res["crop_id"] = 1
    res["crop_name"] = "Wheat"
    res["quantity_kg"] = qty
    res["quality_grade"] = "Grade A"
    return AdvisorResponse(**res).model_dump()

def test_api_sell_now_contract():
    prices = [1000, 1001, 1000, 1002, 1001]
    res = _get_response_dict(prices)
    assert res["decision"] == "SELL_NOW"
    assert res["recommended_sell_quantity"] == 500
    assert res["recommended_hold_quantity"] == 0

def test_api_wait_contract():
    prices = [1000, 1020, 1040, 1060, 1080]
    res = _get_response_dict(prices)
    assert res["decision"] == "WAIT"
    assert res["recommended_sell_quantity"] == 0
    assert res["recommended_hold_quantity"] == 500

def test_api_partial_sell_contract():
    prices = [1000, 800, 1200, 900, 1100]
    res = _get_response_dict(prices)
    assert res["decision"] == "PARTIAL_SELL"
    sell = res["recommended_sell_quantity"]
    hold = res["recommended_hold_quantity"]
    assert sell is not None and hold is not None
    assert sell + hold == 500

def test_api_insufficient_data_contract():
    history = generate_history([1000])
    history[0]["modal_price"] = 0
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    res["crop_id"] = 1
    res["crop_name"] = "Wheat"
    res["quantity_kg"] = 500
    res["quality_grade"] = "Grade A"
    res = AdvisorResponse(**res).model_dump()
    assert res["decision"] == "INSUFFICIENT_DATA"
    assert res["recommended_sell_quantity"] is None
    assert res["recommended_hold_quantity"] is None

def test_api_missing_arrival():
    res = _get_response_dict([1000, 1020, 1040, 1060, 1080], include_arrival=False)
    assert res["arrival_quantity"] is None
    assert res["supply_pressure_status"] == "UNAVAILABLE"

def test_api_available_arrival():
    res = _get_response_dict([1000, 1020, 1040, 1060, 1080], include_arrival=True)
    assert res["arrival_quantity"] == 100
    assert res["supply_pressure_status"] != "UNAVAILABLE"

def test_api_storage_feasible():
    res = _get_response_dict([1000, 1020, 1040, 1060, 1080], storage_available=False)
    assert res["storage_feasible"] is False

def test_api_risk_flags():
    # Volatile prices + high arrival
    res = _get_response_dict([1000, 800, 1200, 900, 1100], high_arrival=True)
    assert "HIGH_VOLATILITY" in res["risk_flags"]
    assert "HIGH_SUPPLY_PRESSURE" in res["risk_flags"]
    assert "UNAVAILABLE_DATA" not in res["risk_flags"] # checking fake flags

def test_api_confidence():
    res = _get_response_dict([1000, 1020, 1040, 1060, 1080])
    assert res["confidence_level"] is not None

def test_quantity_invariance():
    res1 = _get_response_dict([1000, 1020, 1040, 1060, 1080], qty=500)
    res2 = _get_response_dict([1000, 1020, 1040, 1060, 1080], qty=1000)
    assert res1["expected_price"] == res2["expected_price"]
    assert res1["current_modal_price"] == res2["current_modal_price"]
