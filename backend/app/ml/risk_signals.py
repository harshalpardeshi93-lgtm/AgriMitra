import math
from typing import List, Dict, Any, Optional

def calculate_expected_gain(latest_price: float, future_price: float) -> float:
    return round(future_price - latest_price, 2)

def extract_arrival_signal(history: List[dict]) -> Dict[str, Any]:
    """
    Extract arrival_quantity, arrival_trend and supply_pressure.
    Returns UNAVAILABLE if data is missing or invalid.
    """
    if not history:
        return {
            "arrival_quantity": None,
            "arrival_trend": "UNAVAILABLE",
            "supply_pressure": "UNAVAILABLE"
        }

    latest_entry = history[-1]
    raw_arr = latest_entry.get("arrival_quantity")

    if raw_arr is None:
        return {
            "arrival_quantity": None,
            "arrival_trend": "UNAVAILABLE",
            "supply_pressure": "UNAVAILABLE"
        }

    try:
        current_arrival = float(raw_arr)
    except (ValueError, TypeError):
        return {
            "arrival_quantity": None,
            "arrival_trend": "UNAVAILABLE",
            "supply_pressure": "UNAVAILABLE"
        }

    # Find a valid reference arrival to calculate trend
    reference_arrival = None
    for i in range(len(history) - 2, -1, -1):
        prev_arr = history[i].get("arrival_quantity")
        if prev_arr is not None:
            try:
                reference_arrival = float(prev_arr)
                break
            except (ValueError, TypeError):
                continue

    if reference_arrival is None or reference_arrival <= 0:
        return {
            "arrival_quantity": current_arrival,
            "arrival_trend": "UNAVAILABLE",
            "supply_pressure": "UNAVAILABLE"
        }

    # Calculate arrival growth safely
    arrival_growth = (current_arrival - reference_arrival) / reference_arrival

    # Classify trend
    if arrival_growth > 0.1:
        trend = "INCREASING"
        pressure = "HIGH"
    elif arrival_growth < -0.1:
        trend = "DECREASING"
        pressure = "LOW"
    else:
        trend = "STABLE"
        pressure = "NORMAL"

    return {
        "arrival_quantity": current_arrival,
        "arrival_trend": trend,
        "supply_pressure": pressure
    }

def calculate_economic_signals(
    latest_price: float,
    expected_gain: float,
    storage_available: bool,
    storage_cost: Optional[float],
    transport_cost: Optional[float]
) -> Dict[str, Any]:

    transport_cost_status = "AVAILABLE" if transport_cost is not None else "UNAVAILABLE"
    storage_cost_status = "AVAILABLE" if storage_cost is not None else "UNAVAILABLE"

    economic_uncertainty = False
    if transport_cost is None or (storage_available and storage_cost is None):
        economic_uncertainty = True

    net_expected_gain = expected_gain
    if storage_available and storage_cost is not None and storage_cost > 0:
        net_expected_gain -= storage_cost
    if transport_cost is not None and transport_cost > 0:
        net_expected_gain -= transport_cost

    expected_gain_pct = round((net_expected_gain / latest_price) * 100, 2) if latest_price > 0 else 0
    upside_score = min(100.0, max(0.0, expected_gain_pct * 5.0)) # heuristic scaling

    storage_score = None
    if storage_available:
        if storage_cost is None:
            storage_score = 50.0  # Moderate score when cost unknown
        elif storage_cost == 0:
            storage_score = 100.0 # Free storage
        else:
            # penalize higher storage cost
            storage_score = max(0.0, 100.0 - (storage_cost / (latest_price * 0.01) if latest_price else 100))

    return {
        "net_expected_gain": round(net_expected_gain, 2),
        "expected_gain_pct": expected_gain_pct,
        "transport_cost": transport_cost,
        "transport_cost_status": transport_cost_status,
        "storage_cost": storage_cost,
        "storage_cost_status": storage_cost_status,
        "economic_uncertainty": economic_uncertainty,
        "upside_score": round(upside_score, 1),
        "storage_score": round(storage_score, 1) if storage_score is not None else None,
        "storage_feasibility": storage_available
    }

def calculate_volatility(history: List[dict]) -> dict:
    if len(history) < 3:
        return {"price_volatility": None, "volatility_level": "UNKNOWN"}

    returns = []
    for i in range(1, len(history)):
        prev = float(history[i-1].get("modal_price", 0))
        curr = float(history[i].get("modal_price", 0))
        if prev > 0:
            returns.append((curr - prev) / prev)

    if not returns:
        return {"price_volatility": None, "volatility_level": "UNKNOWN"}

    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    std_dev = math.sqrt(variance) * 100 # percentage

    if std_dev < 2.0:
        level = "LOW"
    elif std_dev <= 5.0:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return {
        "price_volatility": round(std_dev, 2),
        "volatility_level": level
    }

def calculate_downside_risk(history: List[dict], volatility: float, trend_dir: str) -> dict:
    if not history or volatility is None:
        return {"risk_score": None, "risk_level": "UNKNOWN", "risk_status": "UNAVAILABLE"}

    current_price = float(history[-1].get("modal_price", 0))
    min_price = min((float(p.get("modal_price", 0)) for p in history), default=current_price)

    if current_price <= 0:
        return {"risk_score": None, "risk_level": "UNKNOWN", "risk_status": "UNAVAILABLE"}

    drawdown_potential = ((current_price - min_price) / current_price) * 100

    base_risk = volatility * 5.0
    if trend_dir == "down":
        base_risk += 20.0

    base_risk += drawdown_potential

    risk_score = min(100.0, max(0.0, base_risk))

    if risk_score < 30:
        level = "LOW"
    elif risk_score < 60:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return {
        "risk_score": round(risk_score, 1),
        "risk_level": level,
        "risk_status": "AVAILABLE"
    }

def evaluate_market_systemic_risk() -> dict:
    return {
        "market_behavior_signal": "UNAVAILABLE",
        "market_systemic_risk": "UNAVAILABLE",
        "wait_concentration": None
    }

def calculate_data_freshness(latest_entry: dict) -> str:
    freshness = latest_entry.get("freshness")
    if freshness is None:
        return "UNAVAILABLE"

    f_str = str(freshness).lower()
    if "fallback" in f_str or "stale" in f_str:
        return "STALE"
    return freshness
