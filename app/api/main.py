from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import storage
import calculations
from mangum import Mangum

# Load .env locally
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY", "deneyprojeciddidegilcokonemli")

class Coordinates(BaseModel):
    lat: float
    lon: float

@app.post("/api/calculate/")
async def calculate(coords: Coordinates, x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    
    storage.lat = coords.lat
    storage.lon = coords.lon
    
    return {
        "received": {"latitude": coords.lat, "longitude": coords.lon},
        "calculations": {
            "division": calculations.divide_coordinates(storage.lat, storage.lon)
        }
    }

# Vercel serverless handler
handler = Mangum(app)
