from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.crop import Crop

def get_all_crops(db: Session) -> List[Crop]:
    return db.query(Crop).order_by(Crop.name.asc()).all()

def get_crop_by_id(db: Session, crop_id: int) -> Optional[Crop]:
    return db.query(Crop).filter(Crop.id == crop_id).first()
