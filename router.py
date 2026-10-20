import json
import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from itr import CORE_QUEUES, get_champion_details, get_item_details, get_rune_details
from riotwatcher import LolWatcher, RiotWatcher, ApiError
import os
from dotenv import load_dotenv

load_dotenv()

RIOT_API_KEY = os.getenv("RIOT_API_KEY")
router = APIRouter(tags=["Analytics & Matches"])

lol_watcher = LolWatcher(RIOT_API_KEY)
riot_watcher = RiotWatcher(RIOT_API_KEY)

CLUSTER_MAPPING = {
    "americas": "americas", "na": "americas", "na1": "americas", "br1": "americas",
    "europe": "europe", "euw1": "europe", "asia": "asia", "kr": "asia",
}

PLATFORM_MAPPING = {
    "americas": "na1", "na": "na1", "na1": "na1", "br1": "br1",
    "europe": "euw1", "euw1": "euw1", "asia": "kr", "kr": "kr",
}


# --- 1. PLAYER ACCOUNT & RANK ENDPOINTS ---
@router.get("/api/player/{region}/{game_name}/{tag_line}")
def get_or_fetch_player(region: str, game_name: str, tag_line: str, db: Session = Depends(get_db)):
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")
    platform_region = PLATFORM_MAPPING.get(clean_region, "na1")

    db_player = db.query(models.Player).filter(
        models.Player.game_name.ilike(game_name),
        models.Player.tag_line.ilike(tag_line)
    ).first()

    if db_player:
        if db_player.summoner_level == 0:
            try:
                summoner_info = lol_watcher.summoner.by_puuid(platform_region, db_player.puuid)
                db_player.summoner_level = summoner_info.get("summonerLevel", 0)
                db.commit()
                db.refresh(db_player)
            except ApiError as err:
                print(f"[RIOT API WARNING] {err}")
        return {"source": "database_cache", "data": db_player}

    try:
        account = riot_watcher.account.by_riot_id(cluster_region, game_name, tag_line)
        level = 0
        try:
            summoner_info = lol_watcher.summoner.by_puuid(platform_region, account["puuid"])
            level = summoner_info.get("summonerLevel", 0)
        except ApiError as err:
            print(f"[RIOT API WARNING] {err}")

        db_player = models.Player(
            puuid=account["puuid"],
            game_name=account["gameName"],
            tag_line=account["tagLine"],
            summoner_level=level,
        )
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Could not fetch account: {err}")

    return {"source": "live_api_fetch", "data": db_player}


@router.get("/api/rank/{region}/{game_name}/{tag_line}")
async def get_player_rank_by_riot_id(region: str, game_name: str, tag_line: str):
    clean_region = region.strip().lower()
    cluster_region = CLUSTER_MAPPING.get(clean_region, "americas")
    platform_region = PLATFORM_MAPPING.get(clean_region, "na1")

    try:
        account = riot_watcher.account.by_riot_id(cluster_region, game_name, tag_line)
        puuid = account["puuid"]

        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"X-Riot-Token": RIOT_API_KEY}
            url = f"https://{platform_region}.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid}"
            res = await client.get(url, headers=headers)
            league_entries = res.json() if res.status_code == 200 else []

        solo_queue = next((e for e in league_entries if e["queueType"] == "RANKED_SOLO_5x5"), None)
        flex_queue = next((e for e in league_entries if e["queueType"] == "RANKED_FLEX_SR"), None)

        def format_queue(entry):
            if not entry:
                return {"tier": "UNRANKED", "rank": "", "lp": 0, "wins": 0, "losses": 0, "winrate": 0.0}
            wins, losses = entry["wins"], entry["losses"]
            total = max(1, wins + losses)
            return {
                "tier": entry["tier"], "rank": entry["rank"], "lp": entry["leaguePoints"],
                "wins": wins, "losses": losses, "winrate": round((wins / total) * 100, 1)
            }

        return {
            "game_name": game_name, "tag_line": tag_line, "puuid": puuid,
            "solo_duo": format_queue(solo_queue), "flex": format_queue(flex_queue)
        }
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Could not retrieve rank: {err}")


# --- 2. MATCH LISTINGS & 200+ BATCH CACHING ENDPOINTS ---
@router.get("/api/matches/{region}/{puuid}")
def get_player_matches(region: str, puuid: str, count: int = 20, start: int = 0, queue: int | None = None):
    clean_puuid = puuid.strip()
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    kwargs = {"region": cluster_region, "puuid": clean_puuid, "start": start, "count": min(count, 100)}
    if queue is not None and queue in CORE_QUEUES:
        kwargs["queue"] = queue
    try:
        match_ids = lol_watcher.match.matchlist_by_puuid(**kwargs)
        return {"puuid": clean_puuid, "queue_filter": queue, "match_ids": match_ids}
    except ApiError as err:
        raise HTTPException(status_code=400, detail="Could not fetch match list.")


@router.post("/api/matches/{region}/{puuid}/batch-cache")
def batch_cache_matches(region: str, puuid: str, count: int = 200, queue: int | None = None, db: Session = Depends(get_db)):
    clean_puuid = puuid.strip()
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    target_count = min(max(count, 1), 250)
    match_ids = []
    start = 0
    chunk_size = 100
    
    try:
        while len(match_ids) < target_count:
            current_fetch_count = min(chunk_size, target_count - len(match_ids))
            kwargs = {"region": cluster_region, "puuid": clean_puuid, "start": start, "count": current_fetch_count}
            if queue is not None and queue in CORE_QUEUES:
                kwargs["queue"] = queue
                
            chunk_ids = lol_watcher.match.matchlist_by_puuid(**kwargs)
            if not chunk_ids:
                break
                
            match_ids.extend(chunk_ids)
            start += len(chunk_ids)
            
            if len(chunk_ids) < current_fetch_count:
                break
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Could not retrieve match list for batch caching: {err}")

    cached_count = 0
    for match_id in match_ids:
        if db.query(models.MatchRecord).filter_by(match_id=match_id, puuid=clean_puuid).first():
            continue
        try:
            match_data = lol_watcher.match.by_id(cluster_region, match_id)
            info = match_data["info"]
            s_player = next((p for p in info["participants"] if p["puuid"] == clean_puuid), None)
            if s_player:
                is_win = s_player["win"]
                kills, deaths, assists = s_player["kills"], s_player["deaths"], s_player["assists"]
                raw_items = [s_player[f"item{i}"] for i in range(7)]
                duration_mins = max(1.0, info["gameDuration"] / 60.0)
                total_cs = s_player.get("totalMinionsKilled", 0) + s_player.get("neutralMinionsKilled", 0)
                
                perks = s_player.get("perks", {})
                styles = perks.get("styles", [])
                primary_style = styles[0].get("style") if len(styles) > 0 else None
                keystone_id = styles[0]["selections"][0].get("perk") if len(styles) > 0 and styles[0].get("selections") else None
                sub_style = styles[1].get("style") if len(styles) > 1 else None

                new_match = models.MatchRecord(
                    match_id=match_id, puuid=clean_puuid, queue_id=info.get("queueId"),
                    champion_name=s_player["championName"], outcome="Victory" if is_win else "Defeat",
                    win=is_win, kills=kills, deaths=deaths, assists=assists,
                    kda_ratio=round((kills + assists) / max(1, deaths), 2),
                    items_json=json.dumps(raw_items), game_mode=info["gameMode"],
                    game_duration_seconds=info["gameDuration"], cs_total=total_cs,
                    cs_per_min=round(total_cs / duration_mins, 1), vision_score=s_player.get("visionScore", 0),
                    role_played=s_player.get("individualPosition", "UNKNOWN"),
                    primary_style=primary_style, keystone_id=keystone_id, sub_style=sub_style
                )
                db.add(new_match)
                db.commit()
                cached_count += 1
            
            time.sleep(0.05)
        except Exception:
            continue
            
    return {"status": "success", "total_matches_scanned": len(match_ids), "newly_cached_matches": cached_count}


# --- 3. SUMMARY & DETAILS ENDPOINTS ---
@router.get("/api/match/{region}/{match_id}/{puuid}/summary")
def get_match_summary(region: str, match_id: str, puuid: str, db: Session = Depends(get_db)):
    clean_puuid = puuid.strip()
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    cached_match = db.query(models.MatchRecord).filter_by(match_id=match_id, puuid=clean_puuid).first()
    if cached_match:
        return {"source": "database_cache", "data": {
            "match_id": cached_match.match_id, "champion": get_champion_details(cached_match.champion_name),
            "win": cached_match.win, "outcome": cached_match.outcome, "kills": cached_match.kills,
            "deaths": cached_match.deaths, "assists": cached_match.assists, "kda_ratio": cached_match.kda_ratio,
            "game_mode": cached_match.game_mode, "game_duration_seconds": cached_match.game_duration_seconds
        }}
    
    try:
        match_data = lol_watcher.match.by_id(cluster_region, match_id)
        s_player = next((p for p in match_data["info"]["participants"] if p["puuid"] == clean_puuid), None)
        if not s_player:
            raise HTTPException(status_code=404, detail="Player not found in match")
        is_win = s_player["win"]
        return {"source": "live_api_fetch", "data": {
            "match_id": match_id, "champion": get_champion_details(s_player["championName"]),
            "win": is_win, "outcome": "Victory" if is_win else "Defeat",
            "kills": s_player["kills"], "deaths": s_player["deaths"], "assists": s_player["assists"],
            "kda_ratio": round((s_player["kills"] + s_player["assists"]) / max(1, s_player["deaths"]), 2),
            "game_mode": match_data["info"]["gameMode"], "game_duration_seconds": match_data["info"]["gameDuration"]
        }}
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Could not fetch summary: {err}")


@router.get("/api/match/{region}/{match_id}/{puuid}/details")
def get_match_details(region: str, match_id: str, puuid: str, db: Session = Depends(get_db)):
    clean_puuid = puuid.strip()
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    cached_match = db.query(models.MatchRecord).filter_by(match_id=match_id, puuid=clean_puuid).first()
    if cached_match:
        raw_items = json.loads(cached_match.items_json)
        return {"source": "database_cache", "data": {
            "items": get_item_details(raw_items), "cs_total": cached_match.cs_total,
            "cs_per_min": cached_match.cs_per_min, "vision_score": cached_match.vision_score,
            "role_played": cached_match.role_played,
            "runes": get_rune_details(cached_match.primary_style, cached_match.keystone_id, cached_match.sub_style)
        }}
    
    try:
        match_data = lol_watcher.match.by_id(cluster_region, match_id)
        s_player = next((p for p in match_data["info"]["participants"] if p["puuid"] == clean_puuid), None)
        if not s_player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        raw_items = [s_player[f"item{i}"] for i in range(7)]
        duration_mins = max(1.0, match_data["info"]["gameDuration"] / 60.0)
        total_cs = s_player.get("totalMinionsKilled", 0) + s_player.get("neutralMinionsKilled", 0)
        
        perks = s_player.get("perks", {})
        styles = perks.get("styles", [])
        primary_style = styles[0].get("style") if len(styles) > 0 else None
        keystone_id = styles[0]["selections"][0].get("perk") if len(styles) > 0 and styles[0].get("selections") else None
        sub_style = styles[1].get("style") if len(styles) > 1 else None

        return {"source": "live_api_fetch", "data": {
            "items": get_item_details(raw_items), "cs_total": total_cs,
            "cs_per_min": round(total_cs / duration_mins, 1),
            "vision_score": s_player.get("visionScore", 0),
            "role_played": s_player.get("individualPosition", "UNKNOWN"),
            "runes": get_rune_details(primary_style, keystone_id, sub_style)
        }}
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Could not fetch details: {err}")


# --- 4. OPTIMIZED PARSED TIMELINE ENDPOINT ---
@router.get("/api/match/{region}/{match_id}/{puuid}/timeline/parsed")
async def get_parsed_match_timeline(
    region: str, 
    match_id: str, 
    puuid: str, 
    start_minute: float = 0.0, 
    end_minute: float = 60.0
):
    clean_puuid = puuid.strip()
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        match_res = await client.get(
            f"https://{cluster_region}.api.riotgames.com/lol/match/v5/matches/{match_id}",
            headers={"X-Riot-Token": RIOT_API_KEY}
        )
        if match_res.status_code != 200:
            raise HTTPException(
                status_code=match_res.status_code, 
                detail=f"Riot API Error ({match_res.status_code}): {match_res.text}"
            )
        
        participants = match_res.json()["info"]["participants"]
        player = next((p for p in participants if p["puuid"] == clean_puuid), None)
        if not player:
            raise HTTPException(status_code=404, detail="Player PUUID not found in this match's participants list.")
            
        participant_id = player["participantId"]

        timeline_res = await client.get(
            f"https://{cluster_region}.api.riotgames.com/lol/match/v5/matches/{match_id}/timeline",
            headers={"X-Riot-Token": RIOT_API_KEY}
        )
        if timeline_res.status_code != 200:
            raise HTTPException(
                status_code=timeline_res.status_code, 
                detail=f"Riot Timeline API Error ({timeline_res.status_code}): {timeline_res.text}"
            )
            
        timeline_json = timeline_res.json()

    item_purchases = []
    skill_level_ups = []
    
    frames = timeline_json.get("info", {}).get("frames", [])
    for frame in frames:
        timestamp_min = round(frame.get("timestamp", 0) / 60000.0, 1)
        
        if timestamp_min < start_minute or timestamp_min > end_minute:
            continue
            
        events = frame.get("events", [])
        for event in events:
            if event.get("participantId") == participant_id:
                event_type = event.get("type")
                
                if event_type in ["ITEM_PURCHASED", "ITEM_SOLD", "ITEM_UNDO"]:
                    item_id = event.get("itemId")
                    item_info = get_item_details([item_id])[0] if item_id else {"id": 0, "name": "Empty", "icon": ""}
                    item_purchases.append({
                        "timestamp_minute": timestamp_min,
                        "action": event_type,
                        "item": item_info
                    })
                    
                elif event_type == "SKILL_LEVEL_UP":
                    skill_level_ups.append({
                        "timestamp_minute": timestamp_min,
                        "skill_slot": event.get("skillSlot"),
                        "level_up_type": event.get("levelUpType")
                    })

    return {
        "match_id": match_id,
        "puuid": clean_puuid,
        "participant_id": participant_id,
        "time_range": {"start_minute": start_minute, "end_minute": end_minute},
        "timeline_summary": {
            "item_history": item_purchases,
            "skill_progression": skill_level_ups
        }
    }