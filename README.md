# מתכנן טיולים חכם (Smart Trip Planner)

אפליקציית Full-Stack לתכנון טיולים: המשתמש בוחר יעד, תאריכים, רמת תקציב ותחומי עניין, והמערכת בונה מסלול יומי מפורט באמצעות שילוב של **Google Places API** (מקומות אמיתיים), **OpenWeatherMap** (תחזית מזג אוויר) ו-**OpenAI** (יצירת המסלול עצמו). ניתן גם לערוך את המסלול שנוצר ידנית.

## ארכיטקטורה

```
smart-trip-planner/
├── server/     # Node.js + Express + TypeScript + PostgreSQL (Drizzle ORM)
├── client/     # React + TypeScript + Vite
└── docker-compose.yml   # PostgreSQL להרצה מקומית
```

**צד שרת:** REST API עם אימות JWT, ולידציה עם Zod, שכבת שירותים (services) שמפרידה בין לוגיקה עסקית לבין ה-routes, ו-ORM מסוג Drizzle (TypeScript-first, ללא "קסמים" - כל שאילתה נראית כמו SQL).

**צד לקוח:** React + Vite עם ניתוב (react-router-dom), ניהול state של שרת עם React Query, הקשר אימות (AuthContext) ותצוגת מפה עם Google Maps.

**מסד נתונים:** PostgreSQL עם 4 טבלאות: `users` → `trips` → `trip_days` → `activities`, כולל foreign keys עם cascade delete.

## דרישות מוקדמות

- Node.js 20+
- Docker (להרצת PostgreSQL) - **או** התקנה מקומית של PostgreSQL 16
- מפתחות API (ראה בהמשך)

## הרצה מקומית - שלב אחר שלב

### 1. מסד הנתונים

```bash
docker compose up -d
```

זה יריץ PostgreSQL על פורט 5432 עם משתמש/סיסמה/DB שכבר מוגדרים ב-`server/.env.example`.

אם אין לך Docker, אפשר להתקין PostgreSQL מקומי וליצור ידנית משתמש `trip_user` וסיסמה `trip_pass` ומסד בשם `trip_planner` (ראה פקודות ב-`docker-compose.yml` כדוגמה), ולעדכן את `DATABASE_URL` בהתאם.

### 2. צד שרת

```bash
cd server
cp .env.example .env
# ערוך את .env והוסף את מפתחות ה-API שלך (ראה למטה)
npm install
npm run db:generate   # יוצר קובצי מיגרציה מהסכימה (כבר קיימים בפרויקט)
npm run db:migrate    # מריץ את המיגרציות מול ה-DB
npm run dev           # מריץ את השרת על http://localhost:4000
```

בדיקת תקינות: `curl http://localhost:4000/api/health`

### 3. צד לקוח

בטרמינל נפרד:

```bash
cd client
cp .env.example .env
# ערוך את .env והוסף מפתח Google Maps JavaScript API
npm install
npm run dev            # מריץ את הלקוח על http://localhost:5173
```

פתח את הדפדפן בכתובת http://localhost:5173, הירשם עם משתמש חדש, ותתחיל לתכנן טיול.

## מפתחות API נדרשים

| שירות | משתנה סביבה | היכן נמצא | הערות |
|---|---|---|---|
| Google Places API | `GOOGLE_PLACES_API_KEY` (server) | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → הפעל "Places API" ו-"Geocoding API" | דורש חשבון עם billing מופעל (יש טייר חינמי חודשי) |
| Google Maps JavaScript API | `VITE_GOOGLE_MAPS_API_KEY` (client) | אותו פרויקט ב-Google Cloud → הפעל "Maps JavaScript API" | מומלץ להגביל את המפתח לדומיין/localhost בלבד |
| OpenWeatherMap | `OPENWEATHER_API_KEY` (server) | [openweathermap.org/api](https://openweathermap.org/api) → הרשמה חינמית | ה-API החינמי (`/data/2.5/forecast`) חוזה עד 5 ימים קדימה בלבד; לטיולים רחוקים יותר המערכת פשוט תדלג על שילוב מזג האוויר |
| OpenAI | `OPENAI_API_KEY` (server) | [platform.openai.com](https://platform.openai.com/api-keys) | כרוך בתשלום לפי שימוש; המודל המוגדר כברירת מחדל (`gpt-4o-mini`) זול יחסית |

**חשוב:** אם מפתח כלשהו חסר, השרת ידפיס אזהרה ל-console ופשוט ידלג על אותו שירות (למשל, בלי מפתח OpenWeatherMap המערכת עדיין תיצור מסלול, רק בלי התחשבות במזג אוויר) - חוץ מ-Google Places ו-OpenAI שהם קריטיים ליצירת מסלול (`POST /trips/:id/generate` יחזיר שגיאה ברורה אם הם חסרים).

## זרימת העבודה המרכזית (יצירת מסלול)

1. המשתמש יוצר טיול (`POST /api/trips`) - נשמר במסד הנתונים במצב `DRAFT`.
2. המשתמש לוחץ "צור מסלול עם AI" (`POST /api/trips/:id/generate`), והשרת:
   - ממיר את שם היעד לקואורדינטות (Google Geocoding).
   - מחפש מקומות אמיתיים לפי תחומי העניין (Google Places Text Search).
   - שולף תחזית מזג אוויר לטווח התאריכים (OpenWeatherMap).
   - שולח את כל המידע הזה כ-prompt ל-OpenAI ומבקש מסלול יומי מובנה (JSON).
   - מאמת את התשובה מול סכימת Zod, ושומר ימים+פעילויות במסד הנתונים בתוך טרנזקציה אחת.
3. המשתמש יכול לערוך את המסלול ידנית (הוספה/עריכה/מחיקה של פעילויות) או ליצור מחדש.

## API Endpoints עיקריים

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/trips
GET    /api/trips
GET    /api/trips/:id
PATCH  /api/trips/:id
DELETE /api/trips/:id
POST   /api/trips/:id/generate

POST   /api/trips/:id/days/:dayId/activities
PATCH  /api/trips/:id/days/:dayId/activities/:activityId
DELETE /api/trips/:id/days/:dayId/activities/:activityId
```

כל ה-endpoints מתחת ל-`/api/trips` דורשים כותרת `Authorization: Bearer <token>`.

## הרחבות אפשריות (רעיונות להמשך)

- שיתוף טיול עם משתמשים אחרים (view-only link).
- גרירה-ושחרור (drag & drop) לסידור מחדש של פעילויות בין ימים.
- שמירת מקומות מועדפים (Saved Places) לפני יצירת המסלול.
- תמיכה במטבעות שונים לעלות המשוערת.
- טסטים אוטומטיים (Jest/Vitest) ל-services ול-routes.
- CI/CD עם GitHub Actions.
