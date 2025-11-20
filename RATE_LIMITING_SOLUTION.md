# Rate Limiting - הסבר ופתרונות

## מה זה Rate Limiting?

**Rate Limiting** = הגבלת מספר הבקשות ל-API בתוך זמן מסוים.

### למה זה קורה?
- blockchain.info API מגביל את מספר הבקשות לפי IP
- כשעוברים את המגבלה, מקבלים שגיאה **429 (Too Many Requests)**
- זה מגן על השרת מפני overload

## פתרונות שיושמו:

### 1. Rate Limiter ב-Backend
- **6 שניות** בין בקשות
- **10 בקשות** מקסימום לדקה
- ממתין אוטומטית אם צריך

### 2. Retry Logic חכם
- אם מקבלים 429, ממתינים לפי ה-`Retry-After` header
- Retry רק פעם אחת אחרי ההמתנה

### 3. Caching (מומלץ להוסיף בעתיד)
- שמירת תשובות למשך זמן קצר
- הימנעות מבקשות כפולות לאותה כתובת

## איך להשתמש:

### למשתמש:
1. **חכה 6-10 שניות** בין חיפושים
2. **אל תלחץ מהר מדי** על nodes להרחבה
3. אם מקבלים שגיאה - **חכה 30-60 שניות** לפני ניסיון נוסף

### לפיתוח:
```python
# Rate limiter מוסיף delay אוטומטי:
await wait_for_rate_limit("blockchain_api")  # ממתין אם צריך
```

## הגדרות (ניתן לשנות):

בקובץ `backend/app/services/rate_limiter.py`:
- `MAX_REQUESTS_PER_MINUTE = 10` - מספר מקסימום בקשות לדקה
- `MIN_DELAY_BETWEEN_REQUESTS = 6.0` - שניות בין בקשות

## פתרונות נוספים (לעתיד):

1. **Caching** - שמירת תשובות במשך דקות
2. **Request Queue** - תור בקשות עם priorities
3. **Multiple API Keys** - אם blockchain.info תומך
4. **Alternative APIs** - שימוש ב-APIs אחרים (blockchair, blockcypher)

