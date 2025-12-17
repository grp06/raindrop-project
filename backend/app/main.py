import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .clickhouse_client import clickhouse_ping, query_iea_sample


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
        raise HTTPException(status_code=400, detail="prompt is required")
    try:
        result = query_iea_sample()
        return {k: v for k, v in result.items() if k != "error"}
    except Exception as exc:
        logger.exception("ClickHouse query failed")
        return JSONResponse(
            status_code=500,
            content={"sql": "", "rows": [], "error": str(exc)},
        )
