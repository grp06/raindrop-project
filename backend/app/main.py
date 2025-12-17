import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .clickhouse_client import clickhouse_ping, execute_sql
from .sql_generation import ConfigurationError, generate_sql


class QueryRequest(BaseModel):
    prompt: str


app = FastAPI()
logger = logging.getLogger(__name__)


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
        return JSONResponse(
            status_code=400,
            content={"sql": "", "columns": [], "rows": [], "error": "prompt is required"},
        )
    sql = ""
    try:
        # End-to-end path: NL prompt -> CFG-constrained SQL -> ClickHouse execution.
        sql = generate_sql(prompt)
        result = execute_sql(sql)
        return {"sql": sql, "columns": result["columns"], "rows": result["rows"]}
    except ConfigurationError as exc:
        logger.exception("SQL generation configuration error")
        return JSONResponse(
            status_code=500,
            content={"sql": sql, "columns": [], "rows": [], "error": str(exc)},
        )
    except ValueError as exc:
        logger.exception("SQL generation validation error")
        return JSONResponse(
            status_code=400,
            content={"sql": sql, "columns": [], "rows": [], "error": str(exc)},
        )
    except Exception as exc:
        logger.exception("Query generation or execution failed")
        return JSONResponse(
            status_code=502,
            content={"sql": sql, "columns": [], "rows": [], "error": str(exc)},
        )


@app.post("/api/sql/generate")
def sql_generate(request: QueryRequest):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    try:
        # Generation-only endpoint for debugging/evals (no ClickHouse execution).
        sql = generate_sql(prompt)
        return {"sql": sql}
    except ConfigurationError as exc:
        logger.exception("SQL generation configuration error")
        raise HTTPException(status_code=500, detail=str(exc))
    except ValueError as exc:
        logger.exception("SQL generation validation error")
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("SQL generation failed")
        raise HTTPException(status_code=502, detail=str(exc))
