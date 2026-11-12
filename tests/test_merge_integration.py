import os
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, migrate_match_record_columns
from models import MatchRecord


class MergeIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        self.sessions = sessionmaker(bind=self.engine)

    def tearDown(self):
        self.engine.dispose()

    def test_existing_database_is_migrated_without_losing_rows(self):
        with self.engine.begin() as connection:
            connection.execute(text(
                "CREATE TABLE match_records (id INTEGER PRIMARY KEY, match_id VARCHAR, puuid VARCHAR)"
            ))
            connection.execute(text(
                "INSERT INTO match_records (id, match_id, puuid) VALUES (1, 'match', 'player')"
            ))
        migrate_match_record_columns(self.engine)
        migrate_match_record_columns(self.engine)
        columns = {column["name"] for column in inspect(self.engine).get_columns("match_records")}
        self.assertTrue({
            "cs_total", "cs_per_min", "vision_score", "role_played",
            "primary_style", "keystone_id", "sub_style",
        }.issubset(columns))
        with self.engine.connect() as connection:
            row = connection.execute(text(
                "SELECT match_id, puuid, role_played FROM match_records WHERE id = 1"
            )).one()
        self.assertEqual(tuple(row), ("match", "player", None))

    def test_batch_cache_enriches_legacy_rows_and_adds_other_players(self):
        with patch.dict(os.environ, {"RIOT_API_KEY": "test-key"}):
            import router

        Base.metadata.create_all(self.engine)
        with self.sessions() as db:
            db.add(MatchRecord(match_id="match", puuid="p0", champion_name="Old"))
            db.commit()
            participants = [{
                "puuid": f"p{i}", "championName": "Ahri", "win": True,
                "kills": 4, "deaths": 2, "assists": 3,
                "individualPosition": "MIDDLE", "totalMinionsKilled": 100,
            } for i in range(10)]
            match = {"info": {
                "participants": participants, "gameDuration": 1200,
                "gameMode": "CLASSIC", "queueId": 420,
            }}
            with (
                patch.object(router.lol_watcher.match, "matchlist_by_puuid", return_value=["match"]),
                patch.object(router.lol_watcher.match, "by_id", return_value=match) as fetch,
                patch.object(router.time, "sleep"),
            ):
                result = router.batch_cache_matches("na", "p0", count=5, db=db)
                self.assertEqual(result["puuid"], "p0")
                self.assertEqual(result["newly_cached_matches"], 1)
                rows = db.query(MatchRecord).filter_by(match_id="match").all()
                self.assertEqual(len(rows), 10)
                self.assertEqual(next(row for row in rows if row.puuid == "p0").role_played, "MIDDLE")
                router.batch_cache_matches("na", "p0", count=5, db=db)
                fetch.assert_called_once()

    def test_existing_match_list_response_is_preserved(self):
        with patch.dict(os.environ, {"RIOT_API_KEY": "test-key"}):
            import router
        with patch.object(router.lol_watcher.match, "matchlist_by_puuid", return_value=["match"]) as fetch:
            response = router.get_player_matches("na", "p0", count=5, start=2, queue=490)
        self.assertEqual(response["mode_name"], "Quickplay / Swiftplay")
        self.assertEqual(response["start_index"], 2)
        self.assertEqual(response["count"], 1)
        fetch.assert_called_once_with(region="americas", puuid="p0", start=2, count=5)


if __name__ == "__main__":
    unittest.main()
