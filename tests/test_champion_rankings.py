import json
import os
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from champion_rankings import RiotCollector, ranking_scheduler, refresh_rankings
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

    async def test_collects_top_20_per_tier_and_reuses_shared_matches(self):
        calls = []
        tiers = ("challenger", "grandmaster", "master")
        entries = {
            tier: [{"puuid": f"{tier}{i}", "leaguePoints": i} for i in range(22)]
            for tier in tiers
        }
        participants = [
            {
                "puuid": f"{tier}{i}", "championName": "Ahri", "win": i % 2 == 0,
                "kills": 4, "deaths": 2, "assists": 2,
            }
            for tier in tiers
            for i in range(22)
        ]

        def handler(request):
            calls.append(request)
            path = request.url.path
            for tier in tiers:
                if f"{tier}leagues" in path:
                    return httpx.Response(200, json={"entries": entries[tier]})
            if "accounts/by-puuid" in path:
                puuid = path.rsplit("/", 1)[-1]
                return httpx.Response(200, json={"gameName": puuid, "tagLine": "NA1"})
            if path.endswith("/ids"):
                self.assertEqual(request.url.params["count"], "20")
                return httpx.Response(200, json=["NA1_shared"])
            return httpx.Response(200, json={"info": {"participants": participants}})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            rankings, count = await RiotCollector(client, "test-key", 0).collect()

        self.assertEqual(count, 60)
        self.assertEqual(len(rankings["ahri"]), 60)
        for tier in tiers:
            players = [player for player in rankings["ahri"] if player["tier"] == tier]
            self.assertEqual(len(players), 20)
            self.assertNotIn(f"{tier}0", [player["puuid"] for player in players])
            self.assertNotIn(f"{tier}1", [player["puuid"] for player in players])
        self.assertEqual(rankings["ahri"][0]["puuid"], "challenger20")
        self.assertEqual(rankings["ahri"][0]["score"], 0.75)
        self.assertEqual(sum(r.url.path.endswith("/NA1_shared") for r in calls), 1)

    async def test_deduplicates_players_across_tiers(self):
        requests = []

        def handler(request):
            requests.append(request)
            path = request.url.path
            if "leagues/by-queue" in path:
                return httpx.Response(200, json={"entries": [{"puuid": "p", "leaguePoints": 100}]})
            if "accounts/by-puuid" in path:
                return httpx.Response(200, json={"gameName": "Player", "tagLine": "NA1"})
            if path.endswith("/ids"):
                return httpx.Response(200, json=["NA1_1"])
            return httpx.Response(200, json={"info": {"participants": [{
                "puuid": "p", "championName": "Ahri", "win": True,
                "kills": 4, "deaths": 2, "assists": 2,
            }]}})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            rankings, count = await RiotCollector(client, "test-key", 0).collect()

        self.assertEqual(count, 1)
        self.assertEqual(len(rankings["ahri"]), 1)
        self.assertEqual(rankings["ahri"][0]["tier"], "challenger")
        self.assertEqual(sum("accounts/by-puuid" in request.url.path for request in requests), 1)

    async def test_all_empty_leaderboards_fail(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(200, json={"entries": []}))
        async with httpx.AsyncClient(transport=transport) as client:
            with self.assertRaisesRegex(RuntimeError, "empty.*leaderboards"):
                await RiotCollector(client, "test-key", 0).collect()

    async def test_failure_retains_complete_previous_snapshot(self):
        with self.sessions() as db:
            db.add(ChampionRankingSnapshot(
                id=1, players_json=json.dumps({"ahri": [{"game_name": "Old"}]}),
                updated_at="2026-01-01T00:00:00+00:00", status="ready", player_count=20,
            ))
            db.commit()
        def handler(request):
            if "challengerleagues" in request.url.path:
                return httpx.Response(200, json={"entries": [{"puuid": "p", "leaguePoints": 100}]})
            return httpx.Response(403)

        transport = httpx.MockTransport(handler)

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
            if "leagues/by-queue" in path:
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
            self.assertEqual(json.loads(snapshot.players_json)["monkeyking"][0]["tier"], "challenger")

    async def test_legacy_snapshot_refreshes_immediately_on_startup(self):
        with self.sessions() as db:
            db.add(ChampionRankingSnapshot(
                id=1, players_json=json.dumps({"ahri": [{"game_name": "Old"}]}),
                last_attempt_at="2099-01-01T00:00:00+00:00", status="ready", player_count=1,
            ))
            db.commit()
        with (
            patch("champion_rankings.SessionLocal", self.sessions),
            patch("champion_rankings.refresh_rankings", new_callable=AsyncMock) as refresh,
            patch("champion_rankings.asyncio.sleep", new_callable=AsyncMock) as sleep,
        ):
            refresh.side_effect = RuntimeError("stop scheduler")
            with self.assertRaisesRegex(RuntimeError, "stop scheduler"):
                await ranking_scheduler("test-key")
            refresh.assert_awaited_once_with("test-key")
            sleep.assert_not_awaited()

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

    async def test_profile_icon_endpoint_uses_summoner_icon_and_current_patch(self):
        import main

        with (
            patch.object(main, "DDRAGON_VERSION", "16.22.1"),
            patch.object(main.lol_watcher.summoner, "by_puuid", return_value={"profileIconId": 123}) as lookup,
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=main.app), base_url="http://test"
            ) as client:
                response = await client.get("/api/summoner/na1/player/profile-icon")
                invalid_region = await client.get("/api/summoner/invalid/player/profile-icon")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {
                "icon_url": "https://ddragon.leagueoflegends.com/cdn/16.22.1/img/profileicon/123.png"
            })
            self.assertEqual(invalid_region.status_code, 400)
            lookup.assert_called_once_with("na1", "player")

        with patch.object(main.lol_watcher.summoner, "by_puuid", return_value={}):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=main.app), base_url="http://test"
            ) as client:
                response = await client.get("/api/summoner/na1/player/profile-icon")
            self.assertEqual(response.status_code, 502)


if __name__ == "__main__":
    unittest.main()
