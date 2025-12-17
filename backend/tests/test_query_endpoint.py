import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


class TestQueryEndpoint(unittest.TestCase):
    def test_query_success(self):
        client = TestClient(app)
        with patch("app.main.generate_sql") as mock_generate_sql, patch("app.main.execute_sql") as mock_execute_sql:
            mock_generate_sql.return_value = "SELECT 1"
            mock_execute_sql.return_value = {"columns": ["col"], "rows": [{"col": 1}]}
            response = client.post("/api/query", json={"prompt": "hi"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sql"], "SELECT 1")
        self.assertEqual(data["columns"], ["col"])
        self.assertEqual(data["rows"], [{"col": 1}])

    def test_query_generation_error(self):
        client = TestClient(app)
        with patch("app.main.generate_sql") as mock_generate_sql, patch("app.main.execute_sql") as mock_execute_sql:
            mock_generate_sql.side_effect = ValueError("invalid prompt")
            response = client.post("/api/query", json={"prompt": "hi"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["sql"], "")
        self.assertEqual(data["rows"], [])
        self.assertIn("invalid prompt", data["error"])
