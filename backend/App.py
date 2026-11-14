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
PRISMATIC_ID_RANGE = range(440000, 450000)
lol_watcher = LolWatcher(API_KEY)
riot_watcher = RiotWatcher(API_KEY)

_ddragon_version_cache = None
_rune_cache = None
_spell_cache = None
_augment_cache = None

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
def get_matches(puuid: str, region: str = "americas", count: int = 10, queue: int = 1750):
    # queue defaults to 420 = Ranked Solo/Duo
    try:
        match_ids = lol_watcher.match.matchlist_by_puuid(region, puuid, count=count, queue=queue)
        matches = [
            summarize(lol_watcher.match.by_id(region, match_id), puuid)
            for match_id in match_ids
        ]
    except ApiError as err:
        raise HTTPException(status_code=err.response.status_code, detail=str(err))

    return matches

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

def get_rune_lookup():
    """maps rune and tree IDs to icon URLs. fetched once, then cached."""
    global _rune_cache
    if _rune_cache is None:
        version = get_latest_version()
        trees = requests.get(
            f"https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/runesReforged.json"
        ).json()

        lookup = {}
        for tree in trees:
            lookup[tree["id"]] = f"https://ddragon.leagueoflegends.com/cdn/img/{tree['icon']}"
            for slot in tree["slots"]:
                for rune in slot["runes"]:
                    lookup[rune["id"]] = f"https://ddragon.leagueoflegends.com/cdn/img/{rune['icon']}"
        _rune_cache = lookup
    return _rune_cache

ARENA_AUGMENTS_URL = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json"
CHERRY_AUGMENTS_URL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json"

RARITY_VALUES = {"kSilver": 0, "kGold": 1, "kPrismatic": 2}


def fetch_json(url):
    try:
        return requests.get(url, timeout=10).json()
    except (requests.RequestException, ValueError):
        print("Could not load:", url)
        return None


def cdragon_asset_url(path):
    # "/lol-game-data/assets/ASSETS/UX/Kiwi/..." -> ".../game/assets/ux/kiwi/..."
    relative = path.replace("/lol-game-data/assets/", "", 1).lower()
    return f"https://raw.communitydragon.org/latest/game/{relative}"


def get_augment_lookup():
    """maps augment IDs to name, icon URL and rarity. fetched once, then cached."""
    global _augment_cache
    if _augment_cache is not None:
        return _augment_cache

    arena = fetch_json(ARENA_AUGMENTS_URL)
    cherry = fetch_json(CHERRY_AUGMENTS_URL)

    lookup = {}

    # 1. the arena file 
    for aug in (arena or {}).get("augments", []):
        icon = aug.get("iconLarge") or aug.get("iconSmall")
        lookup[aug["id"]] = {
            "name": aug["name"],
            "iconUrl": f"https://raw.communitydragon.org/latest/game/{icon}" if icon else None,
            "rarity": aug.get("rarity", 0),
        }

    # 2. cherry-augments.json: fills in the ARAM Mayhem ("kiwi") augments the arena file is missing.
    #    setdefault means an ID already found in the arena file is never overwritten.
    for aug in cherry or []:
        icon_path = aug.get("augmentSmallIconPath")
        lookup.setdefault(aug["id"], {
            "name": aug.get("nameTRA") or aug.get("augmentNameId", ""),
            "iconUrl": cdragon_asset_url(icon_path) if icon_path else None,
            "rarity": RARITY_VALUES.get(aug.get("rarity"), 0),
        })

    if arena is not None and cherry is not None:
        _augment_cache = lookup   # only cache a complete result, so a failed download is retried
    return lookup

def arena_item(item_id, version):
    if item_id == 0:
        return None
    return {
        "iconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{item_id}.png",
        "prismatic": item_id in PRISMATIC_ID_RANGE,
    }

def summarize_arena_match(match, puuid):
    info = match["info"]
    player = next(p for p in info["participants"] if p["puuid"] == puuid)
    version = get_latest_version()

    # item6 (arcane sweeper) is skipped because everyone has it no matter what
    items = [arena_item(player.get(f"item{i}", 0), version) for i in range(6)]

    # augment slots 1-6; 0 means that slot is empty
    augment_ids = [
        player[f"playerAugment{i}"]
        for i in range(1, 7)
    ]

    augments = get_augment_lookup()
    augment_data = [
        augments.get(aug_id) or {"name": f"Augment {aug_id}", "iconUrl": None, "rarity": 0}
        for aug_id in augment_ids
    ]



    # groups players into teams by playerSubteamId, then orders the teams by placement
    teams = {}
    for p in info["participants"]:
        team = teams.setdefault(p["playerSubteamId"], {"placement": p["placement"], "players": []})
        team["players"].append({
            "puuid": p["puuid"],
            "name": p.get("riotIdGameName") or p.get("summonerName") or "Unknown",
            "tagLine": p.get("riotIdTagline", ""),
            "championName": p["championName"],
            "championIconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{p['championName']}.png",
            "isMe": p["puuid"] == puuid,
        })
    ordered_teams = sorted(teams.values(), key=lambda t: t["placement"])

    return {
        "kind": "arena",
        "matchId": match["metadata"]["matchId"],
        "queueId": info["queueId"],
        "win": player["win"],
        "placement": player["placement"],
        "championName": player["championName"],
        "championIconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{player['championName']}.png",
        "kills": player["kills"],
        "deaths": player["deaths"],
        "assists": player["assists"],
        "gameDuration": info["gameDuration"],
        "gameEndTimestamp": info.get("gameEndTimestamp") or info["gameStartTimestamp"],
        "items": items,
        "augmentIds": augment_ids,
        "augments": augment_data,
        "teams": ordered_teams,
        "champLevel": player["champLevel"],
    }

def summarize(match, puuid):
    if match["info"]["gameMode"] == "CHERRY":
        return summarize_arena_match(match, puuid)
    return summarize_match(match, puuid)

ROLE_ORDER = {"TOP": 0, "JUNGLE": 1, "MIDDLE": 2, "BOTTOM": 3, "UTILITY": 4}
def sort_by_team_and_role(p):
    return (p["teamId"], ROLE_ORDER.get(p.get("teamPosition", ""), 5))

def summarize_match(match, puuid):
    # riot's raw match object has too much data, so return only what's needed
    info = match["info"]
    player = next(p for p in info["participants"] if p["puuid"] == puuid)
    version = get_latest_version()

    #sort by team and role. columns line up based on team roles
    ordered = sorted(info["participants"], key=sort_by_team_and_role)

    players = []
    for p in ordered:
        player_dict = {
            "puuid": p["puuid"],
            "name": p.get("riotIdGameName") or p.get("summonerName") or "Unknown",
            "tagLine": p.get("riotIdTagline", ""),
            "championName": p["championName"],
            "championIconUrl": f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{p['championName']}.png",
            "teamId": p["teamId"],
            "isMe": p["puuid"] == puuid,
        }
        players.append(player_dict)

    team_kills = sum(
    p["kills"] for p in info["participants"] if p["teamId"] == player["teamId"]
    )

    spells = get_spell_lookup()
    items = [player.get(f"item{i}", 0) for i in range(7)]
    runes = get_rune_lookup()
    styles = {s["description"]: s for s in player["perks"]["styles"]}
    keystone_id = styles["primaryStyle"]["selections"][0]["perk"]
    secondary_tree_id = styles["subStyle"]["style"]

    return {
        "kind": "summonersRift",
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
        "keystoneIconUrl": runes.get(keystone_id),
        "secondaryTreeIconUrl": runes.get(secondary_tree_id),
        "champLevel": player["champLevel"],
        "players": players,
        "teamKills": team_kills,
    }