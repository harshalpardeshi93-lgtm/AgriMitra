import pytest
from app.ml.market_advisor import generate_market_recommendation

def test_missing_data_insufficient():
    # Setup missing data map
    market_price_history_map = {
        "Mandi A": [
            # Only one data point
            {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None}
        ]
    }
    rec = generate_market_recommendation("Tomato", 500, "Grade A", market_price_history_map)
    assert rec["decision"] == "INSUFFICIENT_DATA"
    assert rec["arrival_signal"] == "UNAVAILABLE"

def test_positive_forecast_no_storage():
    # Setup history with clear positive trend, but high confidence
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2050, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2100, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 2150, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    rec = generate_market_recommendation(
        "Tomato", 500, "Grade A",
        {"Mandi A": history},
        storage_available=False
    )
    # Expected gain is positive, but no storage
    assert rec["decision"] == "SELL_NOW"
    assert "storage" in rec["decision_reason"].lower()

def test_positive_forecast_with_storage_wait():
    # Setup history with clear positive trend, very low volatility
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2010, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2020, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 2050, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-05", "modal_price": 2060, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-06", "modal_price": 2100, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    rec = generate_market_recommendation(
        "Tomato", 500, "Grade A",
        {"Mandi A": history},
        storage_available=True
    )
    assert rec["decision"] == "WAIT"

def test_positive_forecast_high_volatility():
    # Setup history with positive trend but wild swings (high volatility)
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 1800, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2200, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 1700, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-05", "modal_price": 2400, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-06", "modal_price": 2100, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    rec = generate_market_recommendation(
        "Tomato", 500, "Grade A",
        {"Mandi A": history},
        storage_available=True
    )
    assert rec["decision"] in ["PARTIAL_SELL", "SELL_NOW"]
    assert rec["volatility_level"] == "HIGH"

def test_missing_arrival_data():
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2050, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2100, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    rec = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history})
    assert rec["arrival_data_available"] is False
    assert rec["arrival_signal"] == "UNAVAILABLE"

def test_mentor_scenario_high_risk_missing_arrival():
    # Scenario: Forecast is higher (+5%), but high volatility, high downside risk, missing arrival data
    # Advisor must NOT return WAIT.
    history = [
        {"date": "2026-09-01", "modal_price": 2400, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2800, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 1900, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-05", "modal_price": 2700, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-06", "modal_price": 2400, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    # Forecast might predict ~2520, which is > 2400.
    rec = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=True)

    assert rec["decision"] != "WAIT", "Must not recommend WAIT when volatility and downside risk are high"
    assert rec["decision"] in ["PARTIAL_SELL", "SELL_NOW"]
    assert rec["arrival_data_available"] is False

def test_storage_cost_negates_gain():
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2010, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2020, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 2030, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-05", "modal_price": 2040, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-06", "modal_price": 2050, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]
    # Forecast should predict some minor gain.
    # High storage cost.
    rec = generate_market_recommendation(
        "Tomato", 500, "Grade A",
        {"Mandi A": history},
        storage_available=True,
        storage_cost=200.0
    )
    # Expected gain is < 200, so net gain is negative.
    assert rec["decision"] == "SELL_NOW"
    assert "locks in current value" in rec["decision_reason"] or "potential upside is limited considering costs" in rec["decision_reason"].lower()

def test_storage_semantics_strong_upside():
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2010, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2020, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-04", "modal_price": 2050, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-05", "modal_price": 2060, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-06", "modal_price": 2200, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]

    rec_true = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=True)
    assert rec_true["decision"] == "WAIT"

    rec_false = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=False)
    assert rec_false["decision"] == "SELL_NOW"

    rec_none = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=None)
    assert rec_none["decision"] == "WAIT"
    assert "Consider waiting ONLY IF storage is available" in rec_none["decision_reason"]

from unittest.mock import patch

def test_storage_semantics_modest_upside():
    history = [
        {"date": "2026-09-01", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-02", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None},
        {"date": "2026-09-03", "modal_price": 2000, "district": "D1", "state": "S1", "arrival_quantity": None}
    ]

    # Mock forecast to return exactly 2035 (1.75% gain over 2000)
    with patch("app.ml.market_advisor.forecast_prices") as mock_forecast:
        mock_forecast.return_value = {
            "forecast_points": [{"predicted_modal_price": 2035.0}],
            "confidence_score": 85.0,
            "confidence_label": "High confidence",
            "mae": 10.0
        }

        rec_true = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=True)
        assert rec_true["decision"] == "PARTIAL_SELL"

        rec_false = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=False)
        assert rec_false["decision"] == "SELL_NOW"

        rec_none = generate_market_recommendation("Tomato", 500, "Grade A", {"Mandi A": history}, storage_available=None)
        assert rec_none["decision"] == "PARTIAL_SELL"
        assert "Consider a partial sell ONLY IF storage is available" in rec_none["decision_reason"]
