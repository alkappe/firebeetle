# 🔥🪲 FireBeetle

A web app for monitoring wildfires: a live map of fires worldwide, user-submitted photo alerts for spotted fires/smoke, and an AI backoffice that reviews and verifies those reports.

Status: early scaffolding only. See [DECISIONS.md](DECISIONS.md) for what's been set up and why.

## Structure

- `frontend/` — React + TypeScript (Vite). UI framework (plain React vs. Next.js) and design system are not decided yet.
- `backend/` — Python (FastAPI + Uvicorn).

## Running locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`
