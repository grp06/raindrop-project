import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import clickhouse_connect
from clickhouse_connect.driver.client import Client
from dotenv import load_dotenv

from .sql_grammar import validate_sql

logger = logging.getLogger(__name__)

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

HOST = "zdni402lap.us-east1.gcp.clickhouse.cloud"
USER = "default"
DATABASE = "default"
TABLE = "IEA_Global_EV_Data_2024"
PORT = 8443
SECURE = True
PASSWORD_ENV = "CLICKHOUSE_PASSWORD"
MAX_EXECUTION_TIME_SECONDS = 20
MAX_RESULT_ROWS = 1000


def _require_password() -> str:
    load_dotenv(ENV_PATH)
    value = os.getenv(PASSWORD_ENV)
    if value is None or value == "":
        raise ValueError(f"{PASSWORD_ENV} is required. Set it in backend/.env.")
    return value


@lru_cache(maxsize=1)
def get_client() -> Client:
    password = _require_password()
    try:
        client = clickhouse_connect.get_client(
            host=HOST,
            port=PORT,
            username=USER,
            password=password,
            secure=SECURE,
            database=DATABASE,
        )
    except Exception:
        logger.exception("Failed to create ClickHouse client")
        raise
    return client


def clickhouse_ping() -> Dict[str, Any]:
    client = get_client()
    select_one = client.query("SELECT 1").result_rows[0][0]
    count_sql = f"SELECT count() FROM {DATABASE}.{TABLE}"
    row_count = client.query(count_sql).result_rows[0][0]
    return {
        "ok": True,
        "database": DATABASE,
        "table": TABLE,
        "select_1": select_one,
        "row_count": row_count,
    }


def query_iea_sample(year: int = 2023, limit: int = 25) -> Dict[str, Any]:
    if limit <= 0:
        raise ValueError("limit must be positive")
    client = get_client()
    sql = (
        "SELECT region, year, parameter, mode, powertrain, unit, value "
        f"FROM {DATABASE}.{TABLE} "
        f"WHERE year = {year} "
        f"LIMIT {limit}"
    )
    result = client.query(sql)
    columns: List[str] = result.column_names
    rows = [dict(zip(columns, row)) for row in result.result_rows]
    return {"sql": sql, "columns": columns, "rows": rows}


def execute_sql(sql: str) -> Dict[str, Any]:
    validate_sql(sql)
    client = get_client()
    result = client.query(
        sql,
        settings={
            "max_execution_time": MAX_EXECUTION_TIME_SECONDS,
            "max_result_rows": MAX_RESULT_ROWS,
            "result_overflow_mode": "throw",
        },
    )
    columns: List[str] = result.column_names
    rows = [dict(zip(columns, row)) for row in result.result_rows]
    return {"columns": columns, "rows": rows}
