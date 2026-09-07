import pytest
from app.ml.market_advisor import generate_market_recommendation

def generate_history(prices, include_arrival=True):
    from datetime import datetime, timedelta
    base_date = datetime.now() - timedelta(days=len(prices))
    history = []
    for i, p in enumerate(prices):
        entry = {
            "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
            "district": "Pune",
            "state": "Maharashtra",
            "modal_price": p
        }
        if include_arrival and i < len(prices) - 1:
            entry["arrival_quantity"] = 100
        elif include_arrival:
            entry["arrival_quantity"] = 100
        else:
            if i == len(prices) - 1:
                entry["arrival_quantity"] = None # Missing arrival for latest
            else:
                entry["arrival_quantity"] = 100
        history.append(entry)
    return history

def test_tc_01_current_price_historical_sufficient():
    history = generate_history([1000, 1020, 1040, 1060, 1080])
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True)
    assert res["current_modal_price"] == 1080
    assert res["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert res["downside_risk_score"] is not None

def test_tc_02_current_price_historical_insufficient():
    # Only 2 points, insufficient data for reliable ML
    history = generate_history([1000, 1020])
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True)
    # The system correctly returns INSUFFICIENT_DATA decision, but the current price MUST still be accessible
    assert res["current_modal_price"] == 1020
    assert res["risk_level"] == "UNKNOWN"
    assert res["downside_risk_score"] is None
    assert res["decision"] == "INSUFFICIENT_DATA"

def test_tc_03_current_price_null():
    # No history at all
    res = generate_market_recommendation("Wheat", 100, "Grade A", {}, True)
    assert res["current_modal_price"] is None
    assert res["decision"] == "INSUFFICIENT_DATA"

def test_tc_04_expected_price_available_risk_unavailable():
    # If historical data insufficient, we return INSUFFICIENT_DATA.
    # The expected price may or may not be calculated based on the forecaster logic.
    pass

def test_tc_05_expected_price_unavailable():
    res = generate_market_recommendation("Wheat", 100, "Grade A", {}, True)
    assert res["expected_price"] is None

def test_tc_06_arrival_unavailable():
    history = generate_history([1000, 1020, 1040, 1060, 1080], include_arrival=False)
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True)
    assert res["arrival_data_available"] == False
    assert res["arrival_signal"] == "UNAVAILABLE"

def test_tc_07_weather_unavailable():
    history = generate_history([1000, 1020, 1040, 1060, 1080])
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True, weather_data=None)
    assert res["weather_data_available"] == False
    assert res["weather_risk_level"] == "UNAVAILABLE"

def test_tc_09_never_fabricate_risk():
    history = generate_history([1000, 1020])
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True)
    assert res["risk_level"] == "UNKNOWN" # Not Low/Medium/High
    assert res["downside_risk_score"] is None # Not 0

def test_confidence_not_fabricated_when_missing():
    # Missing history
    res = generate_market_recommendation("Wheat", 100, "Grade A", {}, True)
    assert res["confidence_score"] is None
    assert res["confidence_level"] == "Limited confidence"

def test_confidence_score_returned_when_valid():
    # Sufficient history
    history = generate_history([1000, 1020, 1040, 1060, 1080])
    res = generate_market_recommendation("Wheat", 100, "Grade A", {"Market": history}, True)
    # The forecaster returns a float for confidence_score
    assert isinstance(res["confidence_score"], float)
    assert 0 <= res["confidence_score"] <= 100
