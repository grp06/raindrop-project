import logging
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from .sql_grammar import sql_grammar, validate_sql

logger = logging.getLogger(__name__)

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
API_KEY_ENV = "OPENAI_API_KEY"
MODEL_ENV = "OPENAI_MODEL"
DEFAULT_MODEL = "gpt-5.2"
TOOL_NAME = "sql_query"
SYSTEM_INSTRUCTIONS = (
    "You generate ClickHouse SQL for the dataset default.IEA_Global_EV_Data_2024 "
    "with columns region, category, parameter, mode, powertrain, year, unit, value. "
    "Use a single SELECT statement that matches the provided grammar and answer the user's request."
)


class ConfigurationError(Exception):
    pass


@lru_cache(maxsize=1)
def _settings() -> tuple[str, str]:
    load_dotenv(ENV_PATH)
    api_key = os.getenv(API_KEY_ENV)
    if not api_key:
        raise ConfigurationError(f"{API_KEY_ENV} is required. Set it in backend/.env.")
    model = os.getenv(MODEL_ENV, DEFAULT_MODEL)
    return api_key, model


@lru_cache(maxsize=1)
def _client() -> OpenAI:
    api_key, _ = _settings()
    return OpenAI(api_key=api_key)


def _model_name() -> str:
    _, model = _settings()
    return model


def _custom_tool() -> dict:
    return {
        "type": "custom",
        "name": TOOL_NAME,
        "description": "Generate a single ClickHouse SELECT statement for the IEA EV dataset.",
        "format": {
            "type": "grammar",
            "syntax": "lark",
            "definition": sql_grammar(),
        },
    }


def _extract_sql(response) -> str:
    for item in response.output:
        if getattr(item, "type", None) == "custom_tool_call" and getattr(item, "name", "") == TOOL_NAME:
            return item.input
    raise RuntimeError("No custom tool call was returned")


def generate_sql(prompt: str) -> str:
    text = prompt.strip()
    if not text:
        raise ValueError("prompt is required")
    client = _client()
    model = _model_name()
    try:
        response = client.responses.create(
            model=model,
            input=text,
            instructions=SYSTEM_INSTRUCTIONS,
            tools=[_custom_tool()],
            tool_choice={"type": "custom", "name": TOOL_NAME},
            temperature=0,
            max_output_tokens=256,
        )
    except Exception:
        logger.exception("OpenAI Responses API call failed")
        raise
    sql = _extract_sql(response)
    validate_sql(sql)
    logger.info("Generated SQL via CFG", extra={"tool": TOOL_NAME, "model": model})
    return sql
