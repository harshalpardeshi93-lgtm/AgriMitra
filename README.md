# AgriMitra

> **Know the price. Find the buyer. Sell smarter.**
>
> AI-powered market intelligence for better selling decisions. Built for Smart India Hackathon (SIH) prototype demonstration.

---

## Problem Statement

Smallholder farmers and Farmer Producer Organizations (FPOs) frequently suffer from distress sales due to a lack of transparent local market price discovery, high transportation costs, and limited visibility into direct enterprise buyer demands. 

## Solution

AgriMitra connects smallholders, aggregators, and institutional buyers through a transparent market discovery platform:
1. **APMC Price Comparison**: Aggregates modal prices across nearby mandis with net freight cost calculations.
2. **AI Sell Advisor**: Evaluates historical price trends, volatility, and arrival volumes to recommend the best market and selling window.
3. **Direct Buyer Matching & FPO Hub**: Enables farmers & FPOs to create produce lots, receive competitive buyer offers, and track order payment statuses without middleman commission.

---

## Key Features

- **APMC Market Price Comparison**: Compare modal prices across nearby mandis adjusted for estimated transport costs.
- **Historical Price Trends & Visual Analytics**: Interactive 25-day modal price charts powered by Recharts.
- **AI Sell Advisor**: Chronological validation model providing price forecasts and selling window recommendations with explicit confidence estimates.
- **Produce Lot Aggregation**: FPO hub allowing bulk crop listing by quality grade (Grade A/B/C/Premium).
- **Direct Buyer Demands & Offers**: Enterprise buyers browse lots, filter by crop/location, and submit custom price offers.
- **Transaction & Payment Tracking**: End-to-end status tracking (`Pending` → `Processing` → `Paid` → `Completed`).
- **Role-Based Access Control**: Secure login/registration for Farmer, Buyer, and FPO roles with 1-click Hackathon Demo access.
- **Interactive 3D Landing Page**: Lightweight Three.js visual demonstrating the **Farm → Market → Buyer** value chain with mobile 2D fallback.

---

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **3D Experience**: Three.js (Lazy-loaded)
- **Icons**: Lucide React

### Backend & Machine Learning
- **Framework**: Python, FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **ML / Analytics**: Pandas, NumPy, Scikit-learn
- **Validation**: Pydantic

---

## Data & Prototype Disclaimer

> ⚠️ **Data Integrity & Honesty Notice:**
> AgriMitra operates on prototype APMC mandi data and AI-assisted estimates for demonstration purposes. All price recommendations are AI-assisted estimates based on prototype market data and should not be construed as official government statistical guarantees.

---

## Quick Start & Running Locally

### 1. Start Backend API Server

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- **API Base URL**: `http://127.0.0.1:8000`
- **Health Check**: `http://127.0.0.1:8000/api/health`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`

### 2. Start Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```
- **App URL**: `http://localhost:5173` or `http://localhost:5174`

---

## Role Credentials (1-Click Hackathon Demo)

| Role | Phone | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Farmer** | `9876543210` | `demo123` | `/farmer` |
| **Buyer** | `9876543211` | `demo123` | `/buyer` |
| **FPO** | `9876543212` | `demo123` | `/fpo` |

---

## License

Built for SIH 2026 Prototype Evaluation. All rights reserved.
