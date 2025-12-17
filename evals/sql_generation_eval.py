import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass
from typing import Iterable
from urllib import error, parse, request

logger = logging.getLogger("evals")


@dataclass(frozen=True)
class TestCase:
    name: str
    prompt: str
    must_contain: tuple[str, ...]
    must_contain_any: tuple[tuple[str, ...], ...] = ()
    must_not_contain: tuple[str, ...] = ()


TEST_CASES: tuple[TestCase, ...] = (
    TestCase(
        name="Average grip force for females",
        prompt="Average grip force for females",
        must_contain=("AVG(grip_force)", "gender = 'F'"),
        must_not_contain=("gender = 'M'",),
    ),
    TestCase(
        name="Maximum systolic pressure",
        prompt="Maximum systolic pressure",
        must_contain=("MAX(systolic)", "default.bodyPerformance"),
    ),
    TestCase(
        name="Count in fitness class A",
        prompt="How many people are in fitness class A?",
        must_contain=("COUNT(", "fitness_class = 'A'"),
    ),
    TestCase(
        name="Average body fat for males over 50",
        prompt="Average body fat for males over 50",
        must_contain=("AVG(body_fat_pct)", "gender = 'M'"),
        must_contain_any=(("age > 50", "age >= 50"),),
        must_not_contain=("gender = 'F'",),
    ),
    TestCase(
        name="Average grip force by gender",
        prompt="Compare average grip force between genders.",
        must_contain=("AVG(grip_force)", "GROUP BY gender"),
    ),
)


WHITESPACE_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    return WHITESPACE_RE.sub("", text)


def _validate_test_cases(cases: Iterable[TestCase]) -> None:
    for case in cases:
        if not case.name.strip():
            raise ValueError("test case name is required")
        if not case.prompt.strip():
            raise ValueError(f"prompt is required for test case {case.name}")
        if not case.must_contain and not case.must_contain_any:
            raise ValueError(f"expected patterns are required for test case {case.name}")


def _fetch_sql(base_url: str, prompt: str, timeout: float) -> str:
    url = base_url.rstrip("/") + "/api/sql/generate"
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

    sql = payload.get("sql")
    if not isinstance(sql, str) or not sql.strip():
        message = f"Response missing sql from {url}: {payload}"
        logger.error(message)
        raise RuntimeError(message)
    return sql


def _missing_patterns(sql: str, case: TestCase) -> list[str]:
    normalized_sql = _normalize(sql)
    missing: list[str] = []
    for pattern in case.must_contain:
        if _normalize(pattern) not in normalized_sql:
            missing.append(f"Missing: {pattern}")
    for group in case.must_contain_any:
        if not any(_normalize(pattern) in normalized_sql for pattern in group):
            missing.append(f"Missing any of: {', '.join(group)}")
    for pattern in case.must_not_contain:
        if _normalize(pattern) in normalized_sql:
            missing.append(f"Forbidden: {pattern}")
    return missing


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
    )
    parser.add_argument(
        "--show-sql",
        action="store_true",
    )
    return parser.parse_args()


def _validate_base_url(base_url: str) -> str:
    parsed = parse.urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("base_url must include scheme and host, like http://localhost:8000")
    return base_url


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = _parse_args()
    base_url = _validate_base_url(args.base_url)
    _validate_test_cases(TEST_CASES)
    logger.info("Running %d evals against %s", len(TEST_CASES), base_url)

    passed = 0
    failed = 0
    for index, case in enumerate(TEST_CASES, start=1):
        try:
            sql = _fetch_sql(base_url, case.prompt, args.timeout)
        except Exception as exc:
            logger.exception("Eval request failed: %s", case.name)
            print(f"Eval {index}: {case.name} ... FAIL")
            print(f"  - Error: {exc}")
            failed += 1
            continue

        missing = _missing_patterns(sql, case)
        if missing:
            print(f"Eval {index}: {case.name} ... FAIL")
            for entry in missing:
                print(f"  - {entry}")
            print(f"  - Got: {sql}")
            failed += 1
        else:
            print(f"Eval {index}: {case.name} ... PASS")
            if args.show_sql:
                print(f"  - SQL: {sql}")
            passed += 1

    print(f"Results: {passed}/{passed + failed} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
