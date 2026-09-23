# CogniGame NER — Complete Setup & Run Guide (Render PostgreSQL + Local Apps)

This step-by-step guide walks you through connecting **Render Cloud PostgreSQL** and running all components of the CogniGame NER platform on **Windows (PowerShell)** or **macOS/Linux**.

---

## 📋 Architecture Overview

| Component | Directory | Default Port / URL | Description |
|---|---|---|---|
| **Render PostgreSQL** | Cloud Hosted | Port 5432 (SSL) | Cloud Database instance |
| **API Backend** | `apps/api` | `http://localhost:3001` | NestJS + Prisma ORM + WebSockets |
| **Caregiver Dashboard** | `apps/dashboard` | `http://localhost:3000` | Next.js App Router |
| **Difficulty Service** | `apps/difficulty-service` | `http://127.0.0.1:8001` | FastAPI Python microservice |
| **Patient Mobile App** | `apps/mobile` | Expo Dev Server | React Native / Expo app |

---

## 🛠️ Step 1: Render PostgreSQL Setup

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **PostgreSQL**.
3. Name your database (e.g. `cognigame-db`), choose the Free / Hobby tier, and click **Create Database**.
4. Once deployed, scroll down to **Connections** and copy the **External Database URL**.
   It looks like:
   ```
   postgresql://cognigame_user:SECRET_PASSWORD@dpg-xxxxxx-a.oregon-postgres.render.com/cognigame_db?sslmode=require
   ```
   > ⚠️ **Note**: Always ensure `?sslmode=require` is appended to the connection string for Render PostgreSQL connections.

---

## ⚙️ Step 2: Configure Environment Files (`.env`)

You need three environment files created from [.env.example](file:///d:/Cogni-game/.env.example).

### 1. API Configuration: `apps/api/.env`
Create `apps/api/.env` with your Render PostgreSQL URL:

```env
# Render Cloud PostgreSQL Connection URL
DATABASE_URL=postgresql://cognigame_user:SECRET_PASSWORD@dpg-xxxxxx-a.oregon-postgres.render.com/cognigame_db?sslmode=require

# API Configuration
API_PORT=3001
API_PUBLIC_URL=http://localhost:3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081

# Session tokens
JWT_SECRET=super-secret-cognigame-jwt-dev-key

# Firebase Auth (optional — enables SMS OTP). Auth URL: https://<project-id>.firebaseapp.com
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Difficulty Microservice
DIFFICULTY_SERVICE_URL=http://127.0.0.1:8001
INTERNAL_SERVICE_KEY=dev-internal-key
```

### 2. Caregiver Dashboard: `apps/dashboard/.env.local`
Create `apps/dashboard/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
DASHBOARD_PORT=3000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

### 3. Patient Mobile App: `apps/mobile/.env`
Create `apps/mobile/.env`:

```env
# Use your computer's LAN IP if testing on a physical phone/tablet via Expo Go:
# e.g., EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
EXPO_PUBLIC_API_URL=http://localhost:3001
# Optional — same Firebase web keys as the dashboard (SMS OTP is caregiver-only)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
```

---

## 🗄️ Step 3: Run Database Migrations & Seed Data

In your root terminal (`d:\Cogni-game`), run:

```powershell
# 1. Generate Prisma client
pnpm db:generate

# 2. Push the schema to Render PostgreSQL
pnpm --filter @cognigame/api prisma:push

# 3. Seed demo accounts (Caregiver Anjali Das, Patients Rita & Bah)
pnpm db:seed
```

> **Seeded Credentials:**
> - Caregiver: **Anjali Das** (`+916000000001`)
> - Patient Rita Sharma (Assamese) Pairing Code: **`482193`**
> - Patient Bah Nongkynrih (Khasi) Pairing Code: **`719204`**

---

## 🐍 Step 4: Python Difficulty Service Setup

### On Windows (PowerShell):
```powershell
cd apps\difficulty-service
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
cd ..\..
```

### On macOS / Linux:
```bash
cd apps/difficulty-service
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
cd ../..
```

---

## 🚀 Step 5: Start the Applications

Open separate terminal tabs from the repository root (`d:\Cogni-game`):

### Terminal 1: Difficulty Microservice (FastAPI)
- **Windows (PowerShell)**:
  ```powershell
  cd apps\difficulty-service
  .\.venv\Scripts\uvicorn app.main:app --reload --port 8001 --host 127.0.0.1
  ```
- **macOS / Linux**:
  ```bash
  pnpm dev:difficulty
  ```
- *Verify:* Open `http://127.0.0.1:8001/health` in your browser.

### Terminal 2: API Backend (NestJS)
```powershell
pnpm dev:api
```
- *Verify:* Open `http://localhost:3001/health` in your browser.

### Terminal 3: Caregiver Dashboard (Next.js)
```powershell
pnpm dev:dashboard
```
- *Access:* Open [http://localhost:3000](http://localhost:3000)
- Sign in with phone **`+916000000001`** (Anjali Das).

### Terminal 4: Patient Mobile App (Expo)
```powershell
pnpm --filter @cognigame/mobile start
```
- Press `w` to open in web browser, or scan the QR code using the **Expo Go** app on your phone/tablet.
- Use pairing code `482193` (Rita) or `719204` (Bah).

---

## 🧪 Step 6: Running Tests

```powershell
# Game engine unit tests
pnpm --filter @cognigame/game-engine test

# API tests
pnpm --filter @cognigame/api test

# Mobile tests
pnpm --filter @cognigame/mobile test
```
