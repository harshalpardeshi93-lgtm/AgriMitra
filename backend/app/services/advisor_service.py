from typing import Optional
from sqlalchemy.orm import Session
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market
from app.ml.market_advisor import generate_market_recommendation
from app.schemas.advisor import AdvisorResponse, MarketRankingItem

from app.services.price_service import get_market_prices

def get_ai_advisor_recommendation(
    db: Session,
    crop_id: int,
    quantity_kg: float = 500.0,
    quality_grade: str = "Grade A",
    storage_available: Optional[bool] = None,
    storage_cost: Optional[float] = None,
    transport_cost: Optional[float] = None
) -> Optional[AdvisorResponse]:
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        return None

    markets = db.query(Market).all()
    market_price_history_map = {}
    
    # Get the merged latest prices (live over fallback) from price_service
    latest_prices_responses = get_market_prices(db, crop_id=crop_id)
    latest_price_map = {
        f"{r.market_name}_{r.district}_{r.state}".lower(): r
        for r in latest_prices_responses
    }

    for m in markets:
        prices = (
            db.query(MarketPrice)
            .filter(MarketPrice.crop_id == crop_id, MarketPrice.market_id == m.id)
            .order_by(MarketPrice.date.asc())
            .all()
        )
        if prices:
            history = [
                {
                    "date": p.date,
                    "modal_price": p.modal_price,
                    "arrival_quantity": p.arrival_quantity,
                    "district": m.district,
                    "state": m.state,
                    "freshness": "Fallback",
                    "source_name": "AgriMitra Database"
                }
                for p in prices
            ]
            
            # Check if we have merged live data for this market
            key = f"{m.name}_{m.district}_{m.state}".lower()
            if key in latest_price_map:
                latest = latest_price_map[key]
                # If the live date is the same as the last DB date, replace it; else append
                live_record = {
                    "date": latest.date,
                    "modal_price": latest.modal_price,
                    "arrival_quantity": latest.arrival_quantity,
                    "district": latest.district,
                    "state": latest.state,
                    "freshness": latest.freshness,
                    "source_name": latest.source_name
                }
                if history and history[-1]["date"] == latest.date:
                    history[-1] = live_record
                else:
                    history.append(live_record)
                    
            market_price_history_map[m.name] = history

    # Phase 4: Fetch Weather Data for the general area (using first market's location as proxy for prototype)
    weather_data = None
    if markets:
        try:
            from app.services.weather_service import WeatherService
            ws = WeatherService()
            weather_data = ws.get_weather_for_location(district=markets[0].district, state=markets[0].state)
        except Exception as e:
            pass

    rec = generate_market_recommendation(
        crop_name=crop.name,
        quantity_kg=quantity_kg,
        quality_grade=quality_grade,
        market_price_history_map=market_price_history_map,
        storage_available=storage_available,
        storage_cost=storage_cost,
        transport_cost=transport_cost,
        weather_data=weather_data
    )

    market_rankings = [
        MarketRankingItem(
            market_name=item["market_name"],
            district=item["district"],
            state=item["state"],
            latest_modal_price=item["latest_modal_price"],
            expected_5d_price=item["expected_5d_price"],
            expected_gain=item["expected_gain"],
            expected_gain_pct=item["expected_gain_pct"],
            trend_direction=item["trend_direction"],
            price_change_pct=item["price_change_pct"],
            arrival_quantity=item["arrival_quantity"],
            composite_score=item["composite_score"],
            freshness=item.get("freshness", "Fallback"),
            source_name=item.get("source_name", "AgriMitra Database")
        )
        for item in rec.get("market_rankings", [])
    ]

    return AdvisorResponse(
        crop_id=crop.id,
        crop_name=crop.name,
        quantity_kg=quantity_kg,
        quality_grade=quality_grade,
        recommended_market=rec.get("recommended_market", "N/A"),
        district=rec.get("district", ""),
        state=rec.get("state", ""),
        current_modal_price=rec.get("current_modal_price", 0.0),
        expected_price=rec.get("expected_price", 0.0),
        expected_gain=rec.get("expected_gain", 0.0),
        recommended_window=rec.get("recommended_window", "Sell within 1–2 days"),
        confidence_level=rec.get("confidence_level", "Confidence estimate"),
        confidence_score=rec.get("confidence_score", 60.0),
        mae_validation_score=rec.get("mae_validation_score", 0.0),
        observation_count=rec.get("observation_count", 0),
        key_reasons=rec.get("key_reasons", []),
        market_rankings=market_rankings,
        data_disclaimer="AI-assisted estimate based on prototype market data.",
        decision=rec.get("decision"),
        decision_label=rec.get("decision_label"),
        decision_reason=rec.get("decision_reason"),
        price_volatility=rec.get("price_volatility"),
        volatility_level=rec.get("volatility_level"),
        downside_risk_score=rec.get("downside_risk_score"),
        risk_level=rec.get("risk_level"),
        arrival_data_available=rec.get("arrival_data_available", False),
        arrival_signal=rec.get("arrival_signal", "UNAVAILABLE"),
        storage_available=rec.get("storage_available", False),
        storage_cost=rec.get("storage_cost"),
        transport_cost=rec.get("transport_cost"),
        recommended_sell_quantity=rec.get("recommended_sell_quantity"),
        recommended_hold_quantity=rec.get("recommended_hold_quantity"),
        data_freshness=rec.get("data_freshness", "Fallback"),
        warnings=rec.get("warnings", []),
        market_behavior_signal=rec.get("market_behavior_signal", "UNAVAILABLE"),
        market_systemic_risk=rec.get("market_systemic_risk", "UNAVAILABLE"),
        wait_concentration=rec.get("wait_concentration"),
        
        # Phase 4 Weather Risk Fields
        weather_data_available=rec.get("weather_data_available", False),
        weather_risk_level=rec.get("weather_risk_level", "UNAVAILABLE"),
        weather_condition=rec.get("weather_condition"),
        weather_warning=rec.get("weather_warning"),
        weather_source=rec.get("weather_source", "IMD"),
        weather_fetched_at=rec.get("weather_fetched_at")
    )
