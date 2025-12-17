# Raindrop – Natural Language to SQL

Ask questions about fitness data in plain English. The app translates your question into SQL, runs it against a real database, and shows you the results.

**Live demo:** [raindrop-project.vercel.app](https://raindrop-project.vercel.app)

## How it works

1. You type a question like "What's the average grip strength by fitness class?"
2. The backend uses GPT 5.2 + a context-free grammar (CFG) to generate safe, validated SQL
3. The SQL runs against a ClickHouse database
4. Results come back to the UI as a table

The CFG constrains the LLM output to a whitelisted SQL subset—no arbitrary queries allowed.

## Tech stack

| Layer    | Tech                        | Hosting  |
|----------|-----------------------------|----------|
| Frontend | React, Vite, Tailwind, shadcn/ui | Vercel   |
| Backend  | FastAPI, Python             | Render   |
| Database | ClickHouse                  | ClickHouse Cloud |
| LLM      | gpt-5.2                  | –        |

## Dataset

**Body Performance** (Korea Sports Promotion Foundation)

- 13,393 records of physical performance metrics
- Ages 20–64, Gender: M/F
- Fitness class: A (best) → D (worst)
- Fields: `age`, `gender`, `height_cm`, `weight_kg`, `body_fat_pct`, `diastolic`, `systolic`, `grip_force`, `sit_and_bend_forward_cm`, `situps_count`, `broad_jump_cm`, `fitness_class`

## Local development

### Backend

```bash
cd backend
cp .env.example .env  # add your keys
uv sync
uv run uvicorn app.main:app --reload
```

Required env vars:
- `OPENAI_API_KEY`
- `CLICKHOUSE_PASSWORD`
- `OPENAI_MODEL` (optional, defaults to gpt-4o)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in `.env` to point to your backend (defaults to same origin).

## Evals

With the backend running locally:

```bash
python evals/sql_generation_eval.py   # tests SQL generation
python evals/sql_execution_smoke.py   # tests end-to-end query execution
```
