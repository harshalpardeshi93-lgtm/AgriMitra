from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.advisor import AdvisorResponse
from app.services.advisor_service import get_ai_advisor_recommendation

router = APIRouter()

@router.get("/advisor", response_model=AdvisorResponse)
def read_advisor_recommendation(
    crop_id: int = Query(..., description="Crop ID to evaluate"),
    quantity_kg: float = Query(500.0, ge=1.0, description="Available harvest quantity in kg"),
    quality_grade: str = Query("Grade A", description="Quality grade of crop"),
    storage_available: bool = Query(False, description="Whether farmer has storage available"),
    storage_cost: float = Query(None, description="Cost of storage if available"),
    transport_cost: float = Query(None, description="Cost of transport if available"),
    db: Session = Depends(get_db)
):
    advisor_res = get_ai_advisor_recommendation(
        db,
        crop_id=crop_id,
        quantity_kg=quantity_kg,
        quality_grade=quality_grade,
        storage_available=storage_available,
        storage_cost=storage_cost,
        transport_cost=transport_cost
    )
    if not advisor_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID '{crop_id}' not found for recommendation."
        )
    return advisor_res
