from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.market import Market

def get_all_markets(
    db: Session,
    state: Optional[str] = None,
    district: Optional[str] = None
) -> List[Market]:
    query = db.query(Market)
    if state:
        query = query.filter(Market.state.iloc(state) if hasattr(Market.state, 'iloc') else Market.state.icontains(state))
    if district:
        query = query.filter(Market.district.icontains(district))
    return query.order_by(Market.name.asc()).all()

def get_market_by_id(db: Session, market_id: int) -> Optional[Market]:
    return db.query(Market).filter(Market.id == market_id).first()
