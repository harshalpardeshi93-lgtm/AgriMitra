from typing import Dict, List, Any, Optional
from app.ml.trend_analyzer import analyze_price_trend
from app.ml.price_forecaster import forecast_prices
from app.ml.risk_signals import (
    calculate_expected_gain,
    extract_arrival_signal,
    calculate_economic_signals,
    calculate_volatility,
    calculate_downside_risk,
    evaluate_market_systemic_risk,
    calculate_data_freshness
)

def generate_market_recommendation(
    crop_name: str,
    quantity_kg: float,
    quality_grade: str,
    market_price_history_map: Dict[str, List[dict]],
    storage_available: Optional[bool] = None,
    storage_cost: Optional[float] = None,
    transport_cost: Optional[float] = None,
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
            "confidence_level": "Limited confidence",
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

        arrival_signal = extract_arrival_signal(history)
        arrival_qty = arrival_signal["arrival_quantity"]
        arrival_trend_val = arrival_signal["arrival_trend"]
        supply_pressure_val = arrival_signal["supply_pressure"]

        district = latest_entry.get("district", "")
        state = latest_entry.get("state", "")
        freshness = calculate_data_freshness(latest_entry)
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
        expected_gain = calculate_expected_gain(latest_price, future_5d_price)

        eco_signals = calculate_economic_signals(
            latest_price=latest_price,
            expected_gain=expected_gain,
            storage_available=storage_available,
            storage_cost=storage_cost,
            transport_cost=transport_cost
        )

        expected_gain_pct = eco_signals["expected_gain_pct"]

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
            "arrival_trend": arrival_trend_val,
            "supply_pressure": supply_pressure_val,
            "economic_uncertainty": eco_signals["economic_uncertainty"],
            "upside_score": eco_signals["upside_score"],
            "storage_score": eco_signals["storage_score"],
            "transport_cost_status": eco_signals["transport_cost_status"],
            "storage_cost_status": eco_signals["storage_cost_status"],
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
            "confidence_level": "Limited confidence",
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

    supply_pressure = top_market["supply_pressure"]
    economic_uncertainty = top_market["economic_uncertainty"]
    upside_score = top_market["upside_score"]
    storage_score = top_market["storage_score"]
    transport_cost_status = top_market["transport_cost_status"]
    storage_cost_status = top_market["storage_cost_status"]
    arrival_trend = top_market["arrival_trend"]

    # Calculate Risk factors
    vol_data = calculate_volatility(top_history)
    volatility = vol_data["price_volatility"]
    vol_level = vol_data["volatility_level"]

    risk_data = calculate_downside_risk(top_history, volatility, top_market["trend_direction"])
    risk_score = risk_data.get("risk_score")
    risk_level = risk_data.get("risk_level")

    sys_risk_data = evaluate_market_systemic_risk()

    arrival_avail = top_market["arrival_quantity"] is not None
    warnings = []

    if not arrival_avail:
        warnings.append("Arrival/supply data is currently unavailable.")

    if storage_available is None:
        warnings.append("Storage availability is unknown.")
    elif storage_available and storage_cost is None:
        warnings.append("Storage is available but cost is unknown. Estimates may be optimistic.")

    top_confidence_label = top_market["confidence_label"]
    if not arrival_avail or storage_available is None or risk_level == "UNKNOWN" or vol_level == "UNKNOWN":
        if top_confidence is not None and top_confidence >= 40.0:
            top_confidence_label = "Incomplete Data"

    # DECISION ENGINE HIERARCHY (HERD-BEHAVIOR SAFE)
    decision = "SELL_NOW"
    decision_reason = "Model estimates current price is attractive relative to risk."
    decision_label = "Sell now"

    w_data = weather_data or {}

    # We will compute quantities after the decision logic
    # based on quantity_kg

    if top_obs < 3 or top_market["latest_modal_price"] <= 0:
        decision = "INSUFFICIENT_DATA"
        decision_label = "Insufficient Data"
        decision_reason = "Model estimates there is not enough reliable data to form a recommendation."
        # If there's insufficient data, confidence should also be unavaiable.
        top_confidence = None
    elif top_confidence is not None and top_confidence < 40.0 and risk_level != "HIGH" and vol_level != "HIGH":
        decision = "LOW_CONFIDENCE"
        decision_label = "Low confidence"
        decision_reason = "Model estimates there is not enough reliable data to recommend waiting."
    else:
        # STRICT CONDITIONS FOR WAIT
        can_wait = (
            top_gain_pct > 2.0 and
            (top_confidence is not None and top_confidence >= 40.0) and
            risk_level in ("LOW", "MEDIUM") and
            vol_level in ("LOW", "MEDIUM") and
            sys_risk_data["market_systemic_risk"] != "HIGH"
        )

        if can_wait and storage_available is True:
            decision = "WAIT"
            decision_label = "Wait"
            decision_reason = "Model estimates potential upside is meaningful, and current systemic/downside risk is relatively low. Storage is available."
        elif can_wait and storage_available is None:
            decision = "WAIT"
            decision_label = "Wait (if storage available)"
            decision_reason = "Model estimates potential upside is meaningful and risk is low. Consider waiting ONLY IF storage is available."
        elif top_gain_pct > 1.0 and storage_available is True:
            # Downgrade to PARTIAL_SELL
            decision = "PARTIAL_SELL"
            decision_label = "Sell part now"
            if risk_level == "HIGH" or vol_level == "HIGH":
                decision_reason = "Model estimates potential upside exists, but recent volatility/downside risk makes waiting fully riskier. Selling part of the produce now can protect current value."
            elif sys_risk_data["market_systemic_risk"] == "HIGH":
                decision_reason = "Model estimates expected upside is meaningful, but market concentration is high. Sell partially to manage systemic risk."
            else:
                decision_reason = "Model estimates potential upside is modest. Selling part of the produce now can protect current value while retaining some upside."
        elif top_gain_pct > 1.0 and storage_available is None:
            decision = "PARTIAL_SELL"
            decision_label = "Sell part now (if storage available)"
            decision_reason = "Model estimates potential upside is modest. Consider a partial sell ONLY IF storage is available."
        elif top_gain_pct > 1.0 and storage_available is False:
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Model estimates expected price has upside, but holding is not feasible without storage."
        else:
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Model estimates price trajectory indicates minimal upside or potential near-term drop. Selling now locks in current value."

    # Integrate Weather Risk (Rule: Weather is a SUPPORTING risk signal, not a direct price predictor)
    if weather_data and weather_data.get("risk_level") == "HIGH":
        if decision == "WAIT":
            decision = "PARTIAL_SELL"
            decision_label = "Sell part now"
            decision_reason = "Model estimates potential upside is meaningful, but severe weather may increase transport uncertainty. Sell partially to manage weather risk."
        elif decision == "PARTIAL_SELL":
            decision = "SELL_NOW"
            decision_label = "Sell now"
            decision_reason = "Model estimates recent volatility and high weather risk make waiting too risky. Secure value now before transport becomes difficult."

    rec_sell_qty = None
    rec_hold_qty = None
    if quantity_kg is not None and quantity_kg > 0:
        if decision in ["INSUFFICIENT_DATA", "LOW_CONFIDENCE"]:
            rec_sell_qty = None
            rec_hold_qty = None
        elif decision == "SELL_NOW":
            rec_sell_qty = float(quantity_kg)
            rec_hold_qty = 0.0
        elif decision == "WAIT":
            rec_sell_qty = 0.0
            rec_hold_qty = float(quantity_kg)
        elif decision == "PARTIAL_SELL":
            hold_ratio = 0.5
            if top_gain_pct is not None and top_gain_pct > 1.0:
                hold_ratio += min(0.2, (top_gain_pct - 1.0) * 0.05)
            if top_confidence is not None:
                if top_confidence >= 70:
                    hold_ratio += 0.1
                elif top_confidence < 40:
                    hold_ratio -= 0.1
            if storage_available:
                hold_ratio += 0.1
            else:
                hold_ratio -= 0.3
            if risk_level == "HIGH":
                hold_ratio -= 0.2
            elif risk_level == "MEDIUM":
                hold_ratio -= 0.05
            if vol_level == "HIGH":
                hold_ratio -= 0.15
            elif vol_level == "MEDIUM":
                hold_ratio -= 0.05
            if supply_pressure == "HIGH":
                hold_ratio -= 0.15
            elif supply_pressure == "MEDIUM":
                hold_ratio -= 0.05
            if sys_risk_data.get("market_systemic_risk") == "HIGH":
                hold_ratio -= 0.15
            if w_data.get("risk_level") == "HIGH":
                hold_ratio -= 0.15

            hold_ratio = max(0.1, min(0.9, hold_ratio))
            rec_hold_qty = round(quantity_kg * hold_ratio, 2)
            rec_sell_qty = round(quantity_kg - rec_hold_qty, 2)

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

    risk_flags = []
    if risk_level == "HIGH":
        risk_flags.append("HIGH_DOWNSIDE_RISK")
    if vol_level == "HIGH":
        risk_flags.append("HIGH_VOLATILITY")
    if supply_pressure == "HIGH":
        risk_flags.append("HIGH_SUPPLY_PRESSURE")
    if storage_available is False:
        risk_flags.append("STORAGE_UNAVAILABLE")
    if w_data.get("risk_level") == "HIGH":
        risk_flags.append("HIGH_WEATHER_RISK")
    if economic_uncertainty:
        risk_flags.append("ECONOMIC_UNCERTAINTY")
    if top_confidence is not None and top_confidence < 40:
        risk_flags.append("LOW_CONFIDENCE")
    if top_market["freshness"] == "Stale":
        risk_flags.append("STALE_DATA")

    supply_pressure_status = supply_pressure if arrival_avail else "UNAVAILABLE"

    # decision horizon based on forecast points
    decision_horizon = "5 days" if top_market.get("expected_5d_price") else None

    return {
        "recommended_market": top_market["market_name"],
        "district": top_market["district"],
        "state": top_market["state"],
        "current_modal_price": top_market["latest_modal_price"],
        "expected_price": top_market["expected_5d_price"],
        "expected_gain": top_market["expected_gain"],
        "recommended_window": recommended_window,
        "confidence_level": top_confidence_label,
        "confidence_score": top_confidence,
        "mae_validation_score": top_market["mae_score"],
        "observation_count": top_obs,
        "key_reasons": reasons,
        "market_rankings": rankings,
        "data_disclaimer": "Market insights are based on structured prototype data and are designed for integration with government/open-data sources.",

        "decision": decision,
        "decision_label": decision_label,
        "decision_reason": decision_reason,
        "price_volatility": volatility,
        "volatility_level": vol_level,
        "downside_risk_score": risk_score,
        "risk_level": risk_level,
        "arrival_data_available": arrival_avail,
        "arrival_signal": top_market["arrival_trend"],
        "arrival_trend": arrival_trend,
        "supply_pressure": supply_pressure,
        "economic_uncertainty": economic_uncertainty,
        "upside_score": upside_score,
        "storage_score": storage_score,
        "transport_cost_status": transport_cost_status,
        "storage_cost_status": storage_cost_status,
        "storage_available": storage_available,
        "storage_cost": storage_cost,
        "transport_cost": transport_cost,
        "recommended_sell_quantity": rec_sell_qty,
        "recommended_hold_quantity": rec_hold_qty,
        "data_freshness": top_market["freshness"],
        "warnings": warnings,
        "expected_upside_pct": top_market["expected_gain_pct"],
        "downside_risk": risk_level,
        "volatility": vol_level,
        "supply_pressure_status": supply_pressure_status,
        "arrival_quantity": top_market["arrival_quantity"] if arrival_avail else None,
        "storage_feasible": storage_available if storage_available is not None else None,
        "decision_horizon": decision_horizon,
        "risk_flags": risk_flags,

        "market_behavior_signal": sys_risk_data["market_behavior_signal"],
        "market_systemic_risk": sys_risk_data["market_systemic_risk"],
        "wait_concentration": sys_risk_data["wait_concentration"],

        "weather_data_available": w_data.get("available", False),
        "weather_risk_level": w_data.get("risk_level", "UNAVAILABLE"),
        "weather_condition": w_data.get("condition"),
        "weather_warning": w_data.get("warning"),
        "weather_source": w_data.get("source", "IMD"),
        "weather_fetched_at": w_data.get("fetched_at")
    }
