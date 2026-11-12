import time
import json
import os
from dotenv import load_dotenv
from riotwatcher import LolWatcher, ApiError
from database import SessionLocal
import models

load_dotenv()
RIOT_API_KEY = os.getenv("RIOT_API_KEY")

if not RIOT_API_KEY:
    raise ValueError("RIOT_API_KEY is missing from your environment variables or .env file.")

lol_watcher = LolWatcher(RIOT_API_KEY)

def bulk_harvest_matches(platform_region: str = "na1", cluster_region: str = "americas", target_match_count: int = 3000):
    db = SessionLocal()

    print(f"[{platform_region.upper()}] Fetching high-ELO seed players across Challenger, Grandmaster, Master, and Diamond I...")
    seed_puuids = set()

    try:
        # 1. Fetch Apex Tiers (Challenger, Grandmaster, Master)
        challenger = lol_watcher.league.challenger_by_queue(platform_region, "RANKED_SOLO_5x5")
        grandmaster = lol_watcher.league.grandmaster_by_queue(platform_region, "RANKED_SOLO_5x5")
        master = lol_watcher.league.masters_by_queue(platform_region, "RANKED_SOLO_5x5")

        apex_entries = challenger.get("entries", []) + grandmaster.get("entries", []) + master.get("entries", [])

        # 2. Fetch Diamond I entries to maximize seed coverage
        diamond_entries = lol_watcher.league.entries(platform_region, "RANKED_SOLO_5x5", "DIAMOND", "I", page=1)

        all_entries = apex_entries + diamond_entries
        print(f"[INFO] Retrieved {len(all_entries)} total high-tier ladder entries. Extracting PUUIDs...")

        for entry in all_entries[:400]:
            p_id = entry.get("puuid")
            if not p_id:
                sum_id = entry.get("summonerId")
                if sum_id:
                    try:
                        sum_data = lol_watcher.summoner.by_id(platform_region, sum_id)
                        p_id = sum_data.get("puuid")
                    except Exception:
                        continue
            if p_id:
                seed_puuids.add(p_id)

    except ApiError as err:
        print(f"[ERROR] Failed to fetch ladder entries: {err}")
        db.close()
        return

    print(f"[SUCCESS] Gathered {len(seed_puuids)} valid seed player PUUIDs. Harvesting unique match IDs...")

    # Gather unique match IDs using cluster routing (Match-v5)
    unique_match_ids = set()
    for puuid in seed_puuids:
        if len(unique_match_ids) >= target_match_count * 1.3:
            break
        try:
            m_list = lol_watcher.match.matchlist_by_puuid(cluster_region, puuid, count=50, queue=420)
            for m_id in m_list:
                cached = db.query(models.MatchRecord).filter_by(match_id=m_id).all()
                if len({record.puuid for record in cached}) < 10 or any(not record.role_played for record in cached):
                    unique_match_ids.add(m_id)
            time.sleep(0.05)
        except ApiError as err:
            continue

    match_id_list = list(unique_match_ids)
    print(f"[INFO] Discovered {len(match_id_list)} unique uncached matches. Beginning database ingestion...")

    processed_count = 0
    for match_id in match_id_list[:target_match_count]:
        try:
            match_data = lol_watcher.match.by_id(cluster_region, match_id)
            info = match_data["info"]

            # Skip remakes or custom games (< 5 mins)
            if info.get("gameDuration", 0) < 300:
                continue

            existing_records = db.query(models.MatchRecord).filter_by(match_id=match_id).all()
            existing_by_puuid = {record.puuid: record for record in existing_records}
            for s_player in info.get("participants", []):
                p_puuid = s_player.get("puuid", "UNKNOWN")
                is_win = s_player["win"]
                kills, deaths, assists = s_player["kills"], s_player["deaths"], s_player["assists"]

                # Capture item slots 0-6 cleanly
                raw_items = [s_player.get(f"item{i}", 0) for i in range(7)]
                duration_mins = max(1.0, info["gameDuration"] / 60.0)
                total_cs = s_player.get("totalMinionsKilled", 0) + s_player.get("neutralMinionsKilled", 0)

                perks = s_player.get("perks", {})
                styles = perks.get("styles", [])
                primary_style = styles[0].get("style") if len(styles) > 0 else None
                keystone_id = styles[0]["selections"][0].get("perk") if len(styles) > 0 and styles[0].get("selections") else None
                sub_style = styles[1].get("style") if len(styles) > 1 else None

                record_data = dict(
                    match_id=match_id,
                    puuid=p_puuid,
                    queue_id=info.get("queueId"),
                    champion_name=s_player["championName"],
                    outcome="Victory" if is_win else "Defeat",
                    win=is_win,
                    kills=kills,
                    deaths=deaths,
                    assists=assists,
                    kda_ratio=round((kills + assists) / max(1, deaths), 2),
                    items_json=json.dumps(raw_items),
                    game_mode=info["gameMode"],
                    game_duration_seconds=info["gameDuration"],
                    cs_total=total_cs,
                    cs_per_min=round(total_cs / duration_mins, 1),
                    vision_score=s_player.get("visionScore", 0),
                    role_played=s_player.get("individualPosition", "UNKNOWN"),
                    primary_style=primary_style,
                    keystone_id=keystone_id,
                    sub_style=sub_style
                )
                existing = existing_by_puuid.get(p_puuid)
                if existing:
                    for field, value in record_data.items():
                        setattr(existing, field, value)
                else:
                    db.add(models.MatchRecord(**record_data))

            db.commit()
            processed_count += 1

            if processed_count % 50 == 0:
                print(f"[PROGRESS] Successfully cached {processed_count} matches...")

            time.sleep(0.08)

        except ApiError as err:
            if err.response.status_code == 429:
                print("[WARNING] Hit Riot Rate Limit (429). Sleeping for 30 seconds...")
                time.sleep(30)
            else:
                continue
        except Exception as e:
            db.rollback()
            continue

    db.close()
    print(f"\n[COMPLETE] Bulk harvest finished successfully! Total new matches added to database: {processed_count}")

if __name__ == "__main__":
    bulk_harvest_matches(platform_region="na1", cluster_region="americas", target_match_count=3000)