from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.price import MarketPriceResponse
from app.services.crop_service import get_crop_by_id
from app.services.price_service import get_market_prices

router = APIRouter()

@router.get("/prices", response_model=List[MarketPriceResponse])
def read_prices(
    crop_id: int = Query(..., description="ID of the crop to query market prices for"),
    state: Optional[str] = Query(None, description="Filter by market state"),
    district: Optional[str] = Query(None, description="Filter by market district"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    # Validate crop existence
    crop = get_crop_by_id(db, crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID '{crop_id}' not found."
        )

    prices = get_market_prices(
        db=db,
        crop_id=crop_id,
        state=state,
        district=district,
        date=date
    )
    return prices
