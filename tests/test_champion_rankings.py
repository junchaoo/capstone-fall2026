import json
import os
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from champion_rankings import RiotCollector, refresh_rankings
from database import Base
from models import ChampionRankingSnapshot


class ChampionRankingsTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)

    def tearDown(self):
        self.engine.dispose()

    async def test_collects_top_20_and_reuses_shared_matches(self):
        calls = []
        entries = [{"puuid": f"p{i}", "leaguePoints": i} for i in range(22)]
        participants = [
            {
                "puuid": f"p{i}", "championName": "Ahri", "win": i % 2 == 0,
                "kills": 4, "deaths": 2, "assists": 2,
            }
            for i in range(22)
        ]

        def handler(request):
            calls.append(request)
            path = request.url.path
            if "challengerleagues" in path:
                return httpx.Response(200, json={"entries": entries})
            if "accounts/by-puuid" in path:
                puuid = path.rsplit("/", 1)[-1]
                return httpx.Response(200, json={"gameName": puuid, "tagLine": "NA1"})
            if path.endswith("/ids"):
                self.assertEqual(request.url.params["count"], "20")
                return httpx.Response(200, json=["NA1_shared"])
            return httpx.Response(200, json={"info": {"participants": participants}})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            rankings, count = await RiotCollector(client, "test-key", 0).collect()

        self.assertEqual(count, 20)
        self.assertEqual(len(rankings["ahri"]), 20)
        self.assertNotIn("p0", [p["puuid"] for p in rankings["ahri"]])
        self.assertNotIn("p1", [p["puuid"] for p in rankings["ahri"]])
        self.assertEqual(rankings["ahri"][0]["puuid"], "p20")
        self.assertEqual(rankings["ahri"][0]["score"], 0.75)
        self.assertEqual(sum(r.url.path.endswith("/NA1_shared") for r in calls), 1)

    async def test_failure_retains_complete_previous_snapshot(self):
        with self.sessions() as db:
            db.add(ChampionRankingSnapshot(
                id=1, players_json=json.dumps({"ahri": [{"game_name": "Old"}]}),
                updated_at="2026-01-01T00:00:00+00:00", status="ready", player_count=20,
            ))
            db.commit()
        transport = httpx.MockTransport(lambda request: httpx.Response(403))

        await refresh_rankings("expired-key", self.sessions, transport, 0)

        with self.sessions() as db:
            snapshot = db.get(ChampionRankingSnapshot, 1)
            self.assertEqual(snapshot.status, "error")
            self.assertEqual(snapshot.updated_at, "2026-01-01T00:00:00+00:00")
            self.assertEqual(json.loads(snapshot.players_json)["ahri"][0]["game_name"], "Old")
            self.assertIn("Riot API rejected the key", snapshot.error)

    async def test_refresh_publishes_snapshot_only_after_success(self):
        def handler(request):
            path = request.url.path
            if "challengerleagues" in path:
                return httpx.Response(200, json={"entries": [{"puuid": "p", "leaguePoints": 1000}]})
            if "accounts/by-puuid" in path:
                return httpx.Response(200, json={"gameName": "Player", "tagLine": "NA1"})
            if path.endswith("/ids"):
                return httpx.Response(200, json=["NA1_1"])
            return httpx.Response(200, json={"info": {"participants": [{
                "puuid": "p", "championName": "MonkeyKing", "win": True,
                "kills": 4, "deaths": 2, "assists": 2,
            }]}})

        await refresh_rankings("test-key", self.sessions, httpx.MockTransport(handler), 0)
        with self.sessions() as db:
            snapshot = db.get(ChampionRankingSnapshot, 1)
            self.assertEqual(snapshot.status, "ready")
            self.assertEqual(snapshot.player_count, 1)
            self.assertIsNotNone(snapshot.updated_at)
            self.assertEqual(json.loads(snapshot.players_json)["monkeyking"][0]["game_name"], "Player")

    async def test_rate_limit_uses_retry_after(self):
        responses = iter([
            httpx.Response(429, headers={"Retry-After": "9"}),
            httpx.Response(200, json={"ok": True}),
        ])
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: next(responses))) as client:
            with patch("champion_rankings.asyncio.sleep", new_callable=AsyncMock) as sleep:
                result = await RiotCollector(client, "test-key", 0).get("na1", "/test")
        self.assertEqual(result, {"ok": True})
        sleep.assert_any_await(9)

    async def test_endpoint_uses_champion_id_and_does_not_mix_profile_cache(self):
        original_dir = os.getcwd()
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                os.chdir(temp_dir)
                with patch("dotenv.load_dotenv", return_value=True), patch.dict(os.environ, {"RIOT_API_KEY": "test-key"}):
                    import main
            finally:
                os.chdir(original_dir)
            main.CHAMPION_MAP = {62: {"id": "MonkeyKing", "name": "Wukong", "icon": "icon"}}
            with self.sessions() as db:
                db.add(ChampionRankingSnapshot(
                    id=1, players_json=json.dumps({"monkeyking": [{"game_name": "Sample"}]}),
                    updated_at="2026-01-01T00:00:00+00:00", status="ready", player_count=1,
                ))
                db.commit()
                response = main.get_champion_top_players("Wukong", 5, db)
            self.assertEqual(response["players"][0]["game_name"], "Sample")
            self.assertEqual(response["player_count"], 1)
            def override_db():
                with self.sessions() as db:
                    yield db
            main.app.dependency_overrides[main.get_db] = override_db
            try:
                async with httpx.AsyncClient(
                    transport=httpx.ASGITransport(app=main.app), base_url="http://test"
                ) as client:
                    http_response = await client.get("/api/champions/Wukong/top-players?limit=5")
                self.assertEqual(http_response.status_code, 200)
                self.assertEqual(http_response.json()["players"][0]["game_name"], "Sample")
            finally:
                main.app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
