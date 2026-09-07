import pytest
from unittest.mock import patch
import httpx
from datetime import datetime, timezone
from app.ml.market_advisor import generate_market_recommendation
from app.services.weather_service import WeatherService

# Sample data for tests
mock_history_stable = [
    {"modal_price": 2000, "date": "2024-01-01", "arrival_quantity": 100},
    {"modal_price": 2050, "date": "2024-01-02", "arrival_quantity": 110},
    {"modal_price": 2020, "date": "2024-01-03", "arrival_quantity": 105},
    {"modal_price": 2000, "date": "2024-01-04", "arrival_quantity": 100},
]

mock_history_volatile = [
    {"modal_price": 1500, "date": "2024-01-01", "arrival_quantity": 100},
    {"modal_price": 2200, "date": "2024-01-02", "arrival_quantity": 110},
    {"modal_price": 1600, "date": "2024-01-03", "arrival_quantity": 105},
    {"modal_price": 2300, "date": "2024-01-04", "arrival_quantity": 100},
]

mock_history_rising = [
    {"modal_price": 2000, "date": "2024-01-01", "arrival_quantity": 100},
    {"modal_price": 2100, "date": "2024-01-02", "arrival_quantity": 110},
    {"modal_price": 2200, "date": "2024-01-03", "arrival_quantity": 105},
    {"modal_price": 2300, "date": "2024-01-04", "arrival_quantity": 100},
]

def test_weather_available_low_risk():
    w_data = {"available": True, "risk_level": "LOW", "condition": "Clear", "source": "IMD"}
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_rising}, True, 50, 100, w_data
    )
    assert res["weather_risk_level"] == "LOW"
    assert res["decision"] in ["WAIT", "PARTIAL_SELL", "SELL_NOW"]

def test_weather_available_high_risk():
    w_data = {"available": True, "risk_level": "HIGH", "condition": "Heavy Rain", "source": "IMD"}
    # Rising price + storage usually = WAIT. But HIGH risk downgrades it to PARTIAL_SELL
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_rising}, True, 50, 100, w_data
    )
    assert res["weather_risk_level"] == "HIGH"
    assert res["decision"] == "PARTIAL_SELL"
    assert "severe weather" in res["decision_reason"]

def test_weather_unavailable():
    w_data = {"available": False, "risk_level": "UNAVAILABLE", "source": "IMD"}
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_rising}, True, 50, 100, w_data
    )
    assert res["weather_risk_level"] == "UNAVAILABLE"
    # Should not crash and should act normally
    assert res["decision"] is not None

def test_no_weather_data_must_not_crash_advisor():
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_rising}, True, 50, 100, None
    )
    assert res["weather_risk_level"] == "UNAVAILABLE"
    assert res["decision"] is not None

def test_no_weather_data_must_not_become_0():
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_rising}, True, 50, 100, None
    )
    # Ensure it's not 0 or fabricated
    assert res["weather_risk_level"] == "UNAVAILABLE"
    assert res["weather_data_available"] is False

def test_high_weather_risk_high_volatility():
    w_data = {"available": True, "risk_level": "HIGH"}
    # Volatile market is risky, weather makes it riskier -> SELL_NOW
    res = generate_market_recommendation(
        "Tomato", 1000, "Grade A", {"Nashik": mock_history_volatile}, False, 0, 0, w_data
    )
    assert res["weather_risk_level"] == "HIGH"
    assert res["decision"] == "SELL_NOW"

# Tests for Weather Service itself
@patch("httpx.Client.get")
def test_weather_api_timeout(mock_get):
    mock_get.side_effect = httpx.TimeoutException("Timeout")
    ws = WeatherService()
    res = ws.get_weather_for_location("Pune", "Maharashtra")
    assert res["available"] is False
    assert res["risk_level"] == "UNAVAILABLE"

@patch("httpx.Client.get")
def test_malformed_weather_response(mock_get):
    # Simulate a bad 200 JSON that isn't expected
    class MockResponse:
        def raise_for_status(self): pass
        def json(self): return "this is not a dictionary"
    
    mock_get.return_value = MockResponse()
    ws = WeatherService()
    res = ws.get_weather_for_location("Pune", "Maharashtra")
    # Our fallback returns unavailable on any error
    assert res["available"] is False
    assert res["risk_level"] == "UNAVAILABLE"
