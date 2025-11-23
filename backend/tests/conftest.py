"""
Shared fixtures for all tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import (
    AddressResponse,
    Transaction,
    TransactionInput,
    TransactionOutput,
    GraphNode,
    GraphLink,
    GraphData,
)
from app.services import rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter state before each test"""
    rate_limiter.request_times.clear()
    rate_limiter.last_request_time.clear()
    yield
    rate_limiter.request_times.clear()
    rate_limiter.last_request_time.clear()


@pytest.fixture
def test_client():
    """FastAPI test client fixture"""
    return TestClient(app)


@pytest.fixture
def mock_transaction_output():
    """Mock transaction output data"""
    return TransactionOutput(
        type=0,
        spent=False,
        value=100000000,  # 1 BTC in satoshis
        n=0,
        tx_index=123456,
        script="76a914...",
        addr="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    )


@pytest.fixture
def mock_transaction_input():
    """Mock transaction input data"""
    return TransactionInput(
        sequence=4294967295,
        prev_out={
            "addr": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
            "value": 50000000,
            "script": "76a914...",
        },
        script="47304402...",
    )


@pytest.fixture
def mock_transaction(mock_transaction_input, mock_transaction_output):
    """Mock blockchain transaction"""
    return Transaction(
        hash="abc123def456",
        ver=1,
        vin_sz=1,
        vout_sz=1,
        size=250,
        weight=1000,
        fee=10000,
        relayed_by="0.0.0.0",
        lock_time=0,
        tx_index=123456,
        double_spend=False,
        time=1609459200,  # 2021-01-01
        block_index=670000,
        block_height=670000,
        inputs=[mock_transaction_input],
        out=[mock_transaction_output],
        result=50000000,
    )


@pytest.fixture
def mock_address_data(mock_transaction):
    """Mock address response from blockchain.info API"""
    return AddressResponse(
        hash160="62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
        address="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        n_tx=5,
        n_unredeemed=2,
        total_received=500000000,
        total_sent=300000000,
        final_balance=200000000,
        txs=[mock_transaction],
    )


@pytest.fixture
def mock_graph_node():
    """Mock graph node"""
    return GraphNode(
        id="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        label="1A1zP1eP...DivfNa",
        balance=200000000,
        txCount=5,
    )


@pytest.fixture
def mock_graph_link():
    """Mock graph link"""
    return GraphLink(
        source="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        target="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        value=100000000,
        txHash="abc123def456",
        timestamp=1609459200,
    )


@pytest.fixture
def mock_graph_data(mock_graph_node, mock_graph_link):
    """Mock graph data"""
    return GraphData(
        nodes=[
            mock_graph_node,
            GraphNode(
                id="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                label="1BvBMSEY...4GFg7xJa",
            ),
        ],
        links=[mock_graph_link],
    )


@pytest.fixture
def sample_blockchain_api_response():
    """Sample raw response from blockchain.info API"""
    return {
        "hash160": "62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
        "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "n_tx": 5,
        "n_unredeemed": 2,
        "total_received": 500000000,
        "total_sent": 300000000,
        "final_balance": 200000000,
        "txs": [
            {
                "hash": "abc123def456",
                "ver": 1,
                "vin_sz": 1,
                "vout_sz": 1,
                "size": 250,
                "weight": 1000,
                "fee": 10000,
                "relayed_by": "0.0.0.0",
                "lock_time": 0,
                "tx_index": 123456,
                "double_spend": False,
                "time": 1609459200,
                "block_index": 670000,
                "block_height": 670000,
                "inputs": [
                    {
                        "sequence": 4294967295,
                        "prev_out": {
                            "addr": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                            "value": 50000000,
                            "script": "76a914...",
                        },
                        "script": "47304402...",
                    }
                ],
                "out": [
                    {
                        "type": 0,
                        "spent": False,
                        "value": 100000000,
                        "n": 0,
                        "tx_index": 123456,
                        "script": "76a914...",
                        "addr": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                    }
                ],
                "result": 50000000,
            }
        ],
    }


@pytest.fixture
def inbound_transaction_response():
    """Sample response with inbound transaction to a target address"""
    target_addr = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    source_addr = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
    
    return {
        "hash160": "62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
        "address": target_addr,
        "n_tx": 1,
        "n_unredeemed": 1,
        "total_received": 100000000,
        "total_sent": 0,
        "final_balance": 100000000,
        "txs": [
            {
                "hash": "tx123",
                "ver": 1,
                "vin_sz": 1,
                "vout_sz": 1,
                "size": 250,
                "weight": 1000,
                "fee": 10000,
                "relayed_by": "0.0.0.0",
                "lock_time": 0,
                "tx_index": 123,
                "double_spend": False,
                "time": 1609459200,
                "inputs": [
                    {
                        "sequence": 4294967295,
                        "prev_out": {
                            "addr": source_addr,
                            "value": 100000000,
                        },
                        "script": "script",
                    }
                ],
                "out": [
                    {
                        "type": 0,
                        "spent": False,
                        "value": 100000000,
                        "n": 0,
                        "tx_index": 123,
                        "script": "script",
                        "addr": target_addr,
                    }
                ],
            }
        ],
    }