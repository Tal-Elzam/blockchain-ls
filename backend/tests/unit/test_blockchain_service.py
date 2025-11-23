"""
Unit tests for blockchain service
"""
import pytest
import httpx
import respx
from app.services.blockchain_service import (
    fetch_address_details,
    convert_transactions_to_graph,
    BLOCKCHAIN_API_BASE,
)
from app.models.schemas import (
    AddressResponse,
    Transaction,
    TransactionInput,
    TransactionOutput,
    GraphNode,
    GraphLink,
    GraphData,
)
from tests.test_helpers import create_transaction


class TestFetchAddressDetails:
    """Tests for fetch_address_details function"""

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_fetch(self, sample_blockchain_api_response):
        """Test successful API call"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        result = await fetch_address_details(address)
        
        assert isinstance(result, AddressResponse)
        assert result.address == address
        assert result.n_tx == 5
        assert result.final_balance == 200000000
        assert len(result.txs) == 1

    @pytest.mark.asyncio
    @respx.mock
    async def test_rate_limit_error_429(self):
        """Test handling of 429 rate limit error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(side_effect=[
            httpx.Response(429, text="Too Many Requests"),
            httpx.Response(429, text="Too Many Requests"),
        ])
        
        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await fetch_address_details(address, timeout=1.0)
        
        assert exc_info.value.response.status_code == 429

    @pytest.mark.asyncio
    @respx.mock
    async def test_service_unavailable_503(self):
        """Test handling of 503 service unavailable error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(503, text="Service Unavailable")
        )
        
        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await fetch_address_details(address, timeout=1.0)
        
        assert exc_info.value.response.status_code == 503

    @pytest.mark.asyncio
    @respx.mock
    async def test_timeout_error(self):
        """Test handling of timeout error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(side_effect=httpx.TimeoutException("Timeout"))
        
        with pytest.raises(httpx.TimeoutException):
            await fetch_address_details(address, timeout=0.1)

    @pytest.mark.asyncio
    @respx.mock
    async def test_network_error(self):
        """Test handling of network error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            side_effect=httpx.RequestError("Network error")
        )
        
        with pytest.raises(httpx.RequestError):
            await fetch_address_details(address, timeout=1.0)


class TestConvertTransactionsToGraph:
    """Tests for convert_transactions_to_graph function"""

    def test_empty_transactions(self):
        """Test with no transactions"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        result = convert_transactions_to_graph(address, [])
        
        # Should have only the central address node
        assert len(result.nodes) == 1
        assert result.nodes[0].id == address
        assert len(result.links) == 0

    def test_inbound_transaction(self):
        """Test transaction where money comes TO target address"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        source_address = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
        
        # Create a transaction where money goes FROM source TO target
        tx = create_transaction(
            input_addr=source_address,
            output_addr=target_address,
            value=100000000
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        assert len(result.nodes) == 2
        node_ids = {node.id for node in result.nodes}
        assert target_address in node_ids
        assert source_address in node_ids
        
        assert len(result.links) == 1
        link = result.links[0]
        assert link.source == source_address
        assert link.target == target_address
        assert link.value == 100000000

    def test_outbound_transaction(self):
        """Test transaction where money goes FROM target address"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        dest_address = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
        
        tx = create_transaction(
            tx_hash="tx456",
            input_addr=target_address,
            output_addr=dest_address,
            value=50000000,
            tx_index=456
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        assert len(result.nodes) == 2
        node_ids = {node.id for node in result.nodes}
        assert target_address in node_ids
        assert dest_address in node_ids
        
        assert len(result.links) == 1
        link = result.links[0]
        assert link.source == target_address
        assert link.target == dest_address
        assert link.value == 50000000

    def test_multiple_transactions(self):
        """Test with multiple transactions"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        addr1 = "1BvBMSEY1"
        addr2 = "1BvBMSEY2"
        
        # Inbound 
        tx1 = create_transaction(
            tx_hash="tx1",
            input_addr=addr1,
            output_addr=target_address,
            value=100000000,
            tx_index=1
        )
        
        # Outbound 
        tx2 = create_transaction(
            tx_hash="tx2",
            input_addr=target_address,
            output_addr=addr2,
            value=50000000,
            timestamp=1609459300,
            tx_index=2
        )
        
        result = convert_transactions_to_graph(target_address, [tx1, tx2])
        
        assert len(result.nodes) == 3
        
        assert len(result.links) == 2

    def test_transaction_without_address(self):
        """Test handling transactions without addresses"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        
        # Create transaction with no input address (coinbase) and no output address
        tx = create_transaction(
            tx_hash="tx789",
            input_addr=None,  
            output_addr=None,  
            value=50000000,
            tx_index=789
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        assert len(result.nodes) == 1
        assert result.nodes[0].id == target_address
        assert len(result.links) == 0

