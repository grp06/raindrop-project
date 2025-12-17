import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.sql_generation import generate_sql


PROMPT = "Compare average grip_force between genders."


def main() -> None:
    sql = generate_sql(PROMPT)
    print(sql)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Generation failed: {exc}", file=sys.stderr)
        sys.exit(1)
