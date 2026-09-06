from typing import Optional
from sqlalchemy.orm import Session
from app.models.price import MarketPrice
from app.models.crop import Crop
from app.models.market import Market
from app.ml.market_advisor import generate_market_recommendation
from app.schemas.advisor import AdvisorResponse, MarketRankingItem

def get_ai_advisor_recommendation(
    db: Session,
    crop_id: int,
    quantity_kg: float = 500.0,
    quality_grade: str = "Grade A"
) -> Optional[AdvisorResponse]:
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        return None

    markets = db.query(Market).all()
    market_price_history_map = {}

    for m in markets:
        prices = (
            db.query(MarketPrice)
            .filter(MarketPrice.crop_id == crop_id, MarketPrice.market_id == m.id)
            .order_by(MarketPrice.date.asc())
            .all()
        )
        if prices:
            market_price_history_map[m.name] = [
                {
                    "date": p.date,
                    "modal_price": p.modal_price,
                    "arrival_quantity": p.arrival_quantity,
                    "district": m.district,
                    "state": m.state
                }
                for p in prices
            ]

    rec = generate_market_recommendation(
        crop_name=crop.name,
        quantity_kg=quantity_kg,
        quality_grade=quality_grade,
        market_price_history_map=market_price_history_map
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
            composite_score=item["composite_score"]
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
        data_disclaimer="AI-assisted estimate based on prototype market data."
    )
