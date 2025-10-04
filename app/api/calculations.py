from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Coords(BaseModel):
    lat: float
    lon: float

@router.post("/calculate")
async def calculate_endpoint(coords: Coords):
    # Your calculation logic here
    try:
        division = coords.lon / coords.lat
    except ZeroDivisionError:
        division = "Latitude is zero"
        
    return {
        "division": division,
        "status": "Calculated successfully"
    }