import unittest

from app.sql_grammar import validate_sql


class TestSqlGrammar(unittest.TestCase):
    def test_accepts_simple_filter(self):
        sql = (
            "SELECT AVG(grip_force) FROM default.bodyPerformance "
            "WHERE gender = 'F'"
        )
        validate_sql(sql)

    def test_accepts_group_by_in_and_range(self):
        sql = (
            "SELECT fitness_class, AVG(situps_count) AS avg_situps "
            "FROM default.bodyPerformance "
            "WHERE age >= 30 AND age <= 40 AND gender IN ('F', 'M') "
            "GROUP BY fitness_class "
            "ORDER BY avg_situps DESC LIMIT 5"
        )
        validate_sql(sql)

    def test_rejects_drop_table(self):
        with self.assertRaises(ValueError):
            validate_sql("DROP TABLE default.bodyPerformance")

    def test_rejects_select_star(self):
        with self.assertRaises(ValueError):
            validate_sql("SELECT * FROM default.bodyPerformance WHERE age = 30")

    def test_rejects_other_table(self):
        with self.assertRaises(ValueError):
            validate_sql("SELECT AVG(weight_kg) FROM other.table WHERE age = 30")
