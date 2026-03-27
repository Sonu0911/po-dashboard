# PO Command — Purchase Order Intelligence Dashboard

A full-stack web application that automates the extraction of Purchase Order (PO) data from PDF files, stores it in a relational database, and delivers real-time business insights through an interactive dashboard.

---

## 🚀 Features

- **PDF Upload & Auto Extraction** — Upload any PO PDF and data is automatically parsed and stored
- **Live Currency Conversion** — Real-time USD to GBP conversion via Exchange Rate API
- **Interactive Dashboard** — Charts, filters, and tables for business insights
- **Size Breakdown** — Per-size quantity breakdown for each PO line
- **CSV Export** — Export all PO data to Excel/CSV with one click
- **Delivery Timeline** — Visual tracking of ex-factory vs delivery dates
- **Authentication** — Secure login/logout system
- **Brand & Supplier Filters** — Filter data by brand or supplier in real time

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| PDF Parsing | pdf-parse |
| File Upload | Multer |
| HTTP Client | Axios |
| Currency API | ExchangeRate-API |

---

## 📁 Project Structure

```
po-dashboard/
├── backend/
│   ├── routes/
│   │   ├── pos.js          # GET all POs + lines
│   │   ├── summary.js      # Business summary + live FX rate
│   │   └── upload.js       # PDF upload + data extraction
│   ├── db.js               # PostgreSQL connection
│   ├── schema.sql          # Database schema
│   ├── server.js           # Express server
│   └── .env                # Environment variables
├── frontend/
│   └── src/
│       └── App.js          # React dashboard
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v14+)
- npm

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sonu0911/po-dashboard.git
cd po-dashboard
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the `backend` folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=po_dashboard
DB_USER=postgres
DB_PASSWORD=postgres
PORT=5000
```

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE po_dashboard;"
```

Run the schema:

```bash
psql -U postgres -d po_dashboard -f schema.sql
```

Start the backend server:

```bash
node server.js
```

Server will start at: `http://localhost:5000`

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

App will open at: `http://localhost:3000`

---

## 🔐 Login Credentials

| Field | Value |
|-------|-------|
| Username | admin |
| Password | admin123 |

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pos` | Get all purchase orders |
| GET | `/api/pos?brand=boohoo` | Filter by brand |
| GET | `/api/pos/:id/lines` | Get size breakdown for a PO |
| GET | `/api/summary` | Business summary + live FX rate |
| POST | `/api/upload` | Upload PDF and extract PO data |

---

## 🏗️ Architecture

```
PDF Files
    ↓
Node.js + pdf-parse (Extract data)
    ↓
PostgreSQL (Store data)
    ↓
Express REST API (Serve data)
    ↓
React Dashboard (Display insights)
```

---

## 📦 Supported Brands

- **boohoo** — GBP orders
- **PrettyLittleThing** — USD orders (auto-converted to GBP)
- **Coast** — GBP orders

---

## 📈 Dashboard Tabs

- **Overview** — Total value, units, active orders, brand charts
- **Orders** — PO cards with size breakdown on click
- **Analytics** — Comparison table with CSV export
- **Timeline** — Delivery date tracking per PO

---

## 👤 Author

Rushikesh — Full Stack Developer Interview Project