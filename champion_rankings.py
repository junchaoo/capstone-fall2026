import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import httpx

from database import SessionLocal
from models import ChampionRankingSnapshot

logger = logging.getLogger(__name__)

PLAYER_LIMIT = 20
MATCH_LIMIT = 20
REFRESH_INTERVAL = timedelta(hours=6)
FAILURE_RETRY_INTERVAL = timedelta(minutes=15)
REQUEST_INTERVAL_SECONDS = 1.3


def utc_now():
    return datetime.now(timezone.utc)


def get_snapshot(db):
    snapshot = db.get(ChampionRankingSnapshot, 1)
    if snapshot is None:
        snapshot = ChampionRankingSnapshot(id=1, players_json="{}", status="pending", player_count=0)
        db.add(snapshot)
        db.flush()
    return snapshot


class RiotCollector:
    def __init__(self, client, api_key, request_interval=REQUEST_INTERVAL_SECONDS):
        self.client = client
        self.api_key = api_key
        self.request_interval = request_interval

    async def get(self, host, path, params=None):
        if not self.api_key:
            raise RuntimeError("RIOT_API_KEY is not configured.")

        for attempt in range(4):
            await asyncio.sleep(self.request_interval)
            response = await self.client.get(
                f"https://{host}.api.riotgames.com{path}",
                params=params,
                headers={"X-Riot-Token": self.api_key},
            )
            if response.status_code == 429:
                if attempt == 3:
                    raise RuntimeError("Riot API rate limit exceeded after retries.")
                retry_after = response.headers.get("Retry-After", "120")
                try:
                    delay = max(1, int(retry_after))
                except ValueError:
                    delay = 120
                await asyncio.sleep(delay)
                continue
            if response.is_error:
                if response.status_code in (401, 403):
                    raise RuntimeError(
                        f"Riot API rejected the key (HTTP {response.status_code}); check or renew RIOT_API_KEY."
                    )
                raise RuntimeError(f"Riot API request failed (HTTP {response.status_code}).")
            return response.json()

        raise RuntimeError("Riot API request failed.")

    async def collect(self):
        league = await self.get(
            "na1", "/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5"
        )
        entries = sorted(
            league["entries"], key=lambda entry: (-entry["leaguePoints"], entry.get("puuid", ""))
        )[:PLAYER_LIMIT]
        if not entries:
            raise RuntimeError("Riot API returned an empty Challenger leaderboard.")
        if any(not entry.get("puuid") for entry in entries):
            raise RuntimeError("Challenger leaderboard entries did not include PUUIDs.")

        matches_by_id = {}
        rankings = defaultdict(list)
        for entry in entries:
            puuid = entry["puuid"]
            encoded_puuid = quote(puuid, safe="")
            account = await self.get(
                "americas", f"/riot/account/v1/accounts/by-puuid/{encoded_puuid}"
            )
            if not account.get("gameName") or not account.get("tagLine"):
                raise RuntimeError("Riot API returned an account without a Riot ID.")
            match_ids = await self.get(
                "americas",
                f"/lol/match/v5/matches/by-puuid/{encoded_puuid}/ids",
                {"start": 0, "count": MATCH_LIMIT},
            )
            stats = defaultdict(lambda: {"games": 0, "wins": 0, "kills": 0, "deaths": 0, "assists": 0})
            for match_id in dict.fromkeys(match_ids):
                if match_id not in matches_by_id:
                    matches_by_id[match_id] = await self.get(
                        "americas", f"/lol/match/v5/matches/{quote(match_id, safe='')}"
                    )
                participants = matches_by_id[match_id]["info"]["participants"]
                participant = next((p for p in participants if p["puuid"] == puuid), None)
                if participant is None:
                    raise RuntimeError("A match did not contain its requested player.")
                champion = participant["championName"].lower()
                stat = stats[champion]
                stat["games"] += 1
                stat["wins"] += int(participant["win"])
                stat["kills"] += participant["kills"]
                stat["deaths"] += participant["deaths"]
                stat["assists"] += participant["assists"]

            for champion, stat in stats.items():
                games = stat["games"]
                winrate = round(stat["wins"] * 100 / games, 1)
                kda = round((stat["kills"] + stat["assists"]) / max(1, stat["deaths"]), 2)
                score = round(games * (winrate / 100 + min(kda, 6) / 6) / 2, 2)
                rankings[champion].append({
                    "puuid": puuid,
                    "game_name": account["gameName"],
                    "tag_line": account["tagLine"],
                    "league_points": entry["leaguePoints"],
                    "games_played": games,
                    "wins": stat["wins"],
                    "winrate": winrate,
                    "kda": kda,
                    "score": score,
                })

        for players in rankings.values():
            players.sort(key=lambda player: (
                -player["score"], -player["games_played"], -player["league_points"], player["puuid"]
            ))
        return dict(rankings), len(entries)


async def refresh_rankings(api_key, session_factory=SessionLocal, transport=None, request_interval=REQUEST_INTERVAL_SECONDS):
    with session_factory() as db:
        snapshot = get_snapshot(db)
        snapshot.last_attempt_at = utc_now().isoformat()
        snapshot.status = "updating"
        snapshot.error = None
        db.commit()

    try:
        async with httpx.AsyncClient(timeout=20, transport=transport) as client:
            rankings, player_count = await RiotCollector(client, api_key, request_interval).collect()
        with session_factory() as db:
            snapshot = get_snapshot(db)
            snapshot.players_json = json.dumps(rankings)
            snapshot.player_count = player_count
            snapshot.updated_at = utc_now().isoformat()
            snapshot.status = "ready"
            snapshot.error = None
            db.commit()
    except asyncio.CancelledError:
        with session_factory() as db:
            snapshot = get_snapshot(db)
            snapshot.status = "error"
            snapshot.error = "Ranking refresh was interrupted."
            db.commit()
        raise
    except (httpx.HTTPError, RuntimeError, KeyError, TypeError, ValueError) as error:
        logger.warning("Champion ranking refresh failed: %s", error)
        with session_factory() as db:
            snapshot = get_snapshot(db)
            snapshot.status = "error"
            snapshot.error = (
                str(error) if isinstance(error, RuntimeError)
                else "Ranking refresh failed. Check the backend logs."
            )
            db.commit()


async def ranking_scheduler(api_key):
    first_run = True
    while True:
        with SessionLocal() as db:
            snapshot = get_snapshot(db)
            if snapshot.status == "updating":
                snapshot.status = "error"
                snapshot.error = "Previous ranking refresh was interrupted."
            last_attempt = snapshot.last_attempt_at
            if first_run and snapshot.status != "ready":
                last_attempt = None
            interval = REFRESH_INTERVAL if snapshot.status == "ready" else FAILURE_RETRY_INTERVAL
            db.commit()
        first_run = False
        if last_attempt:
            next_attempt = datetime.fromisoformat(last_attempt) + interval
            await asyncio.sleep(max(0, (next_attempt - utc_now()).total_seconds()))
        await refresh_rankings(api_key)
