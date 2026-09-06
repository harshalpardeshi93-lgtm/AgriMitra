from typing import Optional
from pydantic import BaseModel, ConfigDict

class MarketResponse(BaseModel):
    id: int
    name: str
    district: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
