from typing import Dict, List, Any
from app.ml.trend_analyzer import analyze_price_trend
from app.ml.price_forecaster import forecast_prices

def generate_market_recommendation(
    crop_name: str,
    quantity_kg: float,
    quality_grade: str,
    market_price_history_map: Dict[str, List[dict]]
) -> Dict[str, Any]:
    """
    Multi-factor explainable recommendation scoring engine with rule-based selling windows.
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
            "market_rankings": []
        }

    rankings = []

    for m_name, history in market_price_history_map.items():
        if not history:
            continue

        latest_entry = history[-1]
        latest_price = float(latest_entry.get("modal_price", 0))
        arrival_qty = float(latest_entry.get("arrival_quantity", 0))
        district = latest_entry.get("district", "")
        state = latest_entry.get("state", "")

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
        expected_gain_pct = round((expected_gain / latest_price) * 100, 2) if latest_price > 0 else 0

        # Multi-factor Composite Score (0 - 100)
        price_score = min(50.0, (latest_price / 100.0))
        momentum_score = min(30.0, max(-10.0, expected_gain_pct * 4.0))
        liquidity_score = min(20.0, (arrival_qty / 200.0))

        composite_score = round(price_score + momentum_score + liquidity_score, 1)

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
            "confidence_label": confidence_label
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
            "market_rankings": []
        }

    # Sort rankings by composite score descending
    rankings.sort(key=lambda x: x["composite_score"], reverse=True)
    top_market = rankings[0]

    # RULE-BASED EXPLAINABLE SELLING WINDOW LOGIC
    top_obs = top_market["obs_count"]
    top_gain_pct = top_market["expected_gain_pct"]

    if top_obs < 7:
        recommended_window = "Limited confidence"
        window_explanation = f"Insufficient historical observations ({top_obs} days). Recommendation carries limited confidence."
    elif top_gain_pct >= 2.0:
        recommended_window = "Consider waiting"
        window_explanation = f"Prices are trending upwards (+{top_gain_pct}% expected gain). Consider waiting 3–5 days to capture higher realization."
    elif top_gain_pct <= -2.0:
        recommended_window = "Sell now"
        window_explanation = f"Price trajectory indicates potential near-term drop ({top_gain_pct}%). Selling now locks in current peak value."
    else:
        recommended_window = "Sell within 1–2 days"
        window_explanation = "Market prices are stable with steady buyer demand. Selling within 1–2 days is recommended."

    reasons = [
        f"Recommended because {top_market['market_name']} offers the highest overall realization (₹{top_market['latest_modal_price']:.0f}/qtl).",
        f"Chronological validation error MAE is ₹{top_market['mae_score']:.1f}/qtl over {top_obs} historical observations.",
        window_explanation
    ]

    if quality_grade == "Grade A":
        reasons.append("Grade A quality grade qualifies for premium price realization at this market.")

    return {
        "recommended_market": top_market["market_name"],
        "district": top_market["district"],
        "state": top_market["state"],
        "current_modal_price": top_market["latest_modal_price"],
        "expected_price": top_market["expected_5d_price"],
        "expected_gain": top_market["expected_gain"],
        "recommended_window": recommended_window,
        "confidence_level": top_market["confidence_label"],
        "confidence_score": top_market["forecast_confidence"],
        "mae_validation_score": top_market["mae_score"],
        "observation_count": top_obs,
        "key_reasons": reasons,
        "market_rankings": rankings
    }
