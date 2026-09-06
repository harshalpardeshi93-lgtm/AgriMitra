from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.market import MarketResponse
from app.services.market_service import get_all_markets

router = APIRouter()

@router.get("/markets", response_model=List[MarketResponse])
def read_markets(
    state: Optional[str] = Query(None, description="Filter markets by state"),
    district: Optional[str] = Query(None, description="Filter markets by district"),
    db: Session = Depends(get_db)
):
    return get_all_markets(db, state=state, district=district)
