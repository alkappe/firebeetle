# FireBeetle

Wildfire monitoring web app: a live world map of fires, user-submitted photo alerts for spotted fires/smoke, and an AI backoffice that reviews/verifies those reports. See [REQUIREMENTS.md](REQUIREMENTS.md) for product scope, [DECISIONS.md](DECISIONS.md) for the history and rationale of technical choices, and [AGENTS.md](AGENTS.md) for environment quirks/breaking-change notes.

## Structure

- `frontend/` — React + TypeScript, scaffolded with Vite. Plain React vs. Next.js, and the UI design system, are not decided yet — don't assume either.
- `backend/` — Python, FastAPI + Uvicorn. Dependencies pinned in `backend/requirements.txt`, installed into `backend/.venv`.

## Commands

```bash
# frontend
cd frontend && npm run dev

# backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

## Conventions

- Log meaningful technical decisions (and the *why*) in DECISIONS.md as they're made.
- Verify real runtime behavior (start the server, hit the endpoint/page) before considering a change done — not just that install/build/lint passed.
