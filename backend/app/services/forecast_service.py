from typing import Optional
from sqlalchemy.orm import Session
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market
from app.ml.price_forecaster import forecast_prices
from app.schemas.forecast import ForecastResponse, ForecastPoint

def get_crop_market_forecast(
    db: Session,
    crop_id: int,
    market_id: int,
    horizon_days: int = 7
) -> Optional[ForecastResponse]:
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    market = db.query(Market).filter(Market.id == market_id).first()

    if not crop or not market:
        return None

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
            "arrival_quantity": p.arrival_quantity
        }
        for p in prices
    ]

    forecast_res = forecast_prices(history_dicts, horizon_days=horizon_days)

    forecast_points = [
        ForecastPoint(
            date=pt["date"],
            predicted_modal_price=pt["predicted_modal_price"],
            min_expected=pt["min_expected"],
            max_expected=pt["max_expected"],
            is_forecast=True
        )
        for pt in forecast_res.get("forecast_points", [])
    ]

    return ForecastResponse(
        crop_id=crop.id,
        crop_name=crop.name,
        market_id=market.id,
        market_name=market.name,
        horizon_days=horizon_days,
        mae_score=forecast_res.get("mae_score", 0.0),
        observation_count=forecast_res.get("observation_count", len(history_dicts)),
        confidence_score=forecast_res.get("confidence_score", 60.0),
        confidence_label=forecast_res.get("confidence_label", "Confidence estimate"),
        forecast_points=forecast_points
    )
