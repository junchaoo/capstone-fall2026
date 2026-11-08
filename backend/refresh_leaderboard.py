import argparse
import os
import sys
import time
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

from database import Base, engine, SessionLocal
from models import LadderEntry

load_dotenv()
API_KEY = os.getenv("RIOT_API_KEY")

# code -> (platform host for ladders, regional host for name lookups)
REGIONS = {
    "NA": ("na1", "americas"),
    "BR": ("br1", "americas"),
    "LAN": ("la1", "americas"),
    "LAS": ("la2", "americas"),
    "OCE": ("oc1", "americas"),
    "EUW": ("euw1", "europe"),
    "EUNE": ("eun1", "europe"),
    "TR": ("tr1", "europe"),
    "RU": ("ru", "europe"),
    "KR": ("kr", "asia"),
    "JP": ("jp1", "asia"),
    "PH": ("ph2", "asia"),
    "SG": ("sg2", "asia"),
    "TH": ("th2", "asia"),
    "TW": ("tw2", "asia"),
    "VN": ("vn2", "asia"),
}

QUEUE = "RANKED_SOLO_5x5"

# A development key allows about 100 requests per 2 minutes (and 20 per second)
SECONDS_BETWEEN_CALLS = 1.3
_last_call = 0.0


def riot_get(host: str, path: str):
    """One request to Riot, spaced out to stay under the rate limit. Returns the JSON, or None if not found."""
    global _last_call
    url = f"https://{host}.api.riotgames.com{path}"

    for _ in range(4):
        wait = SECONDS_BETWEEN_CALLS - (time.time() - _last_call)
        if wait > 0:
            time.sleep(wait)
        _last_call = time.time()

        response = requests.get(url, headers={"X-Riot-Token": API_KEY}, timeout=20)

        if response.status_code == 429:  # too many requests: wait as long as Riot says
            seconds = int(response.headers.get("Retry-After", "10"))
            print(f"  Rate limited, waiting {seconds}s...")
            time.sleep(seconds + 1)
            continue
        if response.status_code in (401, 403):
            sys.exit(
                "Riot rejected the API key (error 401/403). A development key expires after 24 hours: "
                "generate a new one at developer.riotgames.com and update backend/.env"
            )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    return None


def fetch_ladder(platform: str, top: int) -> list[dict]:
    """Challenger + Grandmaster (+ Master only if more players are needed), best LP first."""
    entries: list[dict] = []
    for league, tier in (
        ("challengerleagues", "Challenger"),
        ("grandmasterleagues", "Grandmaster"),
        ("masterleagues", "Master"),
    ):
        if tier == "Master" and len(entries) >= top:
            break
        data = riot_get(platform, f"/lol/league/v4/{league}/by-queue/{QUEUE}")
        if not data:
            continue
        for entry in data.get("entries", []):
            entries.append({**entry, "_tier": tier})

    entries.sort(key=lambda e: e.get("leaguePoints", 0), reverse=True)
    return entries[:top]


def get_puuid(platform: str, entry: dict) -> str | None:
    """Ladder entries identify a player by puuid, or by an older summonerId that has to be converted."""
    if entry.get("puuid"):
        return entry["puuid"]
    if entry.get("summonerId"):
        summoner = riot_get(platform, f"/lol/summoner/v4/summoners/{entry['summonerId']}")
        if summoner:
            return summoner.get("puuid")
    return None


def get_riot_id(account_host: str, puuid: str) -> tuple[str, str]:
    """puuid -> ("Name", "TAG")"""
    account = riot_get(account_host, f"/riot/account/v1/accounts/by-puuid/{puuid}")
    if account:
        return account.get("gameName", ""), account.get("tagLine", "")
    return "", ""


def refresh(region_codes: list[str], top: int) -> None:
    if not API_KEY:
        sys.exit("No API key found. Create backend/.env containing:  RIOT_API_KEY=RGAPI-your-key-here")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Names we already know, so each player is only looked up once
        known = {row.puuid: (row.game_name, row.tag_line) for row in db.query(LadderEntry).all() if row.game_name}

        worst_case_minutes = len(region_codes) * (top + 3) * SECONDS_BETWEEN_CALLS / 60
        print(f"Refreshing {len(region_codes)} region(s). Worst case about {worst_case_minutes:.0f} minutes.")

        for code in region_codes:
            platform, account_host = REGIONS[code]
            print(f"\n{code}: fetching the ladder...")
            ladder = fetch_ladder(platform, top)
            if not ladder:
                print("  No data came back. Keeping the old data for this region.")
                continue

            now = datetime.now(timezone.utc)
            rows: list[LadderEntry] = []
            for entry in ladder:
                puuid = get_puuid(platform, entry)
                if not puuid:
                    print("  A ladder entry had no player ID I could use, skipped it.")
                    continue
                if puuid not in known:
                    known[puuid] = get_riot_id(account_host, puuid)
                name, tag = known[puuid]
                rows.append(
                    LadderEntry(
                        region=code,
                        puuid=puuid,
                        game_name=name,
                        tag_line=tag,
                        tier=entry["_tier"],
                        lp=entry.get("leaguePoints", 0),
                        wins=entry.get("wins", 0),
                        losses=entry.get("losses", 0),
                        updated_at=now,
                    )
                )

            # Swap this region's rows in one step, so an interrupted run never leaves it half empty
            db.query(LadderEntry).filter(LadderEntry.region == code).delete()
            db.add_all(rows)
            db.commit()
            print(f"  Saved {len(rows)} players.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch real ranked ladders from Riot into the database.")
    parser.add_argument("--region", action="append", choices=list(REGIONS), help="region code, can be repeated")
    parser.add_argument("--top", type=int, default=50, help="players to keep per region (default 50)")
    args = parser.parse_args()

    refresh(args.region or list(REGIONS), args.top)