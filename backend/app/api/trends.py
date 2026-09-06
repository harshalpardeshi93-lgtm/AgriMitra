from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.trend import TrendResponse
from app.services.trend_service import get_crop_market_trend

router = APIRouter()

@router.get("/trends", response_model=TrendResponse)
def read_trends(
    crop_id: int = Query(..., description="Crop ID to analyze trend for"),
    market_id: int = Query(..., description="Market ID to analyze trend for"),
    days: int = Query(14, ge=2, le=90, description="Historical window days"),
    db: Session = Depends(get_db)
):
    trend_res = get_crop_market_trend(db, crop_id=crop_id, market_id=market_id, days=days)
    if not trend_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No price trend data found for crop ID '{crop_id}' and market ID '{market_id}'."
        )
    return trend_res
