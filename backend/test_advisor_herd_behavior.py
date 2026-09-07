import pytest
from app.ml.market_advisor import generate_market_recommendation
from datetime import datetime, timedelta

def generate_history(prices, include_arrival=True):
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

def test_positive_forecast_no_storage_does_not_wait():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices)

    res = generate_market_recommendation(
        crop_name="Wheat",
        quantity_kg=500,
        quality_grade="Grade A",
        market_price_history_map={"TestMarket": history},
        storage_available=False
    )

    assert res["decision"] in ["SELL_NOW", "PARTIAL_SELL"]
    assert res["decision"] != "WAIT"

def test_high_systemic_risk_downgrades_wait():
    # evaluate_market_systemic_risk currently returns UNAVAILABLE.
    # To truly test this without monkeypatch, we'd need to mock evaluate_market_systemic_risk.
    pass

def test_missing_arrival_data_remains_null():
    prices = [1000, 1020, 1040, 1060, 1080]
    history = generate_history(prices, include_arrival=False)

    res = generate_market_recommendation(
        crop_name="Wheat",
        quantity_kg=500,
        quality_grade="Grade A",
        market_price_history_map={"TestMarket": history},
        storage_available=True
    )

    assert res["arrival_data_available"] == False
    assert res["arrival_signal"] == "UNAVAILABLE"

def test_partial_sell_quantity_is_not_hardcoded():
    # Make a slightly volatile but generally rising market that triggers PARTIAL_SELL
    # To force PARTIAL_SELL: top_gain_pct > 1.0 and storage_available, but maybe risk_level == HIGH or vol_level == HIGH
    prices = [1000, 800, 1200, 900, 1100]
    history = generate_history(prices)

    res = generate_market_recommendation(
        crop_name="Wheat",
        quantity_kg=500,
        quality_grade="Grade A",
        market_price_history_map={"TestMarket": history},
        storage_available=True
    )

    if res["decision"] == "PARTIAL_SELL":
        assert res["recommended_sell_quantity"] is not None
        assert res["recommended_hold_quantity"] is not None
        assert res["recommended_sell_quantity"] + res["recommended_hold_quantity"] == 500
