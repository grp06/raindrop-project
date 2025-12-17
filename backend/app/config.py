from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


@lru_cache(maxsize=1)
def _load_env() -> None:
    load_dotenv(ENV_PATH)


def get_env(name: str, default: str | None = None) -> str | None:
    _load_env()
    return os.getenv(name, default)


def require_env(
    name: str,
    message: str,
    error_cls: type[Exception] = ValueError,
) -> str:
    value = get_env(name)
    if value is None or value == "":
        raise error_cls(message)
    return value
