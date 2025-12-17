from functools import lru_cache

from lark import Lark, UnexpectedInput

from .schema import COLUMNS, DATABASE, NUMERIC_COLUMNS, TABLE


def _token(name: str) -> str:
    return name.upper()


def _rule(name: str, tokens: tuple[str, ...]) -> str:
    lines = [f"{name}: {tokens[0]}"]
    for token in tokens[1:]:
        lines.append(f"      | {token}")
    return "\n".join(lines)


COLUMN_TOKENS = tuple(_token(column) for column in COLUMNS)
NUMERIC_TOKENS = tuple(_token(column) for column in NUMERIC_COLUMNS)
COLUMN_RULE = _rule("column", COLUMN_TOKENS)
NUMERIC_RULE = _rule("numeric_column", NUMERIC_TOKENS)
TOKEN_DEFS = "\n".join(f'{token}: "{column}"' for token, column in zip(COLUMN_TOKENS, COLUMNS))

_SQL_GRAMMAR = f"""
start: select_stmt

select_stmt: SELECT select_list FROM table_name where_clause? group_by_clause? order_by_clause? limit_clause?

select_list: select_item ("," select_item)*

agg_expr: sum_expr
        | avg_expr
        | min_expr
        | max_expr
        | count_expr

sum_expr: SUM "(" numeric_column ")" alias?
avg_expr: AVG "(" numeric_column ")" alias?
min_expr: MIN "(" numeric_column ")" alias?
max_expr: MAX "(" numeric_column ")" alias?
count_expr: COUNT "(" column ")" alias?
alias: AS IDENTIFIER

select_item: agg_expr
           | column

column_list: column ("," column)*

where_clause: WHERE condition

condition: comparison (AND comparison)*

comparison: column comparator literal
          | column IN "(" literal_list ")"

literal_list: literal ("," literal)*

comparator: "="
          | ">="
          | "<="
          | ">"
          | "<"

limit_clause: LIMIT INT

group_by_clause: GROUP BY column_list

order_by_clause: ORDER BY order_list
order_list: order_item ("," order_item)*
order_item: column order_dir?
          | IDENTIFIER order_dir?
order_dir: ASC | DESC

agg_func: SUM
        | COUNT
        | AVG
        | MIN
        | MAX

table_name: DEFAULT_DB "." BODY_PERFORMANCE_TABLE

{COLUMN_RULE}

{NUMERIC_RULE}

literal: string_literal
       | number_literal

string_literal: SINGLE_QUOTED
number_literal: SIGNED_NUMBER

IDENTIFIER: /[A-Za-z_][A-Za-z0-9_]*/

SINGLE_QUOTED: "'" /[^']*/ "'"

SELECT: "SELECT"
FROM: "FROM"
WHERE: "WHERE"
GROUP: "GROUP"
BY: "BY"
ORDER: "ORDER"
ASC: "ASC"
DESC: "DESC"
LIMIT: "LIMIT"
AS: "AS"
IN: "IN"
SUM: "SUM"
COUNT: "COUNT"
AVG: "AVG"
MIN: "MIN"
MAX: "MAX"
AND: "AND"
DEFAULT_DB: "{DATABASE}"
BODY_PERFORMANCE_TABLE: "{TABLE}"
{TOKEN_DEFS}

%import common.INT
%import common.SIGNED_NUMBER
%import common.WS_INLINE
%ignore WS_INLINE
"""


def sql_grammar() -> str:
    return _SQL_GRAMMAR


@lru_cache(maxsize=1)
def _parser() -> Lark:
    return Lark(_SQL_GRAMMAR, start="start", parser="lalr")


def validate_sql(sql: str) -> None:
    text = sql.strip()
    if not text:
        raise ValueError("sql is required")
    try:
        _parser().parse(text)
    except UnexpectedInput as exc:
        raise ValueError("SQL does not match the allowed grammar") from exc
