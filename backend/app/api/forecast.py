from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.forecast import ForecastResponse
from app.services.forecast_service import get_crop_market_forecast

router = APIRouter()

@router.get("/forecast", response_model=ForecastResponse)
def read_forecast(
    crop_id: int = Query(..., description="Crop ID to forecast prices for"),
    market_id: int = Query(..., description="Market ID to forecast prices for"),
    horizon: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    db: Session = Depends(get_db)
):
    forecast_res = get_crop_market_forecast(db, crop_id=crop_id, market_id=market_id, horizon_days=horizon)
    if not forecast_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No forecast model could be initialized for crop ID '{crop_id}' and market ID '{market_id}'."
        )
    return forecast_res
