# CFG-to-SQL (ClickHouse)

Small demo app that turns a natural-language question into **ClickHouse SQL** using **GPT-5 + a context-free grammar (CFG)**, validates the SQL server-side, executes it against ClickHouse, and shows the SQL + results in a simple React UI.

## Dataset

The app is wired to the **Body Performance** dataset (Korea Sports Promotion Foundation).

- Shape: 13,393 rows × 12 columns
- Age: 20–64
- Gender: `F` / `M`
- Target/label: `fitness_class` in `A` (best), `B`, `C`, `D` (worst)
- Columns: `age`, `gender`, `height_cm`, `weight_kg`, `body_fat_pct`, `diastolic`, `systolic`, `grip_force`, `sit_and_bend_forward_cm`, `situps_count`, `broad_jump_cm`, `fitness_class`

## How it works

1. UI posts `{ prompt }` to `POST /api/query`
2. Backend calls OpenAI Responses with a custom tool whose **tool input is CFG-constrained** to a whitelisted SQL subset
3. Backend parses/validates the returned SQL with the same grammar
4. Backend executes the SQL against ClickHouse and returns `{ sql, columns, rows }`

## Run locally

### Backend (FastAPI, uv)

Set env vars in `backend/.env`:

- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-5.2` (optional)
- `CLICKHOUSE_PASSWORD=...`

Run:

- `cd backend`
- `uv sync`
- `uv run uvicorn app.main:app --reload`

### Frontend (React, Vite)

Run:

- `cd frontend`
- `npm install`
- `npm run dev`

### Evals

With the backend running on `http://localhost:8000`:

- Generation/intent evals (hit `POST /api/sql/generate`): `python evals/sql_generation_eval.py`
- Execution smoke (hit `POST /api/query`): `python evals/sql_execution_smoke.py`
