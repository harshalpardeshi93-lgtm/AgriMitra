from typing import Optional
from sqlalchemy.orm import Session
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market
from app.ml.trend_analyzer import analyze_price_trend
from app.schemas.trend import TrendResponse, TrendPoint

def get_crop_market_trend(
    db: Session,
    crop_id: int,
    market_id: int,
    days: int = 14
) -> Optional[TrendResponse]:
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    market = db.query(Market).filter(Market.id == market_id).first()

    if not crop or not market:
        return None

    # Fetch last N days of historical price entries
    prices = (
        db.query(MarketPrice)
        .filter(MarketPrice.crop_id == crop_id, MarketPrice.market_id == market_id)
        .order_by(MarketPrice.date.asc())
        .all()
    )

    history_dicts = [
        {
            "date": p.date,
            "modal_price": p.modal_price,
            "min_price": p.min_price,
            "max_price": p.max_price,
            "arrival_quantity": p.arrival_quantity
        }
        for p in prices
    ]

    analysis = analyze_price_trend(history_dicts)

    trend_points = [
        TrendPoint(
            date=p["date"],
            modal_price=p["modal_price"],
            min_price=p["min_price"],
            max_price=p["max_price"],
            arrival_quantity=p["arrival_quantity"]
        )
        for p in history_dicts[-days:]
    ]

    return TrendResponse(
        crop_id=crop.id,
        crop_name=crop.name,
        market_id=market.id,
        market_name=market.name,
        trend_direction=analysis.get("trend_direction", "Stable"),
        price_change_pct=analysis.get("price_change_pct", None),
        price_velocity_per_day=analysis.get("price_velocity_per_day", None),
        sma_3=analysis.get("sma_3", None),
        sma_7=analysis.get("sma_7", None),
        volatility=analysis.get("volatility", None),
        latest_price=analysis.get("latest_price", None),
        historical_points=trend_points
    )
