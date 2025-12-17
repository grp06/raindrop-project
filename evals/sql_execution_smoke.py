import argparse
import json
import logging
import sys
from urllib import error, parse, request

logger = logging.getLogger("evals")

# Lightweight execution smoke: hit /api/query and fail if generation/execution returns an error.

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
    )
    parser.add_argument(
        "--prompt",
        default="Average grip force for females",
    )
    return parser.parse_args()


def _validate_base_url(base_url: str) -> str:
    parsed = parse.urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("base_url must include scheme and host, like http://localhost:8000")
    return base_url


def _post_query(base_url: str, prompt: str, timeout: float) -> dict:
    url = base_url.rstrip("/") + "/api/query"
    payload = json.dumps({"prompt": prompt}).encode("utf-8")
    req = request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            status = response.status
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        message = f"HTTP {exc.code} from {url}: {body}"
        logger.error(message)
        raise RuntimeError(message) from exc
    except error.URLError as exc:
        message = f"Request failed for {url}: {exc.reason}"
        logger.error(message)
        raise RuntimeError(message) from exc

    if status < 200 or status >= 300:
        message = f"HTTP {status} from {url}: {body}"
        logger.error(message)
        raise RuntimeError(message)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        message = f"Invalid JSON from {url}: {body}"
        logger.error(message)
        raise RuntimeError(message) from exc

    return payload


def _validate_response(payload: dict) -> None:
    sql = payload.get("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise RuntimeError(f"Response missing sql: {payload}")
    error_message = payload.get("error")
    if isinstance(error_message, str) and error_message.strip():
        raise RuntimeError(f"Backend returned error: {error_message}")
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise RuntimeError(f"Response missing rows list: {payload}")
    columns = payload.get("columns")
    if columns is not None and not isinstance(columns, list):
        raise RuntimeError(f"Response columns must be a list when present: {payload}")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = _parse_args()
    base_url = _validate_base_url("http://localhost:8000")
    prompt = args.prompt.strip()
    if not prompt:
        raise ValueError("prompt is required")
    logger.info("Running execution smoke against %s", base_url)
    payload = _post_query(base_url, prompt, args.timeout)
    _validate_response(payload)
    print("Execution smoke ... PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
