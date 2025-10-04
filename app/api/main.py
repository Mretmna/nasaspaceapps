from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import calculation
from . import storage

app = FastAPI()

# Add CORS middleware to allow your Next.js frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Be more restrictive in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers from your other files
app.include_router(calculation.router, tags=["calculations"])
app.include_router(storage.router, tags=["storage"])