from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.price import MarketPrice
from app.models.market import Market
from app.models.crop import Crop
from app.schemas.price import MarketPriceResponse

def get_market_prices(
    db: Session,
    crop_id: int,
    state: Optional[str] = None,
    district: Optional[str] = None,
    date: Optional[str] = None
) -> List[MarketPriceResponse]:
    # Query joining MarketPrice, Market, and Crop
    query = (
        db.query(
            MarketPrice.id,
            MarketPrice.market_id,
            Market.name.label("market_name"),
            Market.district,
            Market.state,
            MarketPrice.crop_id,
            Crop.name.label("crop_name"),
            MarketPrice.date,
            MarketPrice.min_price,
            MarketPrice.max_price,
            MarketPrice.modal_price,
            MarketPrice.arrival_quantity
        )
        .join(Market, MarketPrice.market_id == Market.id)
        .join(Crop, MarketPrice.crop_id == Crop.id)
        .filter(MarketPrice.crop_id == crop_id)
    )

    if state:
        query = query.filter(Market.state.icontains(state))
    if district:
        query = query.filter(Market.district.icontains(district))
    if date:
        query = query.filter(MarketPrice.date == date)
    else:
        # If date is not passed, pick the latest date available for this crop
        subquery = (
            db.query(func.max(MarketPrice.date))
            .filter(MarketPrice.crop_id == crop_id)
            .scalar_subquery()
        )
        query = query.filter(MarketPrice.date == subquery)

    results = query.order_by(MarketPrice.modal_price.desc()).all()

    return [
        MarketPriceResponse(
            id=row.id,
            market_id=row.market_id,
            market_name=row.market_name,
            district=row.district,
            state=row.state,
            crop_id=row.crop_id,
            crop_name=row.crop_name,
            date=row.date,
            min_price=row.min_price,
            max_price=row.max_price,
            modal_price=row.modal_price,
            arrival_quantity=row.arrival_quantity
        )
        for row in results
    ]
