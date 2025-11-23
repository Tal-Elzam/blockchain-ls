# 🔗 Blockchain Investigator

A powerful full-stack application for investigating Bitcoin blockchain transactions with interactive graph visualization.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Next.js Frontend (Port 3000)                  │  │
│  │                                                                    │  │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │  │
│  │  │  React         │  │  Graph           │  │  Address        │  │  │
│  │  │  Components    │  │  Visualization   │  │  Details Panel  │  │  │
│  │  │  (TypeScript)  │  │  (D3-Force +     │  │                 │  │  │
│  │  │                │  │   ReactFlow)     │  │                 │  │  │
│  │  └────────┬───────┘  └────────┬─────────┘  └────────┬────────┘  │  │
│  │           │                   │                      │           │  │
│  │           └───────────────────┴──────────────────────┘           │  │
│  │                              │                                    │  │
│  │                    ┌─────────▼──────────┐                        │  │
│  │                    │  Backend Client    │                        │  │
│  │                    │  (API Service)     │                        │  │
│  │                    └─────────┬──────────┘                        │  │
│  └──────────────────────────────┼─────────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                        HTTP/JSON │ (REST API)
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                   FastAPI Backend (Port 8000)                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      API Routes                               │   │
│  │  /api/address/{address}        - Get address details         │   │
│  │  /api/address/{address}/graph  - Get transaction graph       │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                 │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │              Blockchain Service                               │   │
│  │  • fetch_address_details()  - Fetch from blockchain.info     │   │
│  │  • convert_transactions_to_graph()  - Transform data         │   │
│  │  • merge_graph_data()  - Merge multiple graph structures     │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │                                                 │
│  ┌──────────────────▼───────────────────────────────────────────┐   │
│  │              Rate Limiter                                     │   │
│  │  • wait_for_rate_limit()  - Enforce 10s delay               │   │
│  │  • Max 6 requests/minute  - Respect API limits              │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
└────────────────────┼──────────────────────────────────────────────┘
                     │
           HTTP/JSON │ (External API)
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│               Blockchain.info Public API                             │
│                                                                       │
│  • GET /rawaddr/{address}  - Address transaction data               │
│  • Rate Limit: 1 request per 10 seconds                             │
│  • Returns: Address balance, transactions, inputs/outputs           │
└──────────────────────────────────────────────────────────────────────┘
```

## Features

### Frontend (Next.js + React)

- **Interactive Graph Visualization** - D3-Force physics simulation with ReactFlow
- **Real-time Transaction Tracking** - Live updates of blockchain transactions
- **Address Details Panel** - Comprehensive view of wallet information
- **API Call Logging** - Monitor all backend requests in real-time
- **Responsive Design** - Modern UI with Tailwind CSS
- **Error Boundaries** - Graceful error handling and recovery
- **Type Safety** - Full TypeScript coverage

### Backend (Python + FastAPI)

- **RESTful API** - Clean, documented endpoints
- **Rate Limiting** - Intelligent request throttling (10s between requests)
- **Data Transformation** - Convert blockchain data to graph format
- **Error Handling** - Comprehensive error catching and reporting
- **CORS Support** - Secure cross-origin requests
- **Async Operations** - Non-blocking I/O for better performance

### Testing

- **Frontend**: Vitest + Testing Library (60 tests, 83%+ coverage)
- **Backend**: Pytest + Pytest-asyncio (41 tests, 54% coverage)
- **Unit Tests**: Services, utilities, and helpers
- **Integration Tests**: API endpoints and components
- **Component Tests**: React components with mocking

## Quick Start

### Prerequisites

- **Node.js** >= 24.x
- **Python** >= 3.11
- **pnpm** 10.x (or npm/yarn)
- **pip** (Python package manager)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd blockchain-ls
```

#### 2. Setup Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Setup Frontend

```bash
# From project root
pnpm install
```

#### 4. Configure Environment Variables

**Frontend** (`.env.local` in root):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Backend** (`backend/.env`):

```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000
```

### Running the Application

#### Start Backend Server

```bash
cd backend
python run.py
# Server running at http://localhost:8000
# API docs at http://localhost:8000/docs
```

#### Start Frontend Server

```bash
# From project root
pnpm dev
# App running at http://localhost:3000
```

## 🧪 Testing

### Frontend Tests

```bash
# Run all tests
pnpm test

# Run with UI (recommended)
pnpm test:ui

# Run with coverage
pnpm test:coverage

# View coverage report
open coverage/index.html
```

**Test Coverage:**

- Unit tests for utility functions
- Service layer tests with mocking
- Component tests with React Testing Library
- 60 tests across 6 test suites

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_blockchain_service.py

# View coverage report
open htmlcov/index.html
```

**Test Coverage:**

- Unit tests for services and utilities
- Integration tests for API endpoints
- Mock external API calls with respx
- 41 tests across 4 test suites

## API Documentation

### Endpoints

#### GET `/`

Health check endpoint.

**Response:**

```json
{
  "docs": "/docs",
  "message": "Blockchain Investigator API is running",
  "version": "1.0.0"
}
```

#### GET `/health`

Health status endpoint.

**Response:**

```json
{
  "status": "healthy"
}
```

#### GET `/api/address/{address}`

Fetch detailed information about a Bitcoin address.

**Parameters:**

- `address` (path) - Bitcoin address
- `limit` (query, optional) - Number of transactions (1-100, default: 50)
- `offset` (query, optional) - Number of transactions to skip (default: 0)

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

#### GET `/api/address/{address}/graph`

Get transaction graph data for visualization.

**Parameters:**

- `address` (path) - Bitcoin address
- `limit` (query, optional) - Number of transactions (1-100, default: 50)
- `offset` (query, optional) - Number of transactions to skip (default: 0)

**Response:**

```json
{
  "links": [
    {
      "source": "addr1",
      "target": "addr2",
      "value": 100000000,
      "txHash": "abc123...",
      "timestamp": 1609459200
    }
  ],
  "nodes": [
    {
      "id": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "label": "1A1zP1eP...DivfNa",
      "balance": 200000000,
      "txCount": 5
    }
  ]
}
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

## Project Structure

```
blockchain-ls/
├── src/                          # Frontend source code
│   ├── __tests__/               # Test setup and utilities
│   │   ├── setup.ts            # Global test configuration
│   │   ├── __mocks__/          # Mock data
│   │   └── utils/              # Test utilities
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # API route handlers
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/              # React components
│   │   ├── Graph/              # Graph visualization
│   │   ├── AddressDetails/     # Address info panel
│   │   ├── ApiLog/             # API logging window
│   │   └── ErrorBoundary/      # Error handling
│   └── lib/                     # Utilities and services
│       ├── api/                # Backend client
│       ├── services/           # Business logic
│       └── types/              # TypeScript types
├── backend/                     # Backend source code
│   ├── app/                    # FastAPI application
│   │   ├── api/               # API routes
│   │   │   └── routes/        # Route handlers
│   │   ├── models/            # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py            # FastAPI app
│   ├── tests/                  # Backend tests
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── conftest.py        # Pytest fixtures
│   ├── requirements.txt        # Python dependencies
│   └── pytest.ini             # Pytest configuration
├── public/                      # Static assets
├── vitest.config.ts            # Vitest configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Graph Visualization**: ReactFlow 12 + D3-Force 3
- **HTTP Client**: Fetch API
- **Testing**: Vitest 3 + Testing Library
- **Linting**: ESLint 9 + Prettier 3
- **Environment**: T3 Env (type-safe env vars)

### Backend

- **Framework**: FastAPI 0.115
- **Language**: Python 3.11+
- **Server**: Uvicorn (ASGI)
- **HTTP Client**: httpx (async)
- **Validation**: Pydantic 2.9
- **Testing**: Pytest 8 + Pytest-asyncio
- **Mocking**: respx 0.21

## Scripts

### Frontend Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format with Prettier
pnpm type-check   # TypeScript type checking
pnpm test         # Run tests
pnpm test:ui      # Run tests with UI
pnpm test:coverage # Run tests with coverage
```

### Backend Scripts

```bash
python run.py                    # Start server
pytest                          # Run tests
pytest --cov=app               # Run tests with coverage
pytest tests/unit              # Run unit tests only
pytest tests/integration       # Run integration tests only
```

## Security Features

- **Content Security Policy (CSP)** - Configured in `next.config.ts`
- **CORS Protection** - Whitelisted origins only
- **Rate Limiting** - Backend enforces 10s delay between requests
- **Input Validation** - Pydantic models validate all inputs
- **Error Boundaries** - Frontend catches and handles errors gracefully
- **Type Safety** - Full TypeScript and Pydantic coverage

## Rate Limiting

The application respects blockchain.info API rate limits:

- **Minimum delay**: 10 seconds between requests
- **Maximum requests**: 6 per minute
- **Automatic retry**: On 429 (rate limit) errors
- **Smart queuing**: Requests are queued and processed sequentially

## Troubleshooting

### Common Issues

**Backend won't start:**

```bash
# Make sure virtual environment is activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Frontend can't connect to backend:**

- Check that backend is running on port 8000
- Verify `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Check CORS settings in `backend/app/main.py`

**Tests failing:**

```bash
# Frontend
pnpm install
pnpm test

# Backend
cd backend
pip install -r requirements.txt
pytest
```

**Rate limiting errors:**

- The blockchain.info API has strict rate limits
- Wait at least 10 seconds between requests
- Consider implementing a caching layer for frequently accessed addresses

## Additional Documentation

- **Frontend Tests**: See `__tests__/README.md`
- **Backend Tests**: See `backend/tests/README.md`
- **API Documentation**: Visit `http://localhost:8000/docs` when running

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code style
- Run linters before committing: `pnpm lint:fix` and `pnpm format`
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [blockchain.info](https://blockchain.info) for their public API
- [ReactFlow](https://reactflow.dev/) for graph visualization
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing Python framework
- [Next.js](https://nextjs.org/) for the powerful React framework

---
