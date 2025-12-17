import unittest

from app.sql_grammar import validate_sql


class TestSqlGrammar(unittest.TestCase):
    def test_accepts_milestone_query(self):
        sql = (
            "SELECT SUM(value) FROM default.IEA_Global_EV_Data_2024 "
            "WHERE region = 'USA' AND parameter = 'EV sales' AND year = 2023"
        )
        validate_sql(sql)

    def test_accepts_group_by_in_and_range(self):
        sql = (
            "SELECT region, year, SUM(value) AS ev_stock "
            "FROM default.IEA_Global_EV_Data_2024 "
            "WHERE parameter = 'EV stock' AND category = 'Historical' AND mode = 'Cars' "
            "AND region IN ('China', 'USA') AND year >= 2019 AND year <= 2023 "
            "GROUP BY region, year "
            "ORDER BY year, region"
        )
        validate_sql(sql)

    def test_rejects_drop_table(self):
        with self.assertRaises(ValueError):
            validate_sql("DROP TABLE default.IEA_Global_EV_Data_2024")

    def test_rejects_select_star(self):
        with self.assertRaises(ValueError):
            validate_sql("SELECT * FROM default.IEA_Global_EV_Data_2024 WHERE year = 2023")

    def test_rejects_other_table(self):
        with self.assertRaises(ValueError):
            validate_sql("SELECT SUM(value) FROM other.table WHERE year = 2023")
