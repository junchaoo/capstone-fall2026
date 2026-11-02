import json
import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from itr import CORE_QUEUES, get_champion_details, get_item_details, get_rune_details, get_spell_details
from riotwatcher import LolWatcher, RiotWatcher, ApiError
import os
from dotenv import load_dotenv
from collections import Counter

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


@router.get("/api/match/{region}/{match_id}/timeline/summary")
def get_all_participants_timeline_summary(
    region: str, 
    match_id: str, 
    start_minute: float = 0.0, 
    end_minute: float = 60.0
):
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    try:
        # 1. Fetch match details via lol_watcher
        match_data = lol_watcher.match.by_id(cluster_region, match_id)
        participants_raw = match_data.get("info", {}).get("participants", [])
        
        if not participants_raw:
            raise HTTPException(status_code=404, detail="Match details found, but participant list is empty")

        # Map all 10 participants directly from match data
        participant_map = {}
        for p in participants_raw:
            p_id = p["participantId"]
            game_name = p.get("riotIdGameName") or p.get("summonerName") or "Unknown"
            tag_line = p.get("riotIdTagline") or ""
            
            participant_map[p_id] = {
                "participant_id": p_id,
                "puuid": p.get("puuid", ""),
                "game_name": game_name,
                "tag_line": tag_line,
                "champion_name": p.get("championName", "Unknown"),
                "team_id": p.get("teamId"),
                "role": p.get("individualPosition", "UNKNOWN")
            }

        # 2. Fetch match timeline via lol_watcher
        timeline_data = lol_watcher.match.timeline_by_match(cluster_region, match_id)

    except HTTPException as he:
        raise he
    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Riot API Error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    # 3. Bucket timeline events for all 10 players
    SKILL_SLOT_MAP = {1: "Q", 2: "W", 3: "E", 4: "R"}
    players_timeline = {p_id: {"item_events": [], "skill_events": []} for p_id in participant_map}

    frames = timeline_data.get("info", {}).get("frames", [])
    for frame in frames:
        timestamp_min = round(frame.get("timestamp", 0) / 60000.0, 1)
        
        if timestamp_min < start_minute or timestamp_min > end_minute:
            continue
            
        for event in frame.get("events", []):
            p_id = event.get("participantId")
            if p_id in players_timeline:
                event_type = event.get("type")
                
                # Filter item events
                if event_type in ["ITEM_PURCHASED", "ITEM_SOLD", "ITEM_UNDO"]:
                    item_id = event.get("itemId")
                    item_info = get_item_details([item_id])[0] if item_id else {"id": 0, "name": "Empty", "icon": ""}
                    players_timeline[p_id]["item_events"].append({
                        "minute": timestamp_min,
                        "action": event_type,
                        "item": item_info
                    })
                
                # Filter skill level-up events
                elif event_type == "SKILL_LEVEL_UP":
                    raw_slot = event.get("skillSlot")
                    players_timeline[p_id]["skill_events"].append({
                        "minute": timestamp_min,
                        "skill_slot": raw_slot,
                        "skill_letter": SKILL_SLOT_MAP.get(raw_slot, "?"),
                        "level_up_type": event.get("levelUpType")
                    })

    # 4. Return complete 10-player structured summary
    timeline_summary = []
    for p_id, p_info in participant_map.items():
        timeline_summary.append({
            "player": p_info,
            "timeline": players_timeline[p_id]
        })

    return {
        "match_id": match_id,
        "time_range": {"start_minute": start_minute, "end_minute": end_minute},
        "participants_timeline": timeline_summary
    }


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


@router.get("/api/player/{region}/{game_name}/{tag_line}/premade-stats")
def get_player_premade_stats(region: str, game_name: str, tag_line: str, count: int = 15):
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    try:
        account_data = riot_watcher.account.by_riot_id(cluster_region, game_name, tag_line)
        puuid = account_data["puuid"]
        
        match_ids = lol_watcher.match.matchlist_by_puuid(cluster_region, puuid, count=count)
        
        if not match_ids:
            return {"game_name": game_name, "tag_line": tag_line, "frequent_duos": []}

        teammate_tracker = {}

        for m_id in match_ids:
            match_data = lol_watcher.match.by_id(cluster_region, m_id)
            participants = match_data.get("info", {}).get("participants", [])
            
            target_participant = next((p for p in participants if p["puuid"] == puuid), None)
            if not target_participant:
                continue
                
            target_team_id = target_participant["teamId"]
            target_won = target_participant["win"]

            for p in participants:
                if p["teamId"] == target_team_id and p["puuid"] != puuid:
                    mate_puuid = p["puuid"]
                    mate_name = p.get("riotIdGameName") or p.get("summonerName") or "Unknown"
                    mate_tag = p.get("riotIdTagline") or ""
                    champion_played = p.get("championName", "Unknown")

                    if mate_puuid not in teammate_tracker:
                        teammate_tracker[mate_puuid] = {
                            "game_name": mate_name,
                            "tag_line": mate_tag,
                            "games_together": 0,
                            "wins": 0,
                            "champions_played": Counter()
                        }
                    
                    teammate_tracker[mate_puuid]["games_together"] += 1
                    if target_won:
                        teammate_tracker[mate_puuid]["wins"] += 1
                    teammate_tracker[mate_puuid]["champions_played"][champion_played] += 1

        frequent_duos = []
        for mate_puuid, data in teammate_tracker.items():
            if data["games_together"] >= 2:  # Threshold for premade detection
                win_rate = round((data["wins"] / data["games_together"]) * 100, 1)
                most_common_champ = data["champions_played"].most_common(1)[0][0] if data["champions_played"] else "Unknown"
                
                frequent_duos.append({
                    "puuid": mate_puuid,
                    "game_name": data["game_name"],
                    "tag_line": data["tag_line"],
                    "games_together": data["games_together"],
                    "wins": data["wins"],
                    "losses": data["games_together"] - data["wins"],
                    "win_rate": win_rate,
                    "frequent_champion": most_common_champ
                })

        frequent_duos = sorted(frequent_duos, key=lambda x: x["games_together"], reverse=True)

        return {
            "target_player": {"game_name": game_name, "tag_line": tag_line},
            "matches_analyzed": len(match_ids),
            "frequent_duos": frequent_duos
        }

    except ApiError as err:
        raise HTTPException(status_code=400, detail=f"Riot API Error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@router.get("/api/recommendations/items")
def get_item_recommendations(champion_name: str, role: str, region: str = "americas", count: int = 50):
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    starter_counter = Counter()
    core_counter = Counter()
    late_counter = Counter()
    total_winning_games = 0

    try:
        # Use a broader sample size by scanning more matches
        seed_puuid = "vzGu0XMkUPwSkc1f4Uy7lJoheJSJYkOSgT6uVMbeVUKuS7KjOMYp8CkddIyT99vuk9VjEM_P5ZwT5g"
        sample_match_ids = lol_watcher.match.matchlist_by_puuid(cluster_region, seed_puuid, count=count)

        if not sample_match_ids:
            return {"champion": champion_name, "role": role, "sample_size": 0, "message": "No matches found."}

        for m_id in sample_match_ids:
            match_data = lol_watcher.match.by_id(cluster_region, m_id)
            participants = match_data.get("info", {}).get("participants", [])

            for p in participants:
                if (p.get("championName", "").lower() == champion_name.lower() and 
                    p.get("teamPosition", "").upper() == role.upper() and 
                    p.get("win") == True):
                    
                    total_winning_games += 1
                    
                    # Categorize based on typical item slots:
                    # Slots 0-1 or specific low-cost items can be categorized or tracked
                    for i in range(6):
                        item_id = p.get(f"item{i}", 0)
                        if item_id > 0:
                            # Simple heuristic for starters/components vs core/late items based on item ID / cost
                            # (In a full DB, you'd map item metadata for costs/tags)
                            if item_id in [1054, 1055, 1056, 2003, 2033, 3858, 3859, 3860]: # Common starters
                                starter_counter[item_id] += 1
                            elif i in [0, 1, 2]: # Core build slots
                                core_counter[item_id] += 1
                            else: # Late game slots (4th, 5th, 6th)
                                late_counter[item_id] += 1

        # Helper function to format item lists
        def format_items(counter, total_games):
            formatted = []
            for item_id, freq in counter.most_common(3):
                item_info = get_item_details([item_id])
                name, icon = "Unknown", ""
                if isinstance(item_info, dict):
                    details = item_info.get(str(item_id)) or item_info.get(item_id, {})
                    name = details.get("name", "Unknown")
                    icon = details.get("icon", "")
                elif isinstance(item_info, list) and len(item_info) > 0:
                    name = item_info[0].get("name", "Unknown")
                    icon = item_info[0].get("icon", "")
                
                win_rate = round((freq / total_games) * 100, 1) if total_games > 0 else 0
                formatted.append({
                    "item_id": item_id,
                    "name": name,
                    "icon": icon,
                    "win_rate": f"{win_rate}%",
                    "matches": freq
                })
            return formatted

        return {
            "champion": champion_name.capitalize(),
            "role": role.upper(),
            "sample_size": total_winning_games,
            "starting_items": format_items(starter_counter, total_winning_games),
            "core_items": format_items(core_counter, total_winning_games),
            "late_game_options": format_items(late_counter, total_winning_games)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@router.get("/api/counters/{champion_name}")
def get_champion_counters(champion_name: str, role: str = "TOP", region: str = "americas", count: int = 50):
    cluster_region = CLUSTER_MAPPING.get(region.strip().lower(), "americas")
    
    matchup_stats = {} 

    try:
        seed_puuid = "vzGu0XMkUPwSkc1f4Uy7lJoheJSJYkOSgT6uVMbeVUKuS7KjOMYp8CkddIyT99vuk9VjEM_P5ZwT5g"
        sample_match_ids = lol_watcher.match.matchlist_by_puuid(cluster_region, seed_puuid, count=count)

        if not sample_match_ids:
            return {
                "champion": champion_name.capitalize(),
                "role": role.upper(),
                "matchups": [],
                "message": "No match history available for analysis."
            }

        for m_id in sample_match_ids:
            match_data = lol_watcher.match.by_id(cluster_region, m_id)
            participants = match_data.get("info", {}).get("participants", [])

            target_participants = [
                p for p in participants 
                if p.get("championName", "").lower() == champion_name.lower() 
                and p.get("teamPosition", "").upper() == role.upper()
            ]

            for target in target_participants:
                target_team = target.get("teamId")
                target_won = target.get("win")
                
                opponent = next(
                    (p for p in participants 
                     if p.get("teamPosition", "").upper() == role.upper() 
                     and p.get("teamId") != target_team),
                    None
                )

                if opponent:
                    enemy_champ = opponent.get("championName", "Unknown")
                    
                    if enemy_champ not in matchup_stats:
                        matchup_stats[enemy_champ] = {"wins": 0, "losses": 0, "games": 0}
                    
                    matchup_stats[enemy_champ]["games"] += 1
                    if target_won:
                        matchup_stats[enemy_champ]["wins"] += 1
                    else:
                        matchup_stats[enemy_champ]["losses"] += 1

        counters_list = []
        for enemy, stats in matchup_stats.items():
            games = stats["games"]
            wins = stats["wins"]
            win_rate = round((wins / games) * 100, 1) if games > 0 else 0
            
            counters_list.append({
                "enemy_champion": enemy,
                "games_played": games,
                "win_rate": f"{win_rate}%",
                "loss_rate": f"{round(100 - win_rate, 1)}%"
            })

        counters_list = sorted(counters_list, key=lambda x: float(x["win_rate"].rstrip("%")))

        return {
            "champion": champion_name.capitalize(),
            "role": role.upper(),
            "matchups": counters_list
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")