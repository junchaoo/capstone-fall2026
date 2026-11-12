import asyncio
import json
import os
from collections import Counter
from contextlib import asynccontextmanager, suppress
from champion_rankings import ranking_scheduler
from database import engine, get_db, migrate_match_record_columns
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import itr
from itr import load_datadragon_mappings, CORE_QUEUES, get_champion_details, get_item_details
from riotwatcher import ApiError

# Load environment variables from .env file
load_dotenv(override=True)  # .env wins over stale keys exported in the shell
RIOT_API_KEY = os.getenv("RIOT_API_KEY")
from router import router, CLUSTER_MAPPING, lol_watcher

# Automatically initialize SQLite database tables
models.Base.metadata.create_all(bind=engine)
migrate_match_record_columns(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await load_datadragon_mappings()
    scheduler = asyncio.create_task(ranking_scheduler(RIOT_API_KEY))
    try:
        yield
    finally:
        scheduler.cancel()
        with suppress(asyncio.CancelledError):
            await scheduler

app = FastAPI(
    title="League of Legends Core Analytics Backend",
    lifespan=lifespan
)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)

app.include_router(router)

@app.get("/")
def read_root():
    return {
        "status": "Backend server is online!",
        "supported_core_queues": CORE_QUEUES,
    }


# Stores match details and uses get_item_details() and get_champion_details()
@app.get("/api/match/{region}/{match_id}/{puuid}/outcome")
def get_match_outcome(
    region: str, match_id: str, puuid: str, db: Session = Depends(get_db)
):
    clean_puuid = puuid.strip()
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")

    # Check local SQLite database cache first
    cached_match = (
        db.query(models.MatchRecord)
        .filter(
            models.MatchRecord.match_id == match_id,
            models.MatchRecord.puuid == clean_puuid,
        )
        .first()
    )

    if cached_match:
        raw_items = json.loads(cached_match.items_json)
        return {
            "source": "database_cache",
            "data": {
                "match_id": cached_match.match_id,
                "puuid": cached_match.puuid,
                "champion": get_champion_details(cached_match.champion_name),
                "outcome": cached_match.outcome,
                "win": cached_match.win,
                "kills": cached_match.kills,
                "deaths": cached_match.deaths,
                "assists": cached_match.assists,
                "kda_ratio": cached_match.kda_ratio,
                "items": get_item_details(raw_items),
                "game_mode": cached_match.game_mode,
                "game_duration_seconds": cached_match.game_duration_seconds,
            },
        }

    # Query Riot API if missing locally
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

        kda_ratio = round((kills + assists) / max(1, deaths), 2)
        raw_items = [s_player[f"item{i}"] for i in range(7)]

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
            items_json=json.dumps(raw_items),
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
                "champion": get_champion_details(new_match.champion_name),
                "outcome": new_match.outcome,
                "win": new_match.win,
                "kills": new_match.kills,
                "deaths": new_match.deaths,
                "assists": new_match.assists,
                "kda_ratio": new_match.kda_ratio,
                "items": get_item_details(raw_items),
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


# Computes stats filtered across Draft (400), Flex (440), ARAM (450), and Swiftplay (490)
@app.get("/api/champions/{champion_name}/top-players")
def get_champion_top_players(
    champion_name: str, limit: int = 5, db: Session = Depends(get_db)
):
    """Return the latest high-tier sample, independent of profile caches."""
    limit = max(1, min(limit, 20))
    details = get_champion_details(champion_name)
    champion_key = champion_name.strip().lower()
    for champion in itr.CHAMPION_MAP.values():
        if champion_key in (champion["name"].lower(), champion["id"].lower()):
            champion_key = champion["id"].lower()
            break
    snapshot = db.get(models.ChampionRankingSnapshot, 1)
    if snapshot is None:
        return {
            "champion": details, "players": [], "status": "pending",
            "updated_at": None, "last_attempt_at": None, "error": None, "player_count": 0,
        }
    rankings = json.loads(snapshot.players_json)
    return {
        "champion": details,
        "players": rankings.get(champion_key, [])[:limit],
        "status": snapshot.status,
        "updated_at": snapshot.updated_at,
        "last_attempt_at": snapshot.last_attempt_at,
        "error": snapshot.error,
        "player_count": snapshot.player_count,
    }


@app.get("/api/analytics/{puuid}")
def get_player_analytics(
    puuid: str, queue: int | None = None, db: Session = Depends(get_db)
):
    clean_puuid = puuid.strip()

    # Start building the query
    query = db.query(models.MatchRecord).filter(models.MatchRecord.puuid == clean_puuid)

    # Filter directly by queue_id if provided and valid
    if queue is not None and queue in CORE_QUEUES:
        query = query.filter(models.MatchRecord.queue_id == queue)

    matches = query.all()

    if not matches:
        queue_name = CORE_QUEUES.get(queue, "this queue") if queue else "this player"
        raise HTTPException(
            status_code=404,
            detail=f"No cached games found in local database for {queue_name}.",
        )

    total_games = len(matches)
    wins = sum(1 for m in matches if m.win)
    losses = total_games - wins
    winrate = round((wins / total_games) * 100, 1)

    total_kills = sum(m.kills for m in matches)
    total_deaths = sum(m.deaths for m in matches)
    total_assists = sum(m.assists for m in matches)

    avg_kills = round(total_kills / total_games, 1)
    avg_deaths = round(total_deaths / total_games, 1)
    avg_assists = round(total_assists / total_games, 1)
    overall_kda = round((total_kills + total_assists) / max(1, total_deaths), 2)

    # Top Champions played breakdown with champion icon details
    champ_counts = Counter(m.champion_name for m in matches)
    champ_stats = []

    for champ_name, count in champ_counts.most_common(5):
        champ_matches = [m for m in matches if m.champion_name == champ_name]
        champ_wins = sum(1 for m in champ_matches if m.win)
        champ_winrate = round((champ_wins / count) * 100, 1)

        champ_stats.append(
            {
                "champion": get_champion_details(champ_name),
                "games_played": count,
                "wins": champ_wins,
                "losses": count - champ_wins,
                "winrate": champ_winrate,
            }
        )

    mode_label = CORE_QUEUES.get(queue, "All Core Modes")

    return {
        "puuid": clean_puuid,
        "active_mode_filter": mode_label,
        "sample_size": total_games,
        "summary": {
            "wins": wins,
            "losses": losses,
            "winrate": winrate,
            "overall_kda": overall_kda,
            "averages": {
                "kills": avg_kills,
                "deaths": avg_deaths,
                "assists": avg_assists,
            },
        },
        "top_champions": champ_stats,
    }