"""
Blockchain Investigator Backend API
FastAPI server for fetching and processing blockchain data
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import blockchain
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Blockchain Investigator API",
    description="API for investigating Bitcoin blockchain transactions",
    version="1.0.0",
)

# CORS middleware configuration
# Allow requests from Next.js frontend (default port 3000)
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add custom origins from environment if provided
if custom_origins := os.getenv("CORS_ORIGINS"):
    cors_origins.extend(custom_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(blockchain.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Blockchain Investigator API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
    )

