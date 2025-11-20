"""
Pydantic models for blockchain data structures
These models match the TypeScript types in the frontend
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


# Address response from blockchain.info API
class TransactionOutput(BaseModel):
    """Transaction output"""
    type: int
    spent: bool
    value: int  # Value in satoshis
    spending_outpoints: Optional[List[dict]] = Field(default=None, alias="spending_outpoints")
    n: int
    tx_index: int
    script: str
    addr: Optional[str] = None  # Destination address


class TransactionInput(BaseModel):
    """Transaction input"""
    sequence: int
    witness: Optional[str] = None
    prev_out: Optional[dict] = None  # Contains addr, value, etc.
    script: Optional[str] = None


class Transaction(BaseModel):
    """Transaction from blockchain.info API"""
    hash: str
    ver: int
    vin_sz: int  # Number of inputs
    vout_sz: int  # Number of outputs
    size: int
    weight: int
    fee: int  # Transaction fee in satoshis
    relayed_by: str
    lock_time: int
    tx_index: int
    double_spend: bool
    time: int  # Unix timestamp
    block_index: Optional[int] = None
    block_height: Optional[int] = None
    inputs: List[TransactionInput]
    out: List[TransactionOutput]
    result: Optional[int] = None  # Balance change for this address


class AddressResponse(BaseModel):
    """Address response from blockchain.info API"""
    hash160: str
    address: str
    n_tx: int  # Total number of transactions
    n_unredeemed: int
    total_received: int  # Total received in satoshis
    total_sent: int  # Total sent in satoshis
    final_balance: int  # Final balance in satoshis
    txs: List[Transaction]


# Graph models for visualization
class GraphNode(BaseModel):
    """Graph node representing a Bitcoin address"""
    id: str  # Bitcoin address
    label: Optional[str] = None
    balance: Optional[int] = None  # Balance in satoshis
    txCount: Optional[int] = None  # Number of transactions


class GraphLink(BaseModel):
    """Graph link representing a transaction between addresses"""
    source: str  # Source address ID
    target: str  # Destination address ID
    value: int  # Transaction amount in satoshis
    txHash: str  # Transaction hash
    timestamp: Optional[int] = None  # Transaction timestamp


class GraphData(BaseModel):
    """Graph data structure for react-force-graph-2d"""
    nodes: List[GraphNode]
    links: List[GraphLink]


class ApiLogEntry(BaseModel):
    """API call log entry"""
    id: str
    timestamp: int
    method: str  # 'GET' or 'POST'
    url: str
    status: Optional[int] = None
    statusText: Optional[str] = None
    error: Optional[str] = None
    duration: Optional[int] = None  # Request duration in ms


# Response models
class GraphDataResponse(BaseModel):
    """Graph data response with metadata"""
    nodes: List[GraphNode]
    links: List[GraphLink]
    metadata: Optional[dict] = None

