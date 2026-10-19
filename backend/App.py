import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from riotwatcher import LolWatcher, RiotWatcher, ApiError
from dotenv import load_dotenv
import requests

load_dotenv()
API_KEY = os.environ.get("RIOT_API_KEY")

app = FastAPI()

# allows the Vite dev server (a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's real URL before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

lol_watcher = LolWatcher(API_KEY)
riot_watcher = RiotWatcher(API_KEY)

_ddragon_version_cache = None


def get_latest_version():
    """Data Dragon needs patch version for image URLs.
       fetch it once and then cache it """
    global _ddragon_version_cache
    if _ddragon_version_cache is None:
        versions = requests.get("https://ddragon.leagueoflegends.com/api/versions.json").json()
        _ddragon_version_cache = versions[0]
    return _ddragon_version_cache


@app.get("/api/summoner")
def get_summoner(gameName: str, tagLine: str, region: str = "americas", platform: str = "na1"):

    try:
        account = riot_watcher.account.by_riot_id(region, gameName, tagLine)
        summoner = lol_watcher.summoner.by_puuid(platform, account["puuid"])
    except ApiError as err:
        raise HTTPException(status_code=err.response.status_code, detail=str(err))

    version = get_latest_version()
    return {
        "puuid": account["puuid"],
        "gameName": account["gameName"],
        "tagLine": account["tagLine"],
        "summonerLevel": summoner["summonerLevel"],
        "profileIconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/profileicon/{summoner['profileIconId']}.png",
    }


@app.get("/api/matches")
def get_matches(puuid: str, region: str = "americas", count: int = 10, queue: int = 420):
    # queue defaults to 420 = Ranked Solo/Duo
    try:
        match_ids = lol_watcher.match.matchlist_by_puuid(region, puuid, count=count, queue=queue)
        matches = [
            summarize_match(lol_watcher.match.by_id(region, match_id), puuid)
            for match_id in match_ids
        ]
    except ApiError as err:
        raise HTTPException(status_code=err.response.status_code, detail=str(err))

    return matches

_spell_cache = None


def get_spell_lookup():
    """maps summoner spell IDs to icon URLs. fetched once, then cached."""
    global _spell_cache
    if _spell_cache is None:
        version = get_latest_version()
        spells = requests.get(
            f"https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/summoner.json"
        ).json()["data"]

        _spell_cache = {
            int(spell["key"]): f"https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{spell['image']['full']}"
            for spell in spells.values()
        }
    return _spell_cache

def summarize_match(match, puuid):
    # riot's raw match object has too much data, so return only what's needed
    info = match["info"]
    player = next(p for p in info["participants"] if p["puuid"] == puuid)
    print({k: v for k, v in player.items() if "item" in k.lower() or "quest" in k.lower() or "role" in k.lower()})
    version = get_latest_version()
    spells = get_spell_lookup()
    items = [player.get(f"item{i}", 0) for i in range(7)]
    

    return {
        "matchId": match["metadata"]["matchId"],
        "championName": player["championName"],
        "championIconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{player['championName']}.png",
        "role": player.get("teamPosition", ""),
        "win": player["win"],
        "kills": player["kills"],
        "deaths": player["deaths"],
        "assists": player["assists"],
        "gameDuration": info["gameDuration"],
        "queueId": info["queueId"],
        "items": items,
        "itemIconUrls": [
            f"https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{item_id}.png"
            if item_id != 0 else None
            for item_id in items
        ],
        "questItemIconUrl": (
            f"https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{player['roleBoundItem']}.png"
            if player.get("roleBoundItem") else None
        ),
        "teamPosition": player["teamPosition"],
        "visionScore": player["visionScore"],
        "gameEndTimestamp": info.get("gameEndTimestamp") or info["gameStartTimestamp"],
        "summonerSpellIconUrls": [
            spells.get(player["summoner1Id"]),
            spells.get(player["summoner2Id"]),
        ],
        "cs": player.get("totalMinionsKilled", 0) + player.get("neutralMinionsKilled", 0),

        

    }