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

    db_results = query.order_by(MarketPrice.modal_price.desc()).all()

    fallback_responses = [
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
        for row in db_results
    ]

    if not fallback_responses:
        return []

    crop_name = fallback_responses[0].crop_name
    
    from app.services.external_market_service import external_market_service
    live_prices = external_market_service.fetch_live_prices(
        crop_name=crop_name, state=state, district=district
    )

    if not live_prices:
        return fallback_responses

    # Merge live data into fallback data
    merged_responses = []
    # Create a map for quick lookup of live data by market name and district
    live_map = {}
    for lp in live_prices:
        key = f"{lp['market_name'].lower()}_{lp['district'].lower()}_{lp['state'].lower()}"
        live_map[key] = lp

    for fb in fallback_responses:
        key = f"{fb.market_name.lower()}_{fb.district.lower()}_{fb.state.lower()}"
        if key in live_map:
            live = live_map[key]
            fb.min_price = live["min_price"]
            fb.max_price = live["max_price"]
            fb.modal_price = live["modal_price"]
            fb.arrival_quantity = live["arrival_quantity"]
            fb.date = live["date"]
            fb.source_name = live["source_name"]
            fb.fetched_at = live["fetched_at"]
            fb.data_timestamp = live["data_timestamp"]
            fb.freshness = live["freshness"]
        merged_responses.append(fb)

    # Re-sort by modal price desc
    merged_responses.sort(key=lambda x: x.modal_price, reverse=True)
    return merged_responses
