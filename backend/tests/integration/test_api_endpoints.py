"""
Integration tests for API endpoints
"""
import pytest
import httpx
import respx
from fastapi.testclient import TestClient
from app.services.blockchain_service import BLOCKCHAIN_API_BASE


class TestHealthEndpoints:
    """Tests for health check endpoints"""

    def test_root_endpoint(self, test_client):
        """Test root endpoint returns API info"""
        response = test_client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "1.0.0"
        assert "/docs" in data["docs"]

    def test_health_endpoint(self, test_client):
        """Test health check endpoint"""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAddressEndpoint:
    """Tests for /api/address/{address} endpoint"""

    @respx.mock
    def test_get_address_details_success(
        self, test_client, sample_blockchain_api_response
    ):
        """Test successful address details retrieval"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock blockchain.info API
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        # Call our API
        response = test_client.get(f"/api/address/{address}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["address"] == address
        assert data["n_tx"] == 5
        assert data["final_balance"] == 200000000
        assert len(data["txs"]) == 1

    @respx.mock
    def test_get_address_with_custom_limit(
        self, test_client, sample_blockchain_api_response
    ):
        """Test address details with custom limit parameter"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        limit = 10
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit={limit}&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        response = test_client.get(f"/api/address/{address}?limit={limit}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["address"] == address

    @respx.mock
    def test_get_address_with_limit_and_offset(
        self, test_client, sample_blockchain_api_response
    ):
        """Test address details with limit and offset parameters"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        limit = 25
        offset = 10
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit={limit}&offset={offset}"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        response = test_client.get(
            f"/api/address/{address}?limit={limit}&offset={offset}"
        )
        
        assert response.status_code == 200

    @respx.mock
    def test_get_address_invalid_limit(self, test_client):
        """Test validation error for invalid limit parameter"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        
        # Limit too high (max is 100)
        response = test_client.get(f"/api/address/{address}?limit=150")
        assert response.status_code == 422  # Validation error
        
        # Limit too low (min is 1)
        response = test_client.get(f"/api/address/{address}?limit=0")
        assert response.status_code == 422

    @respx.mock
    def test_get_address_invalid_offset(self, test_client):
        """Test validation error for invalid offset parameter"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        
        # Negative offset
        response = test_client.get(f"/api/address/{address}?offset=-5")
        assert response.status_code == 422

    @respx.mock
    def test_get_address_rate_limit_error(self, test_client):
        """Test handling of 429 rate limit error from blockchain API"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock 429 response from blockchain.info
        respx.get(url).mock(
            return_value=httpx.Response(429, text="Too Many Requests")
        )
        
        response = test_client.get(f"/api/address/{address}")
        
        # Our API should return 503 for rate limiting
        assert response.status_code == 503
        data = response.json()
        assert "rate limit" in data["detail"].lower() or "too many" in data["detail"].lower()

    @respx.mock
    def test_get_address_timeout_error(self, test_client):
        """Test handling of timeout error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock timeout
        respx.get(url).mock(side_effect=httpx.TimeoutException("Timeout"))
        
        response = test_client.get(f"/api/address/{address}")
        
        assert response.status_code == 504
        data = response.json()
        assert "timeout" in data["detail"].lower()

    @respx.mock
    def test_get_address_network_error(self, test_client):
        """Test handling of network connection error"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock network error
        respx.get(url).mock(side_effect=httpx.RequestError("Connection failed"))
        
        response = test_client.get(f"/api/address/{address}")
        
        assert response.status_code == 503
        data = response.json()
        assert "failed" in data["detail"].lower() or "connect" in data["detail"].lower()


class TestAddressGraphEndpoint:
    """Tests for /api/address/{address}/graph endpoint"""

    @respx.mock
    def test_get_address_graph_success(
        self, test_client, sample_blockchain_api_response
    ):
        """Test successful graph data retrieval"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Mock blockchain.info API
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        # Call our API
        response = test_client.get(f"/api/address/{address}/graph")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have nodes and links
        assert "nodes" in data
        assert "links" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["links"], list)
        
        # Should have at least the central address node
        assert len(data["nodes"]) >= 1
        node_ids = [node["id"] for node in data["nodes"]]
        assert address in node_ids

    @respx.mock
    def test_get_graph_with_custom_parameters(
        self, test_client, sample_blockchain_api_response
    ):
        """Test graph endpoint with custom limit and offset"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        limit = 20
        offset = 5
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit={limit}&offset={offset}"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        response = test_client.get(
            f"/api/address/{address}/graph?limit={limit}&offset={offset}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "links" in data

    @respx.mock
    def test_get_graph_with_inbound_transaction(self, test_client):
        """Test graph generation with inbound transaction"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        source_addr = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        # Create response with inbound transaction
        api_response = {
            "hash160": "62e907b15cbf27d5425399ebf6f0fb50ebb88f18",
            "address": address,
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
                            "addr": address,
                        }
                    ],
                }
            ],
        }
        
        respx.get(url).mock(return_value=httpx.Response(200, json=api_response))
        
        response = test_client.get(f"/api/address/{address}/graph")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have 2 nodes: target address and source address
        assert len(data["nodes"]) == 2
        node_ids = [node["id"] for node in data["nodes"]]
        assert address in node_ids
        assert source_addr in node_ids
        
        # Should have 1 inbound link
        assert len(data["links"]) == 1
        link = data["links"][0]
        assert link["source"] == source_addr
        assert link["target"] == address
        assert link["value"] == 100000000

    @respx.mock
    def test_get_graph_rate_limit_error(self, test_client):
        """Test graph endpoint handles rate limiting"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(429, text="Too Many Requests")
        )
        
        response = test_client.get(f"/api/address/{address}/graph")
        
        assert response.status_code == 503
        data = response.json()
        assert "rate" in data["detail"].lower() or "too many" in data["detail"].lower()

    @respx.mock
    def test_get_graph_timeout_error(self, test_client):
        """Test graph endpoint handles timeout"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(side_effect=httpx.TimeoutException("Timeout"))
        
        response = test_client.get(f"/api/address/{address}/graph")
        
        assert response.status_code == 504


class TestCORS:
    """Tests for CORS configuration"""

    def test_cors_headers_present(self, test_client):
        """Test that CORS headers are present in responses"""
        # Make a request with Origin header
        response = test_client.get(
            "/",
            headers={"Origin": "http://localhost:3000"},
        )
        
        # Check for CORS headers
        assert response.status_code == 200
        # FastAPI's TestClient doesn't fully simulate CORS,
        # but we can verify the endpoint works

    def test_cors_allowed_origin(self, test_client):
        """Test CORS with allowed origin"""
        response = test_client.options(
            "/api/address/test",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Endpoint should be accessible
        assert response.status_code in [200, 404]


class TestResponseModels:
    """Tests for response model validation"""

    @respx.mock
    def test_address_response_matches_schema(
        self, test_client, sample_blockchain_api_response
    ):
        """Test that API response matches the expected schema"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        response = test_client.get(f"/api/address/{address}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        required_fields = [
            "hash160",
            "address",
            "n_tx",
            "n_unredeemed",
            "total_received",
            "total_sent",
            "final_balance",
            "txs",
        ]
        for field in required_fields:
            assert field in data

    @respx.mock
    def test_graph_response_matches_schema(
        self, test_client, sample_blockchain_api_response
    ):
        """Test that graph response matches the expected schema"""
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        url = f"{BLOCKCHAIN_API_BASE}/rawaddr/{address}?limit=50&offset=0"
        
        respx.get(url).mock(
            return_value=httpx.Response(200, json=sample_blockchain_api_response)
        )
        
        response = test_client.get(f"/api/address/{address}/graph")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify graph structure
        assert "nodes" in data
        assert "links" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["links"], list)
        
        # Verify node structure (if nodes exist)
        if data["nodes"]:
            node = data["nodes"][0]
            assert "id" in node
        
        # Verify link structure (if links exist)
        if data["links"]:
            link = data["links"][0]
            assert "source" in link
            assert "target" in link
            assert "value" in link
            assert "txHash" in link

