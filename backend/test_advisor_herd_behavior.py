import pytest
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
        arrival_val = 500 if high_arrival else 100
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

def test_missing_price():
    history = generate_history([1000])
    history[0]["modal_price"] = 0
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}
    )
    assert res["decision"] == "INSUFFICIENT_DATA"
    assert res["recommended_sell_quantity"] is None
    assert res["recommended_hold_quantity"] is None

def test_low_confidence():
    # Only 1 observation -> INSUFFICIENT_DATA or LOW_CONFIDENCE
    history = generate_history([1000])
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}
    )
    assert res["decision"] in ["INSUFFICIENT_DATA", "LOW_CONFIDENCE"]
    assert res["recommended_sell_quantity"] is None
    assert res["recommended_hold_quantity"] is None

def test_small_expected_upside():
    # Flat prices
    prices = [1000, 1001, 1000, 1002, 1001]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["decision"] == "SELL_NOW"
    assert res["recommended_sell_quantity"] == 500
    assert res["recommended_hold_quantity"] == 0

def test_meaningful_upside_low_risk_wait():
    # Steady rising prices
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["decision"] == "WAIT"
    assert res["recommended_hold_quantity"] == 500
    assert res["recommended_sell_quantity"] == 0

def test_storage_unavailable_does_not_wait():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=False
    )
    assert res["decision"] in ["SELL_NOW", "PARTIAL_SELL"]
    assert res["decision"] != "WAIT"

def test_missing_arrival_data_remains_null():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices, include_arrival=False)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["arrival_data_available"] == False

def test_high_volatility_partial_sell():
    # volatile but rising trend
    prices = [1000, 800, 1200, 900, 1100]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["decision"] == "PARTIAL_SELL"
    sell_q = res["recommended_sell_quantity"]
    hold_q = res["recommended_hold_quantity"]
    assert sell_q is not None and hold_q is not None
    assert sell_q + hold_q == 500
    assert sell_q != 250 # No hardcoded 50/50
    assert sell_q != 350 # No hardcoded 70/30

def test_zero_quantity_handling():
    prices = [1000, 800, 1200, 900, 1100]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=0, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["recommended_sell_quantity"] is None
    assert res["recommended_hold_quantity"] is None

def test_quantity_affects_allocation_only():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)

    res1 = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    res2 = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=1000, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )

    assert res1["expected_price"] == res2["expected_price"]
    assert res1["current_modal_price"] == res2["current_modal_price"]

def test_weather_risk_downgrade():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True,
        weather_data={"available": True, "risk_level": "HIGH"}
    )
    assert res["decision"] == "PARTIAL_SELL" # Downgraded from WAIT

def test_systemic_risk_unavailable():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)
    res = generate_market_recommendation(
        crop_name="Wheat", quantity_kg=500, quality_grade="Grade A",
        market_price_history_map={"TestMarket": history}, storage_available=True
    )
    assert res["market_systemic_risk"] == "UNAVAILABLE"
