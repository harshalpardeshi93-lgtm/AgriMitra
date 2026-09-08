import pytest
from app.ml.risk_signals import (
    calculate_expected_gain,
    extract_arrival_signal,
    calculate_economic_signals,
    calculate_volatility,
    calculate_downside_risk,
    evaluate_market_systemic_risk,
    calculate_data_freshness
)

def test_valid_current_price_forecast():
    gain = calculate_expected_gain(100.0, 110.0)
    assert gain == 10.0

def test_missing_transport_cost():
    res = calculate_economic_signals(100.0, 10.0, True, 2.0, None)
    assert res["transport_cost_status"] == "UNAVAILABLE"
    assert res["transport_cost"] is None
    assert res["economic_uncertainty"] is True

def test_missing_storage_cost():
    res = calculate_economic_signals(100.0, 10.0, True, None, 5.0)
    assert res["storage_cost_status"] == "UNAVAILABLE"
    assert res["storage_cost"] is None
    assert res["economic_uncertainty"] is True

def test_both_costs_missing():
    res = calculate_economic_signals(100.0, 10.0, True, None, None)
    assert res["transport_cost_status"] == "UNAVAILABLE"
    assert res["storage_cost_status"] == "UNAVAILABLE"
    assert res["economic_uncertainty"] is True

def test_valid_transport_storage_costs():
    res = calculate_economic_signals(100.0, 20.0, True, 5.0, 5.0)
    assert res["transport_cost_status"] == "AVAILABLE"
    assert res["storage_cost_status"] == "AVAILABLE"
    assert res["economic_uncertainty"] is False
    assert res["net_expected_gain"] == 10.0
    assert res["expected_gain_pct"] == 10.0

def test_missing_arrival_quantity():
    history = [{"modal_price": 100}]
    res = extract_arrival_signal(history)
    assert res["arrival_quantity"] is None
    assert res["arrival_trend"] == "UNAVAILABLE"
    assert res["supply_pressure"] == "UNAVAILABLE"

def test_valid_arrival_quantity():
    history = [
        {"arrival_quantity": 100},
        {"arrival_quantity": 150}
    ]
    res = extract_arrival_signal(history)
    assert res["arrival_quantity"] == 150
    assert res["arrival_trend"] != "UNAVAILABLE"

def test_increasing_arrival():
    history = [
        {"arrival_quantity": 100},
        {"arrival_quantity": 120}
    ]
    res = extract_arrival_signal(history)
    assert res["arrival_trend"] == "INCREASING"
    assert res["supply_pressure"] == "HIGH"

def test_decreasing_arrival():
    history = [
        {"arrival_quantity": 100},
        {"arrival_quantity": 80}
    ]
    res = extract_arrival_signal(history)
    assert res["arrival_trend"] == "DECREASING"
    assert res["supply_pressure"] == "LOW"

def test_stable_arrival():
    history = [
        {"arrival_quantity": 100},
        {"arrival_quantity": 102}
    ]
    res = extract_arrival_signal(history)
    assert res["arrival_trend"] == "STABLE"
    assert res["supply_pressure"] == "NORMAL"

def test_insufficient_arrival_observations():
    history = [
        {"arrival_quantity": 100}
    ]
    res = extract_arrival_signal(history)
    assert res["arrival_trend"] == "UNAVAILABLE"
    assert res["supply_pressure"] == "UNAVAILABLE"

def test_high_price_volatility():
    history = [{"modal_price": 100}, {"modal_price": 150}, {"modal_price": 50}]
    res = calculate_volatility(history)
    assert res["volatility_level"] == "HIGH"

def test_low_price_volatility():
    history = [{"modal_price": 100}, {"modal_price": 101}, {"modal_price": 100}]
    res = calculate_volatility(history)
    assert res["volatility_level"] == "LOW"

def test_downward_price_trend():
    history = [{"modal_price": 100}, {"modal_price": 90}, {"modal_price": 80}]
    res = calculate_downside_risk(history, 10.0, "down")
    assert res["risk_level"] in ["MEDIUM", "HIGH"]
    assert res["risk_status"] == "AVAILABLE"

def test_missing_historical_data():
    res = calculate_downside_risk([], 10.0, "up")
    assert res["risk_level"] == "UNKNOWN"
    assert res["risk_status"] == "UNAVAILABLE"

def test_stale_market_data():
    res = calculate_data_freshness({"freshness": "Fallback data"})
    assert res == "STALE"

def test_fresh_market_data():
    res = calculate_data_freshness({"freshness": "Today"})
    assert res == "Today"

def test_missing_systemic_risk_data():
    res = evaluate_market_systemic_risk()
    assert res["market_systemic_risk"] == "UNAVAILABLE"
