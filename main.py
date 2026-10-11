import json
import os
from collections import Counter
from contextlib import asynccontextmanager
import httpx
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

# Initialize Riot API wrappers
riot_watcher = RiotWatcher(RIOT_API_KEY)
lol_watcher = LolWatcher(RIOT_API_KEY)

# Types of gamemodes 
CORE_QUEUES = {
    400: "Normal Draft Pick",
    440: "Ranked Flex",
    450: "Standard ARAM",
}

DDRAGON_VERSION = "14.1.1"  # Fallback patch version
CHAMPION_MAP = {}
ITEM_MAP = {}
SPELL_MAP = {}
RUNE_MAP = {}


async def load_datadragon_mappings():
    global DDRAGON_VERSION, CHAMPION_MAP, ITEM_MAP, SPELL_MAP, RUNE_MAP

    async with httpx.AsyncClient() as client:
        # Fetch latest Data Dragon patch version
        try:
            versions_res = await client.get(
                "https://ddragon.leagueoflegends.com/api/versions.json"
            )
            if versions_res.status_code == 200:
                DDRAGON_VERSION = versions_res.json()[0]
                print(f"[DDragon] Using active patch version: {DDRAGON_VERSION}")
        except Exception as e:
            print(
                f"[DDragon] Version fetch failed, using fallback {DDRAGON_VERSION}: {e}"
            )

        base_url = (
            f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/data/en_US"
        )
        cdn_img_base = (
            f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/img"
        )

        # Map Champions 
        try:
            champ_res = await client.get(f"{base_url}/champion.json")
            champ_data = champ_res.json()["data"]
            CHAMPION_MAP = {
                int(details["key"]): {
                    "name": details["name"],
                    "id": details["id"],
                    "icon": f"{cdn_img_base}/champion/{details['image']['full']}",
                }
                for details in champ_data.values()
            }
            print(f"[DDragon] Loaded {len(CHAMPION_MAP)} champions")
        except Exception as e:
            print(f"[DDragon] Champion mapping error: {e}")

        # Map Items
        try:
            item_res = await client.get(f"{base_url}/item.json")
            item_data = item_res.json()["data"]
            ITEM_MAP = {
                int(item_id): {
                    "name": details["name"],
                    "icon": f"{cdn_img_base}/item/{details['image']['full']}",
                }
                for item_id, details in item_data.items()
            }
            print(f"[DDragon] Loaded {len(ITEM_MAP)} items")
        except Exception as e:
            print(f"[DDragon] Item mapping error: {e}")

        # Map Summoner Spells
        try:
            spell_res = await client.get(f"{base_url}/summoner.json")
            spell_data = spell_res.json()["data"]
            SPELL_MAP = {
                int(details["key"]): {
                    "name": details["name"],
                    "icon": f"{cdn_img_base}/spell/{details['image']['full']}",
                }
                for details in spell_data.values()
            }
            print(f"[DDragon] Loaded {len(SPELL_MAP)} summoner spells")
        except Exception as e:
            print(f"[DDragon] Summoner spell mapping error: {e}")

        # Map Runes Reforged
        try:
            rune_res = await client.get(f"{base_url}/runesReforged.json")
            rune_data = rune_res.json()
            RUNE_MAP = {
                tree["id"]: {
                    "name": tree["name"],
                    "icon": f"https://ddragon.leagueoflegends.com/cdn/img/{tree['icon']}",
                }
                for tree in rune_data
            }
            print(f"[DDragon] Loaded {len(RUNE_MAP)} rune trees")
        except Exception as e:
            print(f"[DDragon] Rune mapping error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fetch and cache static mappings on server boot
    await load_datadragon_mappings()
    yield


app = FastAPI(
    title="League of Legends Core Analytics Backend",
    description="Analytics system focused on Normal Draft (400), Ranked Flex (440), and Standard ARAM (450).",
    lifespan=lifespan,
)

# Regional cluster routing
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

# Platform routing codes
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


def get_item_details(raw_item_ids):
    """Converts numeric item IDs into structured dictionaries with item names and CDN icons."""
    item_details_list = []
    for item_id in raw_item_ids:
        if item_id == 0:
            item_details_list.append({"id": 0, "name": "Empty Slot", "icon": ""})
        else:
            item_info = ITEM_MAP.get(
                item_id,
                {
                    "name": f"Unknown Item ({item_id})",
                    "icon": f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/img/item/{item_id}.png",
                },
            )
            item_details_list.append(
                {
                    "id": item_id,
                    "name": item_info["name"],
                    "icon": item_info.get("icon", ""),
                }
            )
    return item_details_list


@app.get("/")
def read_root():
    return {
        "status": "Backend server is online!",
        "supported_core_queues": CORE_QUEUES,
    }


#Checks SQLite cache first before querying Riot Account API
@app.get("/api/player/{region}/{game_name}/{tag_line}")
def get_or_fetch_player(
    region: str, game_name: str, tag_line: str, db: Session = Depends(get_db)
):
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")
    platform_region = PLATFORM_MAPPING.get(clean_region, "na1")

    #Check local SQLite cache first (case-insensitive search)
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

    #Fetch from Riot API if missing in local DB
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

    # Map summoner level using platform region
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


# Match List Endpoint: Focused on Draft (400), Flex (440), and Standard ARAM (450) with start/count pagination
@app.get("/api/matches/{region}/{puuid}")
def get_player_matches(
    region: str,
    puuid: str,
    count: int = 10,
    start: int = 0,
    queue: int | None = None,
):
    clean_puuid = puuid.strip()
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")

    kwargs = {
        "region": cluster_region,
        "puuid": clean_puuid,
        "start": start,
        "count": min(count, 100),
    }
    if queue is not None:
        kwargs["queue"] = queue

    try:
        match_ids = lol_watcher.match.matchlist_by_puuid(**kwargs)
        queue_label = CORE_QUEUES.get(
            queue, "All Game Modes" if queue is None else f"Queue {queue}"
        )

        return {
            "puuid": clean_puuid,
            "queue_filter": queue,
            "mode_name": queue_label,
            "start_index": start,
            "count": len(match_ids),
            "match_ids": match_ids,
        }

    except ApiError as err:
        status_code = err.response.status_code if hasattr(err, "response") else 400
        print(f"\n[RIOT API ERROR - Matchlist] Status: {status_code} | Details: {err}\n")
        raise HTTPException(
            status_code=status_code,
            detail=f"Riot API Error ({status_code}): Could not fetch match list",
        )


# Stores match details and uses get_item_details()
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
                "champion_name": cached_match.champion_name,
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
                "champion_name": new_match.champion_name,
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


# Computes stats filtered across Draft (400), Flex (440), and ARAM (450)
@app.get("/api/analytics/{puuid}")
def get_player_analytics(
    puuid: str, queue: int | None = None, db: Session = Depends(get_db)
):
    clean_puuid = puuid.strip()

    matches = (
        db.query(models.MatchRecord)
        .filter(models.MatchRecord.puuid == clean_puuid)
        .all()
    )

    if not matches:
        raise HTTPException(
            status_code=404,
            detail="No match records cached in local database for this PUUID. Load some matches first!",
        )

    # Filter by specific queue mode if requested (400, 440, or 450)
    if queue is not None and queue in CORE_QUEUES:
        target_mode = "ARAM" if queue == 450 else "CLASSIC"
        matches = [m for m in matches if m.game_mode == target_mode]

        if not matches:
            raise HTTPException(
                status_code=404,
                detail=f"No cached games found for {CORE_QUEUES[queue]} (Queue {queue}).",
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

    # Top Champions played breakdown
    champ_counts = Counter(m.champion_name for m in matches)
    champ_stats = []

    for champ_name, count in champ_counts.most_common(5):
        champ_matches = [m for m in matches if m.champion_name == champ_name]
        champ_wins = sum(1 for m in champ_matches if m.win)
        champ_winrate = round((champ_wins / count) * 100, 1)

        champ_stats.append(
            {
                "champion": champ_name,
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