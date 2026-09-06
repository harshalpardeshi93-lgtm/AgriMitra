from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.crop import CropResponse
from app.services.crop_service import get_all_crops

router = APIRouter()

@router.get("/crops", response_model=List[CropResponse])
def read_crops(db: Session = Depends(get_db)):
    return get_all_crops(db)
