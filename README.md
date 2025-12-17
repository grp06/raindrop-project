## Project Layout
- backend/ Python API code
- frontend/ React UI
- evals/ Python evaluation scripts

## Backend (Python, uv)
- Install uv if needed: `pip install uv`
- From repo root: `cd backend`
- Install deps: `uv sync`
- Run app: `uv run uvicorn app.main:app --reload`

## Frontend (React)
- From repo root: `cd frontend`
- Install deps: `npm install`
- Start dev server: `npm run dev`

