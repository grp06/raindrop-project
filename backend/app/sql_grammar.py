from functools import lru_cache

from lark import Lark, UnexpectedInput


_SQL_GRAMMAR = r"""
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

column: AGE
      | GENDER
      | HEIGHT_CM
      | WEIGHT_KG
      | BODY_FAT_PCT
      | DIASTOLIC
      | SYSTOLIC
      | GRIP_FORCE
      | SIT_AND_BEND_FORWARD_CM
      | SITUPS_COUNT
      | BROAD_JUMP_CM
      | FITNESS_CLASS

numeric_column: AGE
              | HEIGHT_CM
              | WEIGHT_KG
              | BODY_FAT_PCT
              | DIASTOLIC
              | SYSTOLIC
              | GRIP_FORCE
              | SIT_AND_BEND_FORWARD_CM
              | SITUPS_COUNT
              | BROAD_JUMP_CM

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
DEFAULT_DB: "default"
BODY_PERFORMANCE_TABLE: "bodyPerformance"
AGE: "age"
GENDER: "gender"
HEIGHT_CM: "height_cm"
WEIGHT_KG: "weight_kg"
BODY_FAT_PCT: "body_fat_pct"
DIASTOLIC: "diastolic"
SYSTOLIC: "systolic"
GRIP_FORCE: "grip_force"
SIT_AND_BEND_FORWARD_CM: "sit_and_bend_forward_cm"
SITUPS_COUNT: "situps_count"
BROAD_JUMP_CM: "broad_jump_cm"
FITNESS_CLASS: "fitness_class"

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
