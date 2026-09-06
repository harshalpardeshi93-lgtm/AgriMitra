from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.lot import ProduceLot
from app.models.user import User
from app.models.crop import Crop
from app.models.market import Market
from app.schemas.buyer import ProduceLotResponse, ProduceLotCreate

router = APIRouter()

from app.api.deps import get_current_farmer

@router.post("/", response_model=ProduceLotResponse)
def create_lot(
    lot_in: ProduceLotCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    # Verify crop exists
    crop = db.query(Crop).filter(Crop.id == lot_in.crop_id).first()
    if not crop:
        raise HTTPException(status_code=400, detail="Please select a valid crop.")
        
    # Verify market exists
    market = db.query(Market).filter(Market.id == lot_in.market_id).first()
    if not market:
        raise HTTPException(status_code=400, detail="Please select a valid market / location.")

    new_lot = ProduceLot(
        farmer_id=current_user.id,
        crop_id=lot_in.crop_id,
        market_id=lot_in.market_id,
        quantity_quintals=lot_in.quantity_quintals,
        quality_grade=lot_in.quality_grade,
        expected_price_per_quintal=lot_in.expected_price_per_quintal,
        status=lot_in.status or "Available"
    )
    db.add(new_lot)
    db.commit()
    db.refresh(new_lot)

    return ProduceLotResponse(
        id=new_lot.id,
        farmer_id=new_lot.farmer_id,
        crop_id=new_lot.crop_id,
        market_id=new_lot.market_id,
        quantity_quintals=new_lot.quantity_quintals,
        quality_grade=new_lot.quality_grade,
        expected_price_per_quintal=new_lot.expected_price_per_quintal,
        status=new_lot.status,
        created_at=new_lot.created_at,
        farmer_name=current_user.name,
        crop_name=crop.name,
        market_name=market.name,
        district=market.district,
        state=market.state
    )

from app.api.deps import get_current_user, get_current_farmer

@router.get("/", response_model=List[ProduceLotResponse])
def get_lots(
    crop_id: Optional[int] = None,
    market_id: Optional[int] = None,
    quality_grade: Optional[str] = None,
    farmer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProduceLot, User, Crop, Market).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).join(
        Market, ProduceLot.market_id == Market.id
    )

    if farmer_id:
        query = query.filter(ProduceLot.farmer_id == farmer_id)
        if status:
            query = query.filter(ProduceLot.status == status)
    else:
        if status:
            query = query.filter(ProduceLot.status == status)
        else:
            query = query.filter(ProduceLot.status.in_(["Available", "Offer Received"]))

    if crop_id:
        query = query.filter(ProduceLot.crop_id == crop_id)
    if market_id:
        query = query.filter(ProduceLot.market_id == market_id)
    if quality_grade and quality_grade != "Any Quality":
        query = query.filter(ProduceLot.quality_grade == quality_grade)
        
    results = query.order_by(ProduceLot.created_at.desc()).all()
    
    response_list = []
    for lot, user, crop, market in results:
        lot_dict = {
            "id": lot.id,
            "farmer_id": lot.farmer_id,
            "crop_id": lot.crop_id,
            "market_id": lot.market_id,
            "quantity_quintals": lot.quantity_quintals,
            "quality_grade": lot.quality_grade,
            "expected_price_per_quintal": lot.expected_price_per_quintal,
            "status": lot.status,
            "created_at": lot.created_at,
            "farmer_name": user.name,
            "crop_name": crop.name,
            "market_name": market.name,
            "district": market.district,
            "state": market.state
        }
        response_list.append(ProduceLotResponse(**lot_dict))
        
    return response_list

@router.get("/{lot_id}", response_model=ProduceLotResponse)
def get_lot(
    lot_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(ProduceLot, User, Crop, Market).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).join(
        Market, ProduceLot.market_id == Market.id
    ).filter(ProduceLot.id == lot_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    lot, user, crop, market = result
    
    return ProduceLotResponse(
        id=lot.id,
        farmer_id=lot.farmer_id,
        crop_id=lot.crop_id,
        market_id=lot.market_id,
        quantity_quintals=lot.quantity_quintals,
        quality_grade=lot.quality_grade,
        expected_price_per_quintal=lot.expected_price_per_quintal,
        status=lot.status,
        created_at=lot.created_at,
        farmer_name=user.name,
        crop_name=crop.name,
        market_name=market.name,
        district=market.district,
        state=market.state
    )

