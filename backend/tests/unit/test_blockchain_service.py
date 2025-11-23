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


class TestFetchAddressDetails:
    """Tests for fetch_address_details function"""

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_fetch(self, sample_blockchain_api_response):
        """Test successful API call"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock the API response
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        # Call the function
        result = await fetch_address_details(address)
        
        # Verify result
        assert isinstance(result, AddressResponse)
        assert result.address == address
        assert result.n_tx == 5
        assert result.final_balance == 200000000
        assert len(result.txs) == 1

    @pytest.mark.asyncio
    @respx.mock
    async def test_fetch_with_custom_limit_offset(self, sample_blockchain_api_response):
        """Test API call with custom limit and offset"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        limit = 10
        offset = 5
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit={limit}&offset={offset}"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        result = await fetch_address_details(address, limit=limit, offset=offset)
        assert isinstance(result, AddressResponse)

    @pytest.mark.asyncio
    @respx.mock
    async def test_rate_limit_error_429(self):
        """Test handling of 429 rate limit error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock 429 response twice, then success
        respx.get(url).mock(side_effect=[
            httpx.Response(429, text="Too Many Requests"),
            httpx.Response(429, text="Too Many Requests"),
        ])
        
        # Should raise HTTPStatusError after retry
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
        tx = Transaction(
            hash="tx123",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=250,
            weight=1000,
            fee=10000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=123,
            double_spend=False,
            time=1609459200,
            inputs=[
                TransactionInput(
                    sequence=4294967295,
                    prev_out={
                        "addr": source_address,
                        "value": 100000000,
                    },
                    script="script",
                )
            ],
            out=[
                TransactionOutput(
                    type=0,
                    spent=False,
                    value=100000000,
                    n=0,
                    tx_index=123,
                    script="script",
                    addr=target_address,
                )
            ],
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        # Should have 2 nodes: target and source
        assert len(result.nodes) == 2
        node_ids = {node.id for node in result.nodes}
        assert target_address in node_ids
        assert source_address in node_ids
        
        # Should have 1 inbound link: source -> target
        assert len(result.links) == 1
        link = result.links[0]
        assert link.source == source_address
        assert link.target == target_address
        assert link.value == 100000000

    def test_outbound_transaction(self):
        """Test transaction where money goes FROM target address"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        dest_address = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
        
        # Create a transaction where money goes FROM target TO dest
        tx = Transaction(
            hash="tx456",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=250,
            weight=1000,
            fee=10000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=456,
            double_spend=False,
            time=1609459200,
            inputs=[
                TransactionInput(
                    sequence=4294967295,
                    prev_out={
                        "addr": target_address,
                        "value": 50000000,
                    },
                    script="script",
                )
            ],
            out=[
                TransactionOutput(
                    type=0,
                    spent=False,
                    value=50000000,
                    n=0,
                    tx_index=456,
                    script="script",
                    addr=dest_address,
                )
            ],
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        # Should have 2 nodes: target and destination
        assert len(result.nodes) == 2
        node_ids = {node.id for node in result.nodes}
        assert target_address in node_ids
        assert dest_address in node_ids
        
        # Should have 1 outbound link: target -> dest
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
        
        # Inbound transaction
        tx1 = Transaction(
            hash="tx1",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=250,
            weight=1000,
            fee=10000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=1,
            double_spend=False,
            time=1609459200,
            inputs=[
                TransactionInput(
                    sequence=4294967295,
                    prev_out={"addr": addr1, "value": 100000000},
                    script="script",
                )
            ],
            out=[
                TransactionOutput(
                    type=0,
                    spent=False,
                    value=100000000,
                    n=0,
                    tx_index=1,
                    script="script",
                    addr=target_address,
                )
            ],
        )
        
        # Outbound transaction
        tx2 = Transaction(
            hash="tx2",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=250,
            weight=1000,
            fee=10000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=2,
            double_spend=False,
            time=1609459300,
            inputs=[
                TransactionInput(
                    sequence=4294967295,
                    prev_out={"addr": target_address, "value": 50000000},
                    script="script",
                )
            ],
            out=[
                TransactionOutput(
                    type=0,
                    spent=False,
                    value=50000000,
                    n=0,
                    tx_index=2,
                    script="script",
                    addr=addr2,
                )
            ],
        )
        
        result = convert_transactions_to_graph(target_address, [tx1, tx2])
        
        # Should have 3 nodes: target, addr1, addr2
        assert len(result.nodes) == 3
        
        # Should have 2 links
        assert len(result.links) == 2

    def test_transaction_without_address(self):
        """Test handling transactions without addresses"""
        target_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        
        tx = Transaction(
            hash="tx789",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=250,
            weight=1000,
            fee=10000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=789,
            double_spend=False,
            time=1609459200,
            inputs=[
                TransactionInput(
                    sequence=4294967295,
                    prev_out=None,  # No prev_out (coinbase)
                    script="script",
                )
            ],
            out=[
                TransactionOutput(
                    type=0,
                    spent=False,
                    value=50000000,
                    n=0,
                    tx_index=789,
                    script="script",
                    addr=None,  # No address
                )
            ],
        )
        
        result = convert_transactions_to_graph(target_address, [tx])
        
        # Should only have the target node, no links
        assert len(result.nodes) == 1
        assert result.nodes[0].id == target_address
        assert len(result.links) == 0

