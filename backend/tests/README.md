# מדריך בדיקות - Blockchain Investigator Backend

## התקנה

ודא שהתקנת את כל ה-dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## הרצת הבדיקות

### כל הבדיקות

```bash
pytest
```

### רק Unit Tests

```bash
pytest tests/unit/
```

### רק Integration Tests

```bash
pytest tests/integration/
```

### עם דוח כיסוי קוד (Coverage)

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

הדוח יישמר בתיקייה `htmlcov/` - פתח את `htmlcov/index.html` בדפדפן.

### הרצת בדיקה ספציפית

```bash
# הרצת קובץ בדיקה אחד
pytest tests/unit/test_schemas.py

# הרצת בדיקה ספציפית
pytest tests/unit/test_schemas.py::TestGraphNode::test_valid_graph_node

# הרצת כל הבדיקות בקלאס
pytest tests/unit/test_schemas.py::TestGraphNode
```

### אפשרויות נוספות

```bash
# הרצה עם פירוט מלא (verbose)
pytest -v

# הרצה עם הדפסת print statements
pytest -s

# הרצה מהירה - עצור אחרי שגיאה ראשונה
pytest -x

# הרצה עם פילטור לפי markers
pytest -m unit      # רק unit tests
pytest -m integration  # רק integration tests
```

## מבנה הבדיקות

```
tests/
├── __init__.py
├── conftest.py              # Fixtures משותפים
├── unit/                    # Unit Tests
│   ├── __init__.py
│   ├── test_blockchain_service.py  # בדיקות ל-blockchain service
│   ├── test_rate_limiter.py        # בדיקות ל-rate limiter
│   └── test_schemas.py             # בדיקות ל-Pydantic schemas
└── integration/             # Integration Tests
    ├── __init__.py
    └── test_api_endpoints.py      # בדיקות ל-FastAPI endpoints
```

## כיסוי קוד

היעד: **60-70%** כיסוי קוד

הבדיקות מכסות:
- ✅ Pydantic schemas validation
- ✅ Rate limiter logic
- ✅ Blockchain service functions
- ✅ API endpoints
- ✅ Error handling
- ✅ Query parameters validation
- ✅ CORS configuration

## Fixtures זמינים

הקובץ `conftest.py` מספק fixtures שימושיים:

- `test_client` - TestClient של FastAPI
- `mock_transaction` - Transaction לדוגמה
- `mock_address_data` - AddressResponse לדוגמה
- `mock_graph_data` - GraphData לדוגמה
- `sample_blockchain_api_response` - תגובת API גולמית
- `reset_rate_limiter` - ניקוי אוטומטי של rate limiter

## טיפים

1. **הרצת בדיקות מהירה**: השתמש ב-`pytest tests/unit/` להרצה מהירה ללא בדיקות אינטגרציה
2. **Mock API חיצוני**: כל הבדיקות משתמשות ב-`respx` כדי למדמות קריאות ל-blockchain.info
3. **Rate Limiter**: ה-fixture `reset_rate_limiter` מנקה את המצב בין בדיקות
4. **Async Tests**: כל הבדיקות האסינכרוניות משתמשות ב-`@pytest.mark.asyncio`

## בעיות נפוצות

### TimeoutError בבדיקות

אם הבדיקות נכשלות עם TimeoutError, זה בדרך כלל אומר ש-rate limiter ממתין.
ודא שה-fixture `reset_rate_limiter` פועל כראוי.

### ImportError

אם אתה מקבל ImportError, ודא שאתה מריץ את הבדיקות מתיקיית `backend/`:

```bash
cd backend
pytest
```

### Coverage נמוך מדי

אם הכיסוי נמוך מ-60%, הבדיקות ייכשלו. זה מוגדר ב-`pytest.ini`:

```ini
--cov-fail-under=60
```

## CI/CD

ניתן להוסיף את הבדיקות ל-GitHub Actions או CI/CD אחר:

```yaml
- name: Run tests
  run: |
    cd backend
    pytest --cov=app --cov-report=xml
```

