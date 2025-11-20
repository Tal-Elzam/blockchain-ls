# Blockchain Investigator - Python Backend

Backend API בפייתון לעיבוד נתוני בלוקצ'יין.

## התקנה

1. ודא שיש לך Python 3.10+ מותקן

2. צור סביבה וירטואלית:
```bash
python -m venv venv
```

3. הפעל את הסביבה הוירטואלית:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. התקן את התלויות:
```bash
pip install -r requirements.txt
```

5. צור קובץ `.env` מהדוגמה:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

## הרצה

הפעל את השרת:
```bash
python run.py
```

או עם uvicorn ישירות:
```bash
uvicorn app.main:app --reload --port 8000
```

השרת יעלה על `http://localhost:8000`

תיעוד API אוטומטי זמין ב-`http://localhost:8000/docs`

## מבנה הפרויקט

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   └── routes/
│   │       └── blockchain.py  # Blockchain API endpoints
│   ├── services/
│   │   └── blockchain_service.py  # Business logic
│   └── models/
│       └── schemas.py       # Pydantic models
├── requirements.txt
├── .env.example
└── README.md
```

## Endpoints

### GET `/`
Health check endpoint

### GET `/health`
Health check endpoint for monitoring

### GET `/api/address/{address}`
מביא פרטים על כתובת ביטקוין

**Parameters:**
- `address`: כתובת ביטקוין (required)
- `limit`: מספר עסקאות להביא (1-100, default: 50)
- `offset`: מספר עסקאות לדלג (default: 0)

**Example:**
```
GET /api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=50&offset=0
```

### GET `/api/address/{address}/graph`
מביא פרטים על כתובת וממיר אותם לפורמט גרף

**Parameters:**
- `address`: כתובת ביטקוין (required)
- `limit`: מספר עסקאות להביא (1-100, default: 50)
- `offset`: מספר עסקאות לדלג (default: 0)

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
      "label": "1A1zP1e...7DivfNa"
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

## משתני סביבה

צור קובץ `.env` מהדוגמה (`.env.example`) והגדר:

- `HOST`: כתובת השרת (default: 0.0.0.0)
- `PORT`: פורט השרת (default: 8000)
- `CORS_ORIGINS`: רשימת origins מורשים מופרדים בפסיקים
- `BLOCKCHAIN_API_BASE`: כתובת בסיס של blockchain.info API (default: https://blockchain.info)
- `DEFAULT_TIMEOUT`: זמן timeout ברירת מחדל בשניות (default: 30)

## פיתוח

השרת רץ עם auto-reload, כך שכל שינוי בקוד יטען מחדש אוטומטית.

לביצוע בדיקות:
```bash
# Type checking (אם תוסיף mypy)
mypy app/

# Linting (אם תוסיף flake8 או black)
flake8 app/
black app/
```

## הערות

- השרת משתמש ב-FastAPI עם async/await לביצועים טובים
- CORS מוגדר כברירת מחדל ל-localhost:3000 (Next.js)
- כל ה-endpoints מחזירים JSON
- שגיאות מחזירות HTTP status codes מתאימים

