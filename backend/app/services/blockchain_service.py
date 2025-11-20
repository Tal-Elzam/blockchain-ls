"""
Blockchain service for processing blockchain data
Handles API calls to blockchain.info and data transformation
"""
import httpx
import asyncio
from typing import List, Dict, Any
from datetime import datetime
from app.models.schemas import (
    AddressResponse,
    Transaction,
    GraphNode,
    GraphLink,
    GraphData,
)
from app.services.rate_limiter import wait_for_rate_limit


BLOCKCHAIN_API_BASE = "https://blockchain.info"
DEFAULT_TIMEOUT = 30.0  # sec


async def fetch_address_details(
    address: str,
    limit: int = 50,
    offset: int = 0,
    timeout: float = DEFAULT_TIMEOUT,
) -> AddressResponse:
    """
    Fetch address details from blockchain.info API
    
    Args:
        address: Bitcoin address to fetch
        limit: Number of transactions to fetch
        offset: Number of transactions to skip
        timeout: Request timeout in seconds
    
    Returns:
        AddressResponse with transactions
    """
    url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit={limit}&offset={offset}"
    
    # Always wait to respect API rate limits (1 request every 10 seconds)
    await wait_for_rate_limit("blockchain_api")
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(url, headers={"Accept": "application/json"})
            
            # If we still get rate limited (429), wait longer before retry
            if response.status_code == 429:
                # Wait additional 10 seconds before retry (API may still be rate limiting)
                await asyncio.sleep(10)
                await wait_for_rate_limit("blockchain_api")  # Wait another 10 seconds
                response = await client.get(url, headers={"Accept": "application/json"})
            
            response.raise_for_status()
            
            data = response.json()
            return AddressResponse(**data)
        except httpx.HTTPStatusError as e:
            # Re-raise with more context
            if e.response.status_code == 429:
                raise httpx.HTTPStatusError(
                    "Rate limited by blockchain.info API. Please wait a few minutes before trying again.",
                    request=e.request,
                    response=e.response,
                )
            elif e.response.status_code == 503:
                raise httpx.HTTPStatusError(
                    "Blockchain.info API is temporarily unavailable. This may be due to rate limiting or maintenance.",
                    request=e.request,
                    response=e.response,
                )
            raise


def convert_transactions_to_graph(
    address: str,
    transactions: List[Transaction],
) -> GraphData:
    """
    Convert blockchain transactions to graph format (nodes and links)
    
    Args:
        address: The central address being investigated
        transactions: List of transaction objects from blockchain.info API
    
    Returns:
        GraphData with nodes and links for graph visualization
    """
    nodes: Dict[str, GraphNode] = {}
    links: List[GraphLink] = []
    
    # Add the central address as a node
    nodes[address] = GraphNode(
        id=address,
        label=f"{address[:8]}...{address[-8:]}",
    )
    
    for tx in transactions:
        tx_hash = tx.hash
        tx_time = tx.time
        
        # INBOUND: Process inputs (money coming FROM other addresses TO our target address)
        for input_item in tx.inputs:
            prev_out = input_item.prev_out
            if not prev_out:
                continue
                
            source_addr = prev_out.get("addr")
            value = prev_out.get("value", 0)
            
            if not source_addr:
                continue
            
            # Check if this transaction sends money TO our target address
            target_address_in_outputs = any(
                output.addr == address for output in tx.out
            )
            
            # Only create link if money goes TO target address
            if target_address_in_outputs:
                # Add source node if it doesn't exist
                if source_addr not in nodes:
                    nodes[source_addr] = GraphNode(
                        id=source_addr,
                        label=f"{source_addr[:8]}...{source_addr[-8:]}",
                    )
                
                # Create INBOUND link: source_addr -> address (target)
                links.append(GraphLink(
                    source=source_addr,
                    target=address,
                    value=value,
                    txHash=tx_hash,
                    timestamp=tx_time,
                ))
        
        # OUTBOUND: Process outputs (money going FROM our target address TO other addresses)
        for output in tx.out:
            dest_addr = output.addr
            value = output.value
            
            if not dest_addr or dest_addr == address:
                continue
            
            # Check if this transaction sends money FROM our target address
            source_address_in_inputs = any(
                inp.prev_out and inp.prev_out.get("addr") == address
                for inp in tx.inputs
            )
            
            # Only create link if money comes FROM target address
            if source_address_in_inputs:
                # Add destination node if it doesn't exist
                if dest_addr not in nodes:
                    nodes[dest_addr] = GraphNode(
                        id=dest_addr,
                        label=f"{dest_addr[:8]}...{dest_addr[-8:]}",
                    )
                
                # Create OUTBOUND link: address (source) -> dest_addr
                links.append(GraphLink(
                    source=address,
                    target=dest_addr,
                    value=value,
                    txHash=tx_hash,
                    timestamp=tx_time,
                ))
    
    return GraphData(
        nodes=list(nodes.values()),
        links=links,
    )


def merge_graph_data(
    existing: GraphData,
    new_data: GraphData,
) -> GraphData:
    """
    Merge two graph data structures, avoiding duplicates
    
    Args:
        existing: Existing graph data
        new_data: New graph data to merge
    
    Returns:
        Merged graph data
    """
    node_map: Dict[str, GraphNode] = {}
    link_map: Dict[str, GraphLink] = {}
    
    # Process existing nodes and links
    for node in existing.nodes:
        node_map[node.id] = node
    
    for link in existing.links:
        key = f"{link.source}-{link.target}-{link.txHash}"
        link_map[key] = link
    
    # Add new nodes (if they don't exist)
    for node in new_data.nodes:
        if node.id not in node_map:
            node_map[node.id] = node
    
    # Add new links (if they don't exist)
    for link in new_data.links:
        key = f"{link.source}-{link.target}-{link.txHash}"
        if key not in link_map:
            link_map[key] = link
    
    return GraphData(
        nodes=list(node_map.values()),
        links=list(link_map.values()),
    )
