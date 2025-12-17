import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .clickhouse_client import clickhouse_ping, execute_sql
from .sql_generation import ConfigurationError, generate_sql


class QueryRequest(BaseModel):
    prompt: str


app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,https://raindrop-project.vercel.app"
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)
logger = logging.getLogger(__name__)


def _error_response(
    status_code: int,
    message: str,
    sql: str = "",
    include_rows: bool = True,
) -> JSONResponse:
    content = {"sql": sql, "error": message}
    if include_rows:
        content["columns"] = []
        content["rows"] = []
    return JSONResponse(status_code=status_code, content=content)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/clickhouse/health")
def clickhouse_health():
    try:
        return clickhouse_ping()
    except Exception as exc:
        logger.exception("ClickHouse health check failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/query")
def query(request: QueryRequest):
    prompt = request.prompt.strip()
    if not prompt:
        return _error_response(400, "prompt is required")
    sql = ""
    try:
        # End-to-end path: NL prompt -> CFG-constrained SQL -> ClickHouse execution.
        sql = generate_sql(prompt)
        result = execute_sql(sql)
        return {"sql": sql, "columns": result["columns"], "rows": result["rows"]}
    except ConfigurationError as exc:
        logger.exception("SQL generation configuration error")
        return _error_response(500, str(exc), sql=sql)
    except ValueError as exc:
        logger.exception("SQL generation validation error")
        return _error_response(400, str(exc), sql=sql)
    except Exception as exc:
        logger.exception("Query generation or execution failed")
        return _error_response(502, str(exc), sql=sql)


@app.post("/api/sql/generate")
def sql_generate(request: QueryRequest):
    prompt = request.prompt.strip()
    if not prompt:
        return _error_response(400, "prompt is required", include_rows=False)
    sql = ""
    try:
        # Generation-only endpoint for debugging/evals (no ClickHouse execution).
        sql = generate_sql(prompt)
        return {"sql": sql}
    except ConfigurationError as exc:
        logger.exception("SQL generation configuration error")
        return _error_response(500, str(exc), sql=sql, include_rows=False)
    except ValueError as exc:
        logger.exception("SQL generation validation error")
        return _error_response(400, str(exc), sql=sql, include_rows=False)
    except Exception as exc:
        logger.exception("SQL generation failed")
        return _error_response(502, str(exc), sql=sql, include_rows=False)
