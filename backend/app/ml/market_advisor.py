import math
from typing import Dict, List, Any
from app.ml.trend_analyzer import analyze_price_trend
from app.ml.price_forecaster import forecast_prices

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
        return {"downside_risk_score": None, "risk_level": "UNKNOWN"}
    
    current_price = float(history[-1].get("modal_price", 0))
    min_price = min((float(p.get("modal_price", 0)) for p in history), default=current_price)
    
    if current_price <= 0:
        return {"downside_risk_score": None, "risk_level": "UNKNOWN"}
        
    drawdown_potential = ((current_price - min_price) / current_price) * 100
    
    # Simple heuristic risk score (0-100)
    # Higher volatility + downward trend + high drawdown potential = higher risk
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
        "downside_risk_score": round(risk_score, 1),
        "risk_level": level
    }

def evaluate_market_systemic_risk() -> dict:
    # Prototype currently does not have real multi-farmer decision tracking
    # Return UNAVAILABLE as requested.
    return {
        "market_behavior_signal": "UNAVAILABLE",
        "market_systemic_risk": "UNAVAILABLE",
        "wait_concentration": None
    }

def generate_market_recommendation(
    crop_name: str,
    quantity_kg: float,
    quality_grade: str,
    market_price_history_map: Dict[str, List[dict]],
    storage_available: bool = False,
    storage_cost: float = None,
    transport_cost: float = None,
    weather_data: dict = None
) -> Dict[str, Any]:
    """
    Risk-Aware AI Sell Advisor logic with downside risk and volatility.
    """
    if not market_price_history_map:
        return {
            "recommended_market": "No market data available",
            "current_modal_price": None,
            "expected_price": None,
            "expected_gain": None,
            "recommended_window": "Limited confidence",
            "confidence_label": "Limited confidence",
            "confidence_score": None,
            "mae_validation_score": None,
            "observation_count": 0,
            "key_reasons": ["Insufficient historical market data available."],
            "market_rankings": [],
            "decision": "INSUFFICIENT_DATA",
            "decision_label": "Insufficient Data",
            "decision_reason": "No active markets found.",
            "arrival_data_available": False,
            "arrival_signal": "UNAVAILABLE"
        }

    rankings = []

    for m_name, history in market_price_history_map.items():
        if not history:
            continue

        latest_entry = history[-1]
        latest_price = float(latest_entry.get("modal_price", 0))
        
        raw_arr = latest_entry.get("arrival_quantity")
        arrival_qty = float(raw_arr) if raw_arr is not None else None
        
        district = latest_entry.get("district", "")
        state = latest_entry.get("state", "")
        freshness = latest_entry.get("freshness", "Fallback")
        source_name = latest_entry.get("source_name", "AgriMitra Database")

        # 1. Trend Analysis
        trend_res = analyze_price_trend(history)
        price_change_pct = trend_res["price_change_pct"]
        trend_direction = trend_res["trend_direction"]
        obs_count = trend_res["data_points_count"]

        # 2. Chronological Forecast & Dynamic Confidence
        forecast_res = forecast_prices(history, horizon_days=5)
        forecast_points = forecast_res.get("forecast_points", [])
        mae_score = forecast_res.get("mae_score", 0.0)
        confidence_score = forecast_res.get("confidence_score", 60.0)
        confidence_label = forecast_res.get("confidence_label", "Confidence estimate")

        future_5d_price = forecast_points[-1]["predicted_modal_price"] if forecast_points else latest_price
        expected_gain = round(future_5d_price - latest_price, 2)
        
        # Adjust expected gain based on costs
        net_expected_gain = expected_gain
        if storage_available and storage_cost is not None and storage_cost > 0:
            net_expected_gain -= storage_cost
        if transport_cost is not None and transport_cost > 0:
            net_expected_gain -= transport_cost
            
        expected_gain_pct = round((net_expected_gain / latest_price) * 100, 2) if latest_price > 0 else 0

        # Multi-factor Composite Score (0 - 100)
        price_score = min(50.0, (latest_price / 100.0))
        momentum_score = min(30.0, max(-10.0, expected_gain_pct * 4.0))
        
        if arrival_qty is not None:
            liquidity_score = min(20.0, (arrival_qty / 200.0))
            composite_score = round(price_score + momentum_score + liquidity_score, 1)
        else:
            # If arrival data is missing, calculate without penalizing as 0, scale to 100
            base = price_score + momentum_score
            composite_score = round(base * (100.0 / 80.0), 1)

        rankings.append({
            "market_name": m_name,
            "district": district,
            "state": state,
            "latest_modal_price": latest_price,
            "expected_5d_price": future_5d_price,
            "expected_gain": expected_gain,
            "expected_gain_pct": expected_gain_pct,
            "trend_direction": trend_direction,
            "price_change_pct": price_change_pct,
            "arrival_quantity": arrival_qty,
            "composite_score": composite_score,
            "mae_score": mae_score,
            "obs_count": obs_count,
            "forecast_confidence": confidence_score,
            "confidence_label": confidence_label,
            "freshness": freshness,
            "source_name": source_name,
            "history": history
        })

    if not rankings:
        return {
            "recommended_market": "N/A",
            "current_modal_price": None,
            "expected_price": None,
            "expected_gain": None,
            "recommended_window": "Limited confidence",
            "confidence_label": "Limited confidence",
            "confidence_score": None,
            "mae_validation_score": None,
            "observation_count": 0,
            "key_reasons": ["No active markets found."],
            "market_rankings": [],
            "decision": "INSUFFICIENT_DATA",
            "decision_label": "Insufficient Data",
            "decision_reason": "No valid data to form a recommendation."
        }

    # Sort rankings by composite score descending
    rankings.sort(key=lambda x: x["composite_score"], reverse=True)
    top_market = rankings[0]

    top_obs = top_market["obs_count"]
    top_gain_pct = top_market["expected_gain_pct"]
    top_confidence = top_market["forecast_confidence"]
    top_history = top_market["history"]
    
    # Calculate Risk factors
    vol_data = calculate_volatility(top_history)
    volatility = vol_data["price_volatility"]
    vol_level = vol_data["volatility_level"]
    
    risk_data = calculate_downside_risk(top_history, volatility, top_market["trend_direction"])
    risk_score = risk_data["downside_risk_score"]
    risk_level = risk_data["risk_level"]
    
    sys_risk_data = evaluate_market_systemic_risk()
    
    arrival_avail = top_market["arrival_quantity"] is not None
    warnings = []
    
    if not arrival_avail:
        warnings.append("Arrival/supply data is currently unavailable.")
        if top_confidence > 10.0:
            top_confidence -= 10.0 # Reduce confidence when supply data is missing

    if storage_available and storage_cost is None:
        warnings.append("Storage is available but cost is unknown. Estimates may be optimistic.")
        if top_confidence > 5.0:
            top_confidence -= 5.0

    # DECISION ENGINE HIERARCHY
    decision = "SELL_NOW"
    decision_reason = "Current price is attractive and downside risk is elevated."
    decision_label = "Sell now"
    
    if top_obs < 3 or top_market["latest_modal_price"] <= 0:
        decision = "INSUFFICIENT_DATA"
        decision_label = "Insufficient Data"
        decision_reason = "Not enough reliable data to form a recommendation."
    elif top_confidence < 40.0 and risk_level != "HIGH" and vol_level != "HIGH":
        decision = "LOW_CONFIDENCE"
        decision_label = "Low confidence"
        decision_reason = "Not enough reliable data to recommend waiting."
    else:
        if top_gain_pct <= 0.5:
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Price trajectory indicates minimal upside or potential near-term drop. Selling now locks in current value."
        elif risk_level == "HIGH":
            if storage_available and top_gain_pct > 2.0:
                decision = "PARTIAL_SELL"
                decision_label = "Sell part now"
                decision_reason = "Price may improve, but recent high volatility and downside risk makes waiting fully riskier. Sell a portion now and hold the remainder only if storage is available."
            else:
                decision = "SELL_NOW"
                decision_label = "Sell now"
                decision_reason = "Downside risk is high. Current price is attractive relative to risk."
        elif vol_level == "HIGH":
            if storage_available and top_gain_pct > 1.0:
                decision = "PARTIAL_SELL"
                decision_label = "Sell part now"
                decision_reason = "Potential upside exists, but recent volatility makes waiting riskier. Sell a portion to lock in value and hold the remainder only if storage is available."
            else:
                decision = "SELL_NOW"
                decision_label = "Sell now"
                decision_reason = "High volatility and no available storage makes waiting unsafe."
        elif top_gain_pct > 2.0 and storage_available:
            if sys_risk_data["market_systemic_risk"] == "HIGH":
                decision = "PARTIAL_SELL"
                decision_label = "Sell part now"
                decision_reason = "Expected upside is meaningful, but market concentration is high. Sell partially to manage systemic risk."
            else:
                decision = "WAIT"
                decision_label = "Wait"
                decision_reason = "Potential upside is meaningful and current risk is relatively low. Storage is available."
        elif top_gain_pct > 2.0 and not storage_available:
            # Cannot hold without storage
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Expected price has upside, but holding is not feasible without storage."
        else:
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Market is stable but potential upside is limited considering costs and risk."

    # Integrate Weather Risk (Rule: Weather is a SUPPORTING risk signal, not a direct price predictor)
    if weather_data and weather_data.get("risk_level") == "HIGH":
        if decision == "WAIT":
            decision = "PARTIAL_SELL"
            decision_label = "Sell part now"
            decision_reason = "Potential upside is meaningful, but severe weather (e.g., heavy rainfall) may increase transport and selling uncertainty. Sell partially to manage weather risk."
        elif decision == "PARTIAL_SELL":
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Recent volatility and high weather risk make waiting too risky. Secure value now before transport becomes difficult."

    # Map decision to legacy recommended_window for backward compatibility
    if decision == "WAIT":
        recommended_window = "Consider waiting"
    elif decision == "PARTIAL_SELL":
        recommended_window = "Sell within 1-2 days"
    elif decision == "SELL_NOW":
        recommended_window = "Sell now"
    else:
        recommended_window = "Limited confidence"

    reasons = [
        f"Recommended because {top_market['market_name']} offers the highest overall realization (₹{top_market['latest_modal_price']:.0f}/qtl).",
        f"Chronological validation error MAE is ₹{top_market['mae_score']:.1f}/qtl over {top_obs} historical observations.",
        decision_reason
    ]

    if quality_grade == "Grade A":
        reasons.append("Grade A quality grade qualifies for premium price realization at this market.")
        
    if not arrival_avail:
        reasons.append("Arrival quantity (supply volume) is currently unavailable. Proceed with caution.")
        
    if weather_data and weather_data.get("risk_level") == "HIGH":
        reasons.append("High weather risk may impact operations.")

    # Clean up history object from rankings to avoid serializing massive lists
    for r in rankings:
        r.pop("history", None)
        
    # Safely extract weather fields
    w_data = weather_data or {}


    return {
        "recommended_market": top_market["market_name"],
        "district": top_market["district"],
        "state": top_market["state"],
        "current_modal_price": top_market["latest_modal_price"],
        "expected_price": top_market["expected_5d_price"],
        "expected_gain": top_market["expected_gain"],
        "recommended_window": recommended_window,
        "confidence_level": top_market["confidence_label"],
        "confidence_score": top_confidence,
        "mae_validation_score": top_market["mae_score"],
        "observation_count": top_obs,
        "key_reasons": reasons,
        "market_rankings": rankings,
        
        # New Phase 2 Fields
        "decision": decision,
        "decision_label": decision_label,
        "decision_reason": decision_reason,
        "price_volatility": volatility,
        "volatility_level": vol_level,
        "downside_risk_score": risk_score,
        "risk_level": risk_level,
        "arrival_data_available": arrival_avail,
        "arrival_signal": "UNAVAILABLE",
        "storage_available": storage_available,
        "storage_cost": storage_cost,
        "transport_cost": transport_cost,
        "recommended_sell_quantity": None, # Qualitative only
        "recommended_hold_quantity": None,
        "data_freshness": top_market["freshness"],
        "warnings": warnings,
        "market_behavior_signal": sys_risk_data["market_behavior_signal"],
        "market_systemic_risk": sys_risk_data["market_systemic_risk"],
        "wait_concentration": sys_risk_data["wait_concentration"],
        
        # Phase 4 Weather Risk Fields
        "weather_data_available": w_data.get("available", False),
        "weather_risk_level": w_data.get("risk_level", "UNAVAILABLE"),
        "weather_condition": w_data.get("condition"),
        "weather_warning": w_data.get("warning"),
        "weather_source": w_data.get("source", "IMD"),
        "weather_fetched_at": w_data.get("fetched_at")
    }
