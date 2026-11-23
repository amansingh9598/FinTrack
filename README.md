# FinTrack – Personal Finance Analytics (MERN)

Analyze income, expenses, savings and spending habits.

| Feature | Where |
|---|---|
| Landing page | `/` |
| Monthly expense breakdown | Overview + Insights (monthly table) |
| Category-wise spending charts | Overview (donut), Insights (ranking) |
| Savings prediction | Insights (linear regression forecast, next 3 months) |
| Budget vs actual comparison | Budgets (bar chart + progress bars) |

## Tech stack
- **MongoDB** + Mongoose – users, transactions, budgets
- **Express + Node.js** – REST API, JWT auth, aggregation pipelines for analytics
- **React (Vite)** – dashboard, **Recharts** for all charts, React Router

## Run locally
Requirements: Node 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
# 1. install everything
npm run install:all
npm install            # installs "concurrently" at the root

# 2. configure the server
#    server/.env already exists - edit MONGO_URI / JWT_SECRET if needed

# 3. (optional) load demo data: demo@fintrack.com / demo1234
npm run seed

# 4. start API (port 5000) and React app (port 5173) together
npm run dev
```
Open http://localhost:5173. The "Explore with sample data" button creates the demo account automatically, so seeding is optional.

## Project structure
```
fintrack/
├── server/
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js          JWT check
│   ├── models/                     User, Transaction, Budget
│   ├── routes/
│   │   ├── auth.js                 register, login, demo, me
│   │   ├── transactions.js         CRUD + filters + pagination
│   │   ├── budgets.js              upsert per category/month
│   │   └── analytics.js            summary, monthly, daily, budget-vs-actual, prediction
│   └── utils/                      date helpers, demo seeder
└── client/
    └── src/
        ├── pages/                  Landing, Auth, Dashboard, Transactions, Budgets, Insights
        ├── components/             AppLayout, charts, StatCard, Modal, MonthPicker…
        └── context/AuthContext.jsx
```

## API reference
All routes except `/auth/*` need `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` `/login` `/demo` | Authentication |
| GET | `/api/auth/me` | Current user |
| GET | `/api/transactions?month=&type=&category=&search=&page=` | List |
| POST / PUT / DELETE | `/api/transactions[/:id]` | Manage |
| GET / PUT / DELETE | `/api/budgets[/:id]` | Monthly category budgets |
| GET | `/api/analytics/summary?month=YYYY-MM` | Totals, savings rate, category split |
| GET | `/api/analytics/monthly?months=6` | Income / expense / savings per month |
| GET | `/api/analytics/daily?month=YYYY-MM` | Cumulative daily spending |
| GET | `/api/analytics/budget-vs-actual?month=YYYY-MM` | Budget comparison |
| GET | `/api/analytics/prediction` | 3-month savings forecast |

## How the savings prediction works
The server takes monthly savings (income − expenses) from your last full months and fits a least-squares line through them.
It projects the next 3 months from that line and returns an R² value (shown as "Forecast fit") so users know how steady their pattern is.

## Responsive design
- **Laptop (>1024px):** fixed sidebar, multi-column dashboards
- **Tablet (721–1024px):** slide-in sidebar, 2-column stat cards, single-column charts
- **Mobile (≤720px):** stacked layout, tables turn into cards, full-width buttons

## Deploying
- Build the client with `npm run build` and host `client/dist` (Netlify, Vercel…). Set `VITE_API_URL` to your API URL.
- Host `server/` (Render, Railway…). Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
- Currency is INR (₹). Change it in `client/src/utils.js` (`Intl.NumberFormat`) to use another currency.
