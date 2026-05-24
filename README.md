<div align="center">

<h1>📊 UPI Transaction Analytics Dashboard</h1>

<p>A production-grade fintech analytics platform simulating real-world systems used by <strong>PhonePe</strong>, <strong>Google Pay</strong>, and <strong>Paytm</strong> — with fraud detection, spending intelligence, and 25,000 synthetic UPI transactions.</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/pnpm-Workspace-F69220?style=for-the-badge&logo=pnpm&logoColor=white" />
</p>

<img src="https://raw.githubusercontent.com/snehalghodke23105/upi-transaction-analytics/main/docs/overview.jpg" alt="Dashboard Overview" width="100%" />

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📈 **Overview Dashboard** | KPI cards (₹18.9 Cr volume, 25K txns, 6.5% fraud rate), 30-day volume chart, spending by category, app market share |
| 🔍 **Fraud Intelligence** | Fraud pattern breakdown (SIM Swap, Phishing, Velocity Attack…), hourly heatmap, state-level risk hotspots, amount distribution |
| 🗂 **Transaction Explorer** | Full-text search, category + amount filters, fraud-only toggle, paginated table, CSV export |
| 🌙 **Dark Mode** | Default dark navy theme with one-click light mode toggle |
| 🔄 **Auto Refresh** | Configurable auto-refresh intervals (30s → 10min) with animated spinner |
| 🖨 **Print / PDF Export** | Print-optimized layout; each chart has individual PNG download |

---

## 📸 Screenshots

### Dashboard Overview
![Overview](https://raw.githubusercontent.com/snehalghodke23105/upi-transaction-analytics/main/docs/overview.jpg)

### Fraud Intelligence
![Fraud Intelligence](https://raw.githubusercontent.com/snehalghodke23105/upi-transaction-analytics/main/docs/fraud.jpg)

### Transaction Explorer
![Transaction Explorer](https://raw.githubusercontent.com/snehalghodke23105/upi-transaction-analytics/main/docs/explorer.jpg)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React + Vite)             │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │ Overview  │  │ Fraud Intelligence│  │ Explorer │  │
│  └─────┬─────┘  └────────┬─────────┘  └────┬─────┘  │
│        └────────────────┬┘────────────────┘          │
│              TanStack Query (React Query)             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP /api/*
┌────────────────────▼────────────────────────────────┐
│              Express 5 API Server                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  /api/analytics/summary                      │   │
│  │  /api/analytics/transactions-over-time       │   │
│  │  /api/analytics/spending-by-category         │   │
│  │  /api/analytics/fraud-patterns               │   │
│  │  /api/analytics/fraud-by-hour                │   │
│  │  /api/analytics/state-risk                   │   │
│  │  /api/analytics/amount-distribution          │   │
│  │  /api/analytics/payment-app-usage            │   │
│  │  /api/transactions (paginated explorer)      │   │
│  └────────────────────┬─────────────────────────┘   │
│              Drizzle ORM + Zod validation            │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           PostgreSQL Database                        │
│  transactions table — 25,000 synthetic UPI rows     │
│  Fields: id, txnId, amount, merchant, category,     │
│          paymentApp, senderState, isFraud,           │
│          fraudType, status, timestamp               │
└─────────────────────────────────────────────────────┘
```

---

## 🗂 Project Structure

```
upi-transaction-analytics/
├── artifacts/
│   ├── api-server/          # Express 5 backend (port 8080)
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── analytics.ts   # 9 analytics endpoints
│   │       │   └── transactions.ts
│   │       └── index.ts
│   └── upi-analytics/       # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── Overview.tsx
│           │   ├── Fraud.tsx
│           │   └── Explorer.tsx
│           ├── components/
│           │   ├── Layout.tsx
│           │   └── HeaderControls.tsx
│           └── utils/
│               ├── chartUtils.ts
│               └── formatters.ts
├── lib/
│   ├── db/                  # Drizzle ORM schema + client
│   │   └── src/schema/transactions.ts
│   └── api-client-react/    # Generated TanStack Query hooks
│       └── src/generated/api.ts
├── scripts/
│   └── src/seed-upi.ts      # 25K synthetic transaction seeder
└── pnpm-workspace.yaml
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### 1. Clone & Install

```bash
git clone https://github.com/snehalghodke23105/upi-transaction-analytics.git
cd upi-transaction-analytics
pnpm install
```

### 2. Environment Variables

```bash
# Create a .env file in the root
DATABASE_URL=postgresql://user:password@localhost:5432/upi_analytics
SESSION_SECRET=your-secret-here
```

### 3. Push DB Schema & Seed Data

```bash
# Push schema to database
pnpm --filter @workspace/db run push

# Seed with 25,000 synthetic transactions
pnpm --filter @workspace/scripts run seed-upi
```

### 4. Run Development Servers

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/upi-analytics run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Typecheck

```bash
pnpm run typecheck
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Overall KPIs (volume, count, fraud rate, avg amount) |
| GET | `/api/analytics/transactions-over-time` | Daily volume for last N days |
| GET | `/api/analytics/spending-by-category` | Spend breakdown by merchant category |
| GET | `/api/analytics/merchant-stats` | Top merchants by volume |
| GET | `/api/analytics/fraud-patterns` | Fraud type distribution |
| GET | `/api/analytics/fraud-by-hour` | Hourly fraud count + fraud rate |
| GET | `/api/analytics/state-risk` | State-wise fraud transaction counts |
| GET | `/api/analytics/amount-distribution` | Transaction amount histogram |
| GET | `/api/analytics/payment-app-usage` | Market share by payment app |
| GET | `/api/transactions` | Paginated + filtered transaction list |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** — component framework
- **Vite** — build tool and dev server
- **Recharts** — interactive charts (area, bar, pie, composed)
- **TanStack Query** — server state management with caching
- **Wouter** — lightweight client-side routing
- **next-themes** — dark/light mode
- **@tanstack/react-table** — headless table for Explorer

### Backend
- **Express 5** — HTTP server with async error handling
- **Drizzle ORM** — type-safe SQL query builder
- **Zod** — request/response validation
- **pino** — structured JSON logging

### Database
- **PostgreSQL** — primary data store
- **drizzle-kit** — schema migrations

### Tooling
- **pnpm workspaces** — monorepo package management
- **Orval** — OpenAPI → TanStack Query codegen
- **esbuild** — production bundle

---

## 📊 Dataset Details

The 25,000 synthetic transactions cover:

- **Time range:** Jan 2024 — Apr 2025
- **Payment apps:** PhonePe (45%), Google Pay (30%), Paytm (15%), BHIM UPI (10%)
- **Categories:** Shopping, Travel, Education, Groceries, Food & Dining, Healthcare, Entertainment, Utilities, Recharge & Bills, Fuel
- **Fraud types:** SIM Swap, Account Takeover, Phishing, Social Engineering, Unauthorized Transfer, Merchant Fraud, Velocity Attack
- **Fraud rate:** ~6.5% (≈1,620 fraudulent transactions)
- **Amount range:** ₹1 — ₹99,999

---

## 👤 Author

**Snehal Ghodke**
- GitHub: [@snehalghodke23105](https://github.com/snehalghodke23105)

---

<div align="center">
  <sub>Built as a fintech portfolio project · Simulates real-world UPI analytics infrastructure</sub>
</div>
