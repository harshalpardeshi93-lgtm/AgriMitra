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
    db: Session = Depends(get_db)
):
    advisor_res = get_ai_advisor_recommendation(
        db,
        crop_id=crop_id,
        quantity_kg=quantity_kg,
        quality_grade=quality_grade
    )
    if not advisor_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID '{crop_id}' not found for recommendation."
        )
    return advisor_res
