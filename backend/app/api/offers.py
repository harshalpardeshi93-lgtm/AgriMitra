from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.offer import BuyerOffer
from app.models.lot import ProduceLot
from app.models.user import User
from app.models.crop import Crop
from app.schemas.buyer import BuyerOfferCreate, BuyerOfferResponse, BuyerOfferStatusUpdate

router = APIRouter()

from app.api.deps import get_current_user, get_current_buyer, get_current_farmer
from app.models.transaction import Transaction

@router.post("/", response_model=BuyerOfferResponse)
def create_offer(
    offer_in: BuyerOfferCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_buyer)
):
    # Check if lot exists
    lot = db.query(ProduceLot).filter(ProduceLot.id == offer_in.lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Produce lot not found")
        
    if offer_in.quantity > lot.quantity_quintals:
        raise HTTPException(status_code=400, detail="Offered quantity cannot exceed available quantity")
        
    new_offer = BuyerOffer(
        lot_id=offer_in.lot_id,
        buyer_id=current_user.id,
        offered_price=offer_in.offered_price,
        quantity=offer_in.quantity,
        message=offer_in.message,
        status="Pending"
    )
    db.add(new_offer)
    
    # Update lot status to Offer Received if it was Available
    if lot.status == "Available":
        lot.status = "Offer Received"

    db.commit()
    db.refresh(new_offer)
    
    return get_offer_with_details(new_offer.id, db)

@router.get("/", response_model=List[BuyerOfferResponse])
def get_offers(
    buyer_id: Optional[int] = Query(None), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_buyer)
):
    # Ignore buyer_id query param and use authenticated user
    results = db.query(BuyerOffer, ProduceLot, User, Crop).join(
        ProduceLot, BuyerOffer.lot_id == ProduceLot.id
    ).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).filter(BuyerOffer.buyer_id == current_user.id).order_by(BuyerOffer.created_at.desc()).all()
    return [map_offer_to_response(offer, lot, farmer, crop) for offer, lot, farmer, crop in results]

@router.get("/seller/{farmer_id}", response_model=List[BuyerOfferResponse])
def get_seller_offers(
    farmer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    if farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view offers for this seller")

    results = db.query(BuyerOffer, ProduceLot, User, Crop).join(
        ProduceLot, BuyerOffer.lot_id == ProduceLot.id
    ).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).filter(ProduceLot.farmer_id == current_user.id).order_by(BuyerOffer.created_at.desc()).all()
    
    return [map_offer_to_response(offer, lot, farmer, crop) for offer, lot, farmer, crop in results]

@router.get("/lot/{lot_id}", response_model=List[BuyerOfferResponse])
def get_lot_offers(
    lot_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    lot = db.query(ProduceLot).filter(ProduceLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Produce lot not found")
    if lot.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view offers for this lot")

    results = db.query(BuyerOffer, ProduceLot, User, Crop).join(
        ProduceLot, BuyerOffer.lot_id == ProduceLot.id
    ).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).filter(BuyerOffer.lot_id == lot_id).order_by(BuyerOffer.created_at.desc()).all()
    return [map_offer_to_response(offer, lot, farmer, crop) for offer, lot, farmer, crop in results]

@router.patch("/{offer_id}/status", response_model=BuyerOfferResponse)
def update_offer_status(
    offer_id: int, 
    status_update: BuyerOfferStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    lot = db.query(ProduceLot).filter(ProduceLot.id == offer.lot_id).first()
    if not lot or lot.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this offer")

    if status_update.status not in ["Accepted", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status option")

    if status_update.status == "Accepted":
        # Atomic CAS for lot
        updated_lot = db.query(ProduceLot).filter(
            ProduceLot.id == offer.lot_id,
            ProduceLot.status.in_(["Available", "Offer Received"])
        ).update({"status": "Sold"}, synchronize_session=False)

        if updated_lot == 0:
            db.rollback()
            raise HTTPException(status_code=409, detail="Produce lot has already been sold or is unavailable.")

    # Atomic CAS for offer
    updated_offer = db.query(BuyerOffer).filter(
        BuyerOffer.id == offer_id,
        BuyerOffer.status == "Pending"
    ).update({"status": status_update.status}, synchronize_session=False)

    if updated_offer == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Offer is no longer pending or already updated.")

    if status_update.status == "Accepted":
        # Check for duplicate transaction
        existing_txn = db.query(Transaction).filter(Transaction.offer_id == offer_id).first()
        if not existing_txn:
            total_amt = offer.quantity * offer.offered_price
            new_txn = Transaction(
                offer_id=offer_id,
                lot_id=offer.lot_id,
                buyer_id=offer.buyer_id,
                farmer_id=lot.farmer_id,
                crop_id=lot.crop_id,
                quantity_quintals=offer.quantity,
                agreed_price_per_quintal=offer.offered_price,
                total_amount=total_amt,
                payment_status="Pending",
                transaction_status="Confirmed"
            )
            db.add(new_txn)

    db.commit()
    # Refresh to pick up updated status from DB
    db.refresh(offer)
    return get_offer_with_details(offer_id, db)


def map_offer_to_response(offer: BuyerOffer, lot: ProduceLot, farmer: User, crop: Crop) -> BuyerOfferResponse:
    return BuyerOfferResponse(
        id=offer.id,
        lot_id=offer.lot_id,
        buyer_id=offer.buyer_id,
        offered_price=offer.offered_price,
        quantity=offer.quantity,
        message=offer.message,
        status=offer.status,
        created_at=offer.created_at,
        farmer_name=farmer.name,
        crop_name=crop.name
    )

def get_offer_with_details(offer_id: int, db: Session) -> BuyerOfferResponse:
    result = db.query(BuyerOffer, ProduceLot, User, Crop).join(
        ProduceLot, BuyerOffer.lot_id == ProduceLot.id
    ).join(
        User, ProduceLot.farmer_id == User.id
    ).join(
        Crop, ProduceLot.crop_id == Crop.id
    ).filter(BuyerOffer.id == offer_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    offer, lot, farmer, crop = result
    return map_offer_to_response(offer, lot, farmer, crop)

