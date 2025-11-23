# Blockchain Investigator - Python Backend

FastAPI-based backend API for processing blockchain data.

## Installation

1. Ensure you have Python 3.11+ installed

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file from the example:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

## Running the Server

Start the server:
```bash
python run.py
```

Or run with uvicorn directly:
```bash
uvicorn app.main:app --reload --port 8000
```

The server will be available at `http://localhost:8000`

Auto-generated API documentation is available at `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   └── routes/
│   │       └── blockchain.py  # Blockchain API endpoints
│   ├── services/
│   │   ├── blockchain_service.py  # Business logic
│   │   └── rate_limiter.py       # Rate limiting service
│   └── models/
│       └── schemas.py       # Pydantic models
├── tests/
│   ├── conftest.py         # Pytest fixtures
│   ├── unit/               # Unit tests
│   │   ├── test_blockchain_service.py
│   │   ├── test_rate_limiter.py
│   │   └── test_schemas.py
│   └── integration/        # Integration tests
│       └── test_api_endpoints.py
├── requirements.txt
├── pytest.ini
├── .env.example
└── README.md
```

## API Endpoints

### GET `/`
Health check endpoint

**Response:**
```json
{
  "message": "Blockchain Investigator API is running",
  "version": "1.0.0",
  "docs": "/docs"
}
```

### GET `/health`
Health check endpoint for monitoring

**Response:**
```json
{
  "status": "healthy"
}
```

### GET `/api/address/{address}`
Fetch details for a Bitcoin address

**Parameters:**
- `address`: Bitcoin address (required)
- `limit`: Number of transactions to fetch (1-100, default: 50)
- `offset`: Number of transactions to skip (default: 0)

**Example:**
```
GET /api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=50&offset=0
```

**Response:**
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "n_tx": 5,
  "total_received": 500000000,
  "total_sent": 300000000,
  "final_balance": 200000000,
  "txs": [...]
}
```

### GET `/api/address/{address}/graph`
Fetch address details and convert to graph format

**Parameters:**
- `address`: Bitcoin address (required)
- `limit`: Number of transactions to fetch (1-100, default: 50)
- `offset`: Number of transactions to skip (default: 0)

**Example:**
```
GET /api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/graph?limit=50&offset=0
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "label": "1A1zP1e...7DivfNa",
      "balance": 200000000,
      "txCount": 5
    }
  ],
  "links": [
    {
      "source": "source_address",
      "target": "target_address",
      "value": 1000000,
      "txHash": "transaction_hash",
      "timestamp": 1234567890
    }
  ]
}
```

## Environment Variables

Create a `.env` file from the example (`.env.example`) and configure:

- `HOST`: Server host address (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `BLOCKCHAIN_API_BASE`: Base URL for blockchain.info API (default: https://blockchain.info)
- `DEFAULT_TIMEOUT`: Default timeout in seconds (default: 30)

**Example `.env` file:**
```env
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Testing

Run all tests:
```bash
pytest
```

Run tests with coverage:
```bash
pytest --cov=app --cov-report=html --cov-report=term
```

Run specific test suites:
```bash
# Unit tests only
pytest tests/unit/

# Integration tests only
pytest tests/integration/

# Specific test file
pytest tests/unit/test_blockchain_service.py
```

View coverage report:
```bash
# Open in browser
open htmlcov/index.html  # Mac
start htmlcov/index.html # Windows
```

**Test Coverage:**
- 99+ tests across 6 test suites
- 60%+ code coverage
- Unit tests for services, utilities, and models
- Integration tests for API endpoints
- Mock external API calls with respx

## Rate Limiting

The backend implements intelligent rate limiting to respect blockchain.info API constraints:

- **Minimum delay**: 10 seconds between requests
- **Maximum requests**: 6 per minute
- **Automatic retry**: On 429 (rate limit) errors
- **Smart queuing**: Requests are queued and processed sequentially

The rate limiter is implemented in `app/services/rate_limiter.py` and automatically applied to all blockchain API calls.

## Development

The server runs with auto-reload enabled, so any code changes will automatically reload the server.

### Code Quality Tools

Type checking:
```bash
mypy app/
```

Linting:
```bash
flake8 app/
```

Code formatting:
```bash
black app/
```

## Error Handling

The API implements comprehensive error handling:

- **400**: Bad Request - Invalid parameters
- **404**: Not Found - Address not found
- **422**: Validation Error - Invalid input data
- **429**: Too Many Requests - Rate limit exceeded (returns 503)
- **500**: Internal Server Error - Unexpected errors
- **503**: Service Unavailable - External API unavailable or rate limited
- **504**: Gateway Timeout - Request timeout (30s)

All errors return a JSON response with a `detail` field explaining the error.

## API Documentation

Interactive API documentation is automatically generated and available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interactive docs allow you to:
- View all endpoints and their parameters
- Test API calls directly from the browser
- See request/response schemas
- View example requests and responses

## Notes

- The server uses FastAPI with async/await for optimal performance
- CORS is configured by default for localhost:3000 (Next.js frontend)
- All endpoints return JSON responses
- Errors return appropriate HTTP status codes
- Rate limiting is automatically applied to all blockchain.info API calls
- Pydantic models ensure data validation and type safety
- Full test coverage with pytest and pytest-asyncio

## Dependencies

Main dependencies:
- **FastAPI 0.115** - Modern web framework
- **Uvicorn** - ASGI server
- **httpx** - Async HTTP client
- **Pydantic 2.9** - Data validation
- **python-dotenv** - Environment variable management

Testing dependencies:
- **pytest 8.3** - Testing framework
- **pytest-asyncio** - Async test support
- **pytest-cov** - Coverage reporting
- **respx** - HTTP mocking

See `requirements.txt` for complete list of dependencies.
