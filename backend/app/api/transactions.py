from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database.session import get_db
from app.models.transaction import Transaction
from app.models.offer import BuyerOffer
from app.models.lot import ProduceLot
from app.models.user import User
from app.models.crop import Crop
from app.models.market import Market
from sqlalchemy.orm import aliased
from app.schemas.transaction import (
    TransactionCreate, PaymentStatusUpdate, TransactionStatusUpdate, TransactionResponse
)

router = APIRouter()

ALLOWED_PAYMENT_STATUSES = {"Pending", "Processing", "Paid"}
ALLOWED_TRANSACTION_STATUSES = {"Confirmed", "In Progress", "Completed", "Cancelled"}

def map_transaction_to_response(txn: Transaction, buyer: User, farmer: User, crop: Crop, lot: ProduceLot, market: Market) -> TransactionResponse:
    return TransactionResponse(
        id=txn.id,
        offer_id=txn.offer_id,
        lot_id=txn.lot_id,
        buyer_id=txn.buyer_id,
        farmer_id=txn.farmer_id,
        crop_id=txn.crop_id,
        quantity_quintals=txn.quantity_quintals,
        agreed_price_per_quintal=txn.agreed_price_per_quintal,
        total_amount=txn.total_amount,
        payment_status=txn.payment_status,
        transaction_status=txn.transaction_status,
        created_at=txn.created_at,
        updated_at=txn.updated_at or txn.created_at,
        buyer_name=buyer.name if buyer else "Buyer",
        farmer_name=farmer.name if farmer else "Farmer / FPO",
        crop_name=crop.name if crop else "Crop",
        quality_grade=lot.quality_grade if lot else "Standard",
        market_name=market.name if market else "Local APMC"
    )

def get_transaction_details(txn_id: int, db: Session) -> TransactionResponse:
    BuyerUser = aliased(User)
    FarmerUser = aliased(User)
    result = db.query(Transaction, BuyerUser, FarmerUser, Crop, ProduceLot, Market).outerjoin(
        BuyerUser, Transaction.buyer_id == BuyerUser.id
    ).outerjoin(
        FarmerUser, Transaction.farmer_id == FarmerUser.id
    ).outerjoin(
        Crop, Transaction.crop_id == Crop.id
    ).outerjoin(
        ProduceLot, Transaction.lot_id == ProduceLot.id
    ).outerjoin(
        Market, ProduceLot.market_id == Market.id
    ).filter(Transaction.id == txn_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    txn, buyer, farmer, crop, lot, market = result
    return map_transaction_to_response(txn, buyer, farmer, crop, lot, market)


from app.api.deps import get_current_user, get_current_farmer, get_current_buyer

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    txn_in: TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    # Check if offer exists
    offer = db.query(BuyerOffer).filter(BuyerOffer.id == txn_in.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Buyer offer not found")

    # Check for duplicate transaction
    existing = db.query(Transaction).filter(Transaction.offer_id == offer.id).first()
    if existing:
        return get_transaction_details(existing.id, db)

    lot = db.query(ProduceLot).filter(ProduceLot.id == offer.lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Produce lot not found")
        
    if lot.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the farmer who owns the lot can create a transaction from an offer")

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
        BuyerOffer.id == offer.id,
        BuyerOffer.status == "Pending"
    ).update({"status": "Accepted"}, synchronize_session=False)

    if updated_offer == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Offer is no longer pending or already accepted.")

    total_amt = offer.quantity * offer.offered_price

    new_txn = Transaction(
        offer_id=offer.id,
        lot_id=lot.id,
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
    db.refresh(new_txn)

    return get_transaction_details(new_txn.id, db)

@router.get("/farmer/{farmer_id}", response_model=List[TransactionResponse])
def get_farmer_transactions(
    farmer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    if farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view transactions for this seller")

    BuyerUser = aliased(User)
    FarmerUser = aliased(User)
    results = db.query(Transaction, BuyerUser, FarmerUser, Crop, ProduceLot, Market).outerjoin(
        BuyerUser, Transaction.buyer_id == BuyerUser.id
    ).outerjoin(
        FarmerUser, Transaction.farmer_id == FarmerUser.id
    ).outerjoin(
        Crop, Transaction.crop_id == Crop.id
    ).outerjoin(
        ProduceLot, Transaction.lot_id == ProduceLot.id
    ).outerjoin(
        Market, ProduceLot.market_id == Market.id
    ).filter(Transaction.farmer_id == current_user.id).order_by(Transaction.created_at.desc()).all()
    
    return [map_transaction_to_response(txn, buyer, farmer, crop, lot, market) for txn, buyer, farmer, crop, lot, market in results]

@router.get("/buyer/{buyer_id}", response_model=List[TransactionResponse])
def get_buyer_transactions(
    buyer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_buyer)
):
    if buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view transactions for this buyer")

    BuyerUser = aliased(User)
    FarmerUser = aliased(User)
    results = db.query(Transaction, BuyerUser, FarmerUser, Crop, ProduceLot, Market).outerjoin(
        BuyerUser, Transaction.buyer_id == BuyerUser.id
    ).outerjoin(
        FarmerUser, Transaction.farmer_id == FarmerUser.id
    ).outerjoin(
        Crop, Transaction.crop_id == Crop.id
    ).outerjoin(
        ProduceLot, Transaction.lot_id == ProduceLot.id
    ).outerjoin(
        Market, ProduceLot.market_id == Market.id
    ).filter(Transaction.buyer_id == current_user.id).order_by(Transaction.created_at.desc()).all()
    
    return [map_transaction_to_response(txn, buyer, farmer, crop, lot, market) for txn, buyer, farmer, crop, lot, market in results]

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if txn.farmer_id != current_user.id and txn.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this transaction")

    return get_transaction_details(transaction_id, db)

@router.patch("/{transaction_id}/payment-status", response_model=TransactionResponse)
def update_payment_status(
    transaction_id: int, 
    status_update: PaymentStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_buyer)
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the buyer of this transaction can update its payment status")

    valid_payment_transitions = {
        "Pending": {"Processing", "Paid"},
        "Processing": {"Paid"},
        "Paid": set()
    }

    if status_update.payment_status not in valid_payment_transitions.get(txn.payment_status, set()):
        if status_update.payment_status == txn.payment_status:
            return get_transaction_details(txn.id, db)
        raise HTTPException(
            status_code=409, 
            detail=f"Invalid payment status transition from {txn.payment_status} to {status_update.payment_status}"
        )

    update_data = {
        "payment_status": status_update.payment_status, 
        "updated_at": datetime.datetime.utcnow()
    }
    
    # Automatically set transaction status to Completed when Paid
    if status_update.payment_status == "Paid":
        update_data["transaction_status"] = "Completed"

    updated = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.payment_status == txn.payment_status
    ).update(update_data, synchronize_session=False)

    if updated == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Payment state was modified concurrently")

    db.commit()
    db.refresh(txn)

    return get_transaction_details(txn.id, db)

@router.patch("/{transaction_id}/status", response_model=TransactionResponse)
def update_transaction_status(
    transaction_id: int, 
    status_update: TransactionStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_farmer)
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller of this transaction can update its status")

    valid_txn_transitions = {
        "Confirmed": {"In Progress", "Completed", "Cancelled"},
        "In Progress": {"Completed", "Cancelled"},
        "Completed": set(),
        "Cancelled": set()
    }

    if status_update.transaction_status not in valid_txn_transitions.get(txn.transaction_status, set()):
        if status_update.transaction_status == txn.transaction_status:
            return get_transaction_details(txn.id, db)
        raise HTTPException(
            status_code=409, 
            detail=f"Invalid transaction status transition from {txn.transaction_status} to {status_update.transaction_status}"
        )

    update_data = {
        "transaction_status": status_update.transaction_status, 
        "updated_at": datetime.datetime.utcnow()
    }

    updated = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.transaction_status == txn.transaction_status
    ).update(update_data, synchronize_session=False)

    if updated == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="Transaction state was modified concurrently")

    db.commit()
    db.refresh(txn)

    return get_transaction_details(txn.id, db)
