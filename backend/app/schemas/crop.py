from pydantic import BaseModel, ConfigDict

class CropResponse(BaseModel):
    id: int
    name: str
    unit: str

    model_config = ConfigDict(from_attributes=True)
