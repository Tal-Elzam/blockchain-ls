"""
Unit tests for Pydantic schemas
"""
import pytest
from pydantic import ValidationError
from app.models.schemas import (
    TransactionOutput,
    TransactionInput,
    Transaction,
    AddressResponse,
    GraphNode,
    GraphLink,
    GraphData,
)


class TestTransactionOutput:
    """Tests for TransactionOutput model"""

    def test_valid_transaction_output(self):
        """Test creating a valid TransactionOutput"""
        output = TransactionOutput(
            type=0,
            spent=False,
            value=100000000,
            n=0,
            tx_index=123456,
            script="76a914...",
            addr="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        )
        assert output.value == 100000000
        assert output.spent is False
        assert output.addr == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"

    def test_transaction_output_without_address(self):
        """Test TransactionOutput without address (optional field)"""
        output = TransactionOutput(
            type=0,
            spent=True,
            value=50000000,
            n=1,
            tx_index=789012,
            script="76a914...",
        )
        assert output.addr is None
        assert output.value == 50000000

    def test_transaction_output_missing_required_fields(self):
        """Test validation error when required fields are missing"""
        with pytest.raises(ValidationError) as exc_info:
            TransactionOutput(
                type=0,
                spent=False,
                # Missing value, n, tx_index, script
            )
        assert "value" in str(exc_info.value)


class TestTransactionInput:
    """Tests for TransactionInput model"""

    def test_valid_transaction_input(self):
        """Test creating a valid TransactionInput"""
        input_data = TransactionInput(
            sequence=4294967295,
            prev_out={
                "addr": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                "value": 50000000,
            },
            script="47304402...",
        )
        assert input_data.sequence == 4294967295
        assert input_data.prev_out["addr"] == "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"

    def test_transaction_input_without_prev_out(self):
        """Test TransactionInput without prev_out (coinbase transaction)"""
        input_data = TransactionInput(
            sequence=4294967295,
            script="03...",
        )
        assert input_data.prev_out is None


class TestTransaction:
    """Tests for Transaction model"""

    def test_valid_transaction(self, mock_transaction):
        """Test creating a valid Transaction"""
        assert mock_transaction.hash == "abc123def456"
        assert mock_transaction.vin_sz == 1
        assert mock_transaction.vout_sz == 1
        assert mock_transaction.fee == 10000
        assert len(mock_transaction.inputs) == 1
        assert len(mock_transaction.out) == 1

    def test_transaction_without_optional_fields(self):
        """Test Transaction without optional fields"""
        tx = Transaction(
            hash="test123",
            ver=1,
            vin_sz=1,
            vout_sz=1,
            size=200,
            weight=800,
            fee=5000,
            relayed_by="0.0.0.0",
            lock_time=0,
            tx_index=999,
            double_spend=False,
            time=1609459200,
            inputs=[],
            out=[],
        )
        assert tx.block_index is None
        assert tx.block_height is None
        assert tx.result is None


class TestAddressResponse:
    """Tests for AddressResponse model"""

    def test_valid_address_response(self, mock_address_data):
        """Test creating a valid AddressResponse"""
        assert mock_address_data.address == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        assert mock_address_data.n_tx == 5
        assert mock_address_data.final_balance == 200000000
        assert len(mock_address_data.txs) == 1

    def test_address_response_calculations(self, mock_address_data):
        """Test balance calculations in AddressResponse"""
        # total_received - total_sent = final_balance
        expected_balance = (
            mock_address_data.total_received - mock_address_data.total_sent
        )
        assert mock_address_data.final_balance == expected_balance

    def test_address_response_missing_required_fields(self):
        """Test validation error when required fields are missing"""
        with pytest.raises(ValidationError) as exc_info:
            AddressResponse(
                address="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                # Missing other required fields
            )
        assert "hash160" in str(exc_info.value)


class TestGraphNode:
    """Tests for GraphNode model"""

    def test_valid_graph_node(self):
        """Test creating a valid GraphNode"""
        node = GraphNode(
            id="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            label="Genesis",
            balance=100000000,
            txCount=10,
        )
        assert node.id == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        assert node.label == "Genesis"
        assert node.balance == 100000000

    def test_graph_node_minimal(self):
        """Test GraphNode with only required fields"""
        node = GraphNode(id="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")
        assert node.id == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        assert node.label is None
        assert node.balance is None


class TestGraphLink:
    """Tests for GraphLink model"""

    def test_valid_graph_link(self, mock_graph_link):
        """Test creating a valid GraphLink"""
        assert mock_graph_link.source == "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
        assert mock_graph_link.target == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        assert mock_graph_link.value == 100000000

    def test_graph_link_without_timestamp(self):
        """Test GraphLink without timestamp (optional field)"""
        link = GraphLink(
            source="addr1",
            target="addr2",
            value=50000000,
            txHash="abc123",
        )
        assert link.timestamp is None
        assert link.value == 50000000


class TestGraphData:
    """Tests for GraphData model"""

    def test_valid_graph_data(self, mock_graph_data):
        """Test creating a valid GraphData"""
        assert len(mock_graph_data.nodes) == 2
        assert len(mock_graph_data.links) == 1

    def test_empty_graph_data(self):
        """Test creating empty GraphData"""
        graph = GraphData(nodes=[], links=[])
        assert len(graph.nodes) == 0
        assert len(graph.links) == 0

    def test_graph_data_with_multiple_nodes_and_links(self):
        """Test GraphData with multiple nodes and links"""
        nodes = [
            GraphNode(id="addr1", label="Address 1"),
            GraphNode(id="addr2", label="Address 2"),
            GraphNode(id="addr3", label="Address 3"),
        ]
        links = [
            GraphLink(source="addr1", target="addr2", value=100, txHash="tx1"),
            GraphLink(source="addr2", target="addr3", value=200, txHash="tx2"),
        ]
        graph = GraphData(nodes=nodes, links=links)
        assert len(graph.nodes) == 3
        assert len(graph.links) == 2

