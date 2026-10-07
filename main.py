import json
import os
from database import Base, engine, get_db
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
import models
from riotwatcher import ApiError, LolWatcher, RiotWatcher
from sqlalchemy.orm import Session

# Load environment variables from .env file
load_dotenv()
RIOT_API_KEY = os.getenv("RIOT_API_KEY")

# Automatically initialize SQLite database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="League of Legends Analytics Backend")

# Initialize Riot API wrappers
riot_watcher = RiotWatcher(RIOT_API_KEY)
lol_watcher = LolWatcher(RIOT_API_KEY)

# Regional cluster routing (Match-v5 & Account-v1)
CLUSTER_MAPPING = {
    "americas": "americas",
    "na": "americas",
    "na1": "americas",
    "br1": "americas",
    "europe": "europe",
    "euw1": "europe",
    "asia": "asia",
    "kr": "asia",
}

# Platform routing codes (Summoner-v4)
PLATFORM_MAPPING = {
    "americas": "na1",
    "na": "na1",
    "na1": "na1",
    "br1": "br1",
    "europe": "euw1",
    "euw1": "euw1",
    "asia": "kr",
    "kr": "kr",
}


@app.get("/")
def read_root():
    return {"status": "Backend server is online!"}


# Player Endpoint: Checks SQLite cache first before querying Riot Account API
@app.get("/api/player/{region}/{game_name}/{tag_line}")
def get_or_fetch_player(
    region: str, game_name: str, tag_line: str, db: Session = Depends(get_db)
):
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")
    platform_region = PLATFORM_MAPPING.get(clean_region, "na1")

    # 1. Check local SQLite cache first (case-insensitive search)
    db_player = (
        db.query(models.Player)
        .filter(
            models.Player.game_name.ilike(game_name),
            models.Player.tag_line.ilike(tag_line),
        )
        .first()
    )

    if db_player:
        return {"source": "database_cache", "data": db_player}

    # 2. Fetch from Riot API if missing in local DB
    try:
        account = riot_watcher.account.by_riot_id(
            cluster_region, game_name, tag_line
        )

        db_player = models.Player(
            puuid=account["puuid"],
            game_name=account["gameName"],
            tag_line=account["tagLine"],
            summoner_level=0,
        )

        db.add(db_player)
        db.commit()
        db.refresh(db_player)

    except ApiError as err:
        status_code = err.response.status_code if hasattr(err, "response") else 400
        print(f"\n[RIOT API ERROR - Player Lookup] Status: {status_code} | Details: {err}\n")
        raise HTTPException(
            status_code=status_code,
            detail=f"Riot API Error ({status_code}): Could not fetch account for {game_name}#{tag_line}",
        )

    # Hydrate summoner level using platform region
    if db_player.summoner_level == 0:
        try:
            summoner_info = lol_watcher.summoner.by_puuid(
                platform_region, db_player.puuid
            )
            db_player.summoner_level = summoner_info["summonerLevel"]
            db.commit()
            db.refresh(db_player)
        except ApiError as err:
            print(f"[RIOT API WARNING - Summoner Level] Could not fetch level: {err}")

    return {"source": "live_api_fetch", "data": db_player}


# Match List Endpoint: Fetches recent match IDs
@app.get("/api/matches/{region}/{puuid}")
def get_player_matches(region: str, puuid: str, count: int = 5):
    clean_puuid = puuid.strip()
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")

    try:
        match_ids = lol_watcher.match.matchlist_by_puuid(
            region=cluster_region,
            puuid=clean_puuid,
            count=count
        )
        return {"puuid": clean_puuid, "count": count, "match_ids": match_ids}

    except ApiError as err:
        status_code = err.response.status_code if hasattr(err, "response") else 400
        print(f"\n[RIOT API ERROR - Matchlist] Status: {status_code} | Details: {err}\n")
        raise HTTPException(
            status_code=status_code,
            detail=f"Riot API Error ({status_code}): Could not fetch match list"
        )


# Match Outcome Endpoint: Cache-First Architecture with automatic SQLite persistence
@app.get("/api/match/{region}/{match_id}/{puuid}/outcome")
def get_match_outcome(
    region: str, match_id: str, puuid: str, db: Session = Depends(get_db)
):
    clean_puuid = puuid.strip()
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")

    # 1. STEP 1: Check local SQLite database cache first (Rate Limit Shield)
    cached_match = (
        db.query(models.MatchRecord)
        .filter(
            models.MatchRecord.match_id == match_id,
            models.MatchRecord.puuid == clean_puuid,
        )
        .first()
    )

    if cached_match:
        return {
            "source": "database_cache",
            "data": {
                "match_id": cached_match.match_id,
                "puuid": cached_match.puuid,
                "champion_name": cached_match.champion_name,
                "outcome": cached_match.outcome,
                "win": cached_match.win,
                "kills": cached_match.kills,
                "deaths": cached_match.deaths,
                "assists": cached_match.assists,
                "kda_ratio": cached_match.kda_ratio,
                "items": json.loads(cached_match.items_json),
                "game_mode": cached_match.game_mode,
                "game_duration_seconds": cached_match.game_duration_seconds,
            },
        }

    # 2. STEP 2: Query Riot API if missing locally
    try:
        match_data = lol_watcher.match.by_id(cluster_region, match_id)
        info = match_data["info"]
        players = info["participants"]

        s_player = next((p for p in players if p["puuid"] == clean_puuid), None)

        if s_player is None:
            raise HTTPException(
                status_code=404,
                detail="Player PUUID was not found in this match participant list",
            )

        is_win = s_player["win"]
        kills = s_player["kills"]
        deaths = s_player["deaths"]
        assists = s_player["assists"]

        # Server-side business logic: Safe K/DA ratio calculation
        kda_ratio = round((kills + assists) / max(1, deaths), 2)
        items = [s_player[f"item{i}"] for i in range(7)]

        # 3. STEP 3: Save newly fetched record directly into SQLite DB
        new_match = models.MatchRecord(
            match_id=match_id,
            puuid=clean_puuid,
            champion_name=s_player["championName"],
            outcome="Victory" if is_win else "Defeat",
            win=is_win,
            kills=kills,
            deaths=deaths,
            assists=assists,
            kda_ratio=kda_ratio,
            items_json=json.dumps(items),
            game_mode=info["gameMode"],
            game_duration_seconds=info["gameDuration"],
        )
        db.add(new_match)
        db.commit()
        db.refresh(new_match)

        return {
            "source": "live_api_fetch",
            "data": {
                "match_id": new_match.match_id,
                "puuid": new_match.puuid,
                "champion_name": new_match.champion_name,
                "outcome": new_match.outcome,
                "win": new_match.win,
                "kills": new_match.kills,
                "deaths": new_match.deaths,
                "assists": new_match.assists,
                "kda_ratio": new_match.kda_ratio,
                "items": items,
                "game_mode": new_match.game_mode,
                "game_duration_seconds": new_match.game_duration_seconds,
            },
        }

    except ApiError as err:
        status_code = err.response.status_code if hasattr(err, "response") else 400
        print(f"\n[RIOT API ERROR - Match Details] Status: {status_code} | Details: {err}\n")
        raise HTTPException(
            status_code=status_code,
            detail=f"Riot API Error ({status_code}): Could not fetch match details for {match_id}",
        )