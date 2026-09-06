from pydantic import BaseModel, ConfigDict

class MarketPriceResponse(BaseModel):
    id: int
    market_id: int
    market_name: str
    district: str
    state: str
    crop_id: int
    crop_name: str
    date: str
    min_price: float
    max_price: float
    modal_price: float
    arrival_quantity: float

    model_config = ConfigDict(from_attributes=True)
