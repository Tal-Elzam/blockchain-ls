"""
Blockchain API routes
"""
import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from app.services.blockchain_service import (
    fetch_address_details,
    convert_transactions_to_graph,
)
from app.models.schemas import AddressResponse, GraphData


router = APIRouter(prefix="/api", tags=["blockchain"])


@router.get("/address/{address}", response_model=AddressResponse)
async def get_address_details(
    address: str,
    limit: int = Query(default=50, ge=1, le=100, description="Number of transactions to fetch"),
    offset: int = Query(default=0, ge=0, description="Number of transactions to skip"),
):
    """
    Fetch address details from blockchain.info API
    
    Args:
        address: Bitcoin address to fetch
        limit: Number of transactions to fetch (1-100, default: 50)
        offset: Number of transactions to skip (default: 0)
    
    Returns:
        Address details with transactions
    """
    try:
        print(f"Fetching address details for {address} with limit {limit} and offset {offset}")
        address_data = await fetch_address_details(
            address=address,
            limit=limit,
            offset=offset,
        )
        return address_data
    except httpx.HTTPStatusError as e:
        # Handle rate limiting specifically
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=503,
                detail="Too many requests. Please wait a moment before trying again. The blockchain API has rate limits.",
            )
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Blockchain API error: {e.response.status_code}",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timeout after 30 seconds",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to blockchain API: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}",
        )


@router.get("/address/{address}/graph", response_model=GraphData)
async def get_address_graph(
    address: str,
    limit: int = Query(default=50, ge=1, le=100, description="Number of transactions to fetch"),
    offset: int = Query(default=0, ge=0, description="Number of transactions to skip"),
):
    """
    Fetch address details and convert to graph format
    
    Args:
        address: Bitcoin address to fetch
        limit: Number of transactions to fetch (1-100, default: 50)
        offset: Number of transactions to skip (default: 0)
    
    Returns:
        Graph data structure with nodes and links
    """
    try:
        # Fetch address details
        address_data = await fetch_address_details(
            address=address,
            limit=limit,
            offset=offset,
        )
        
        # Convert to graph format
        graph_data = convert_transactions_to_graph(
            address=address,
            transactions=address_data.txs,
        )
        
        return graph_data
        
    except httpx.HTTPStatusError as e:
        # Handle rate limiting specifically
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=503,
                detail="Too many requests. Please wait a moment before trying again. The blockchain API has rate limits.",
            )
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Blockchain API error: {e.response.status_code}",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timeout after 30 seconds",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to blockchain API: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}",
        )

