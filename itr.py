import httpx

DDRAGON_VERSION = "14.1.1"
CHAMPION_MAP = {}
ITEM_MAP = {}
SPELL_MAP = {}
RUNE_MAP = {}
PERK_MAP = {}

CORE_QUEUES = {
    400: "Normal Draft Pick",
    440: "Ranked Flex",
    450: "Standard ARAM",
    480: "Swiftplay",
}

async def load_datadragon_mappings():
    global DDRAGON_VERSION, CHAMPION_MAP, ITEM_MAP, SPELL_MAP, RUNE_MAP, PERK_MAP

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            versions_res = await client.get("https://ddragon.leagueoflegends.com/api/versions.json")
            if versions_res.status_code == 200:
                DDRAGON_VERSION = versions_res.json()[0]
        except Exception as e:
            print(f"[DDragon] Version fetch failed: {e}")

        base_url = f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/data/en_US"
        cdn_img_base = f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/img"

        try:
            champ_res = await client.get(f"{base_url}/champion.json")
            CHAMPION_MAP = {
                int(details["key"]): {
                    "name": details["name"],
                    "id": details["id"],
                    "icon": f"{cdn_img_base}/champion/{details['image']['full']}",
                }
                for details in champ_res.json()["data"].values()
            }
        except Exception as e:
            print(f"[DDragon] Champion mapping error: {e}")

        try:
            item_res = await client.get(f"{base_url}/item.json")
            ITEM_MAP = {
                int(item_id): {
                    "name": details["name"],
                    "icon": f"{cdn_img_base}/item/{details['image']['full']}",
                }
                for item_id, details in item_res.json()["data"].items()
            }
        except Exception as e:
            print(f"[DDragon] Item mapping error: {e}")

        try:
            spell_res = await client.get(f"{base_url}/summoner.json")
            SPELL_MAP = {
                int(details["key"]): {
                    "name": details["name"],
                    "id": details["id"],
                    "icon": f"{cdn_img_base}/spell/{details['image']['full']}",
                }
                for details in spell_res.json()["data"].values()
            }
        except Exception as e:
            print(f"[DDragon] Spell mapping error: {e}")

        try:
            rune_res = await client.get(f"{base_url}/runesReforged.json")
            for tree in rune_res.json():
                RUNE_MAP[tree["id"]] = {
                    "name": tree["name"],
                    "icon": f"https://ddragon.leagueoflegends.com/cdn/img/{tree['icon']}",
                }
                for slot in tree.get("slots", []):
                    for rune in slot.get("runes", []):
                        PERK_MAP[rune["id"]] = {
                            "name": rune["name"],
                            "icon": f"https://ddragon.leagueoflegends.com/cdn/img/{rune['icon']}",
                        }
        except Exception as e:
            print(f"[DDragon] Rune mapping error: {e}")

def get_item_details(raw_item_ids):
    item_details_list = []
    for item_id in raw_item_ids:
        if item_id == 0:
            item_details_list.append({"id": 0, "name": "Empty Slot", "icon": ""})
        else:
            item_info = ITEM_MAP.get(item_id, {"name": f"Unknown Item ({item_id})", "icon": ""})
            item_details_list.append({"id": item_id, "name": item_info["name"], "icon": item_info.get("icon", "")})
    return item_details_list

def get_spell_details(raw_spell_ids):
    spell_details_list = []
    for spell_id in raw_spell_ids:
        if not spell_id:
            spell_details_list.append({"id": 0, "name": "None", "icon": ""})
        else:
            spell_info = SPELL_MAP.get(int(spell_id), {"name": f"Unknown Spell ({spell_id})", "icon": ""})
            spell_details_list.append({"id": spell_id, "name": spell_info["name"], "icon": spell_info.get("icon", "")})
    return spell_details_list

def get_champion_details(champion_name: str):
    for details in CHAMPION_MAP.values():
        if details["name"].lower() == champion_name.lower() or details["id"].lower() == champion_name.lower():
            return {"name": details["name"], "icon": details["icon"]}
    return {"name": champion_name, "icon": f"https://ddragon.leagueoflegends.com/cdn/{DDRAGON_VERSION}/img/champion/{champion_name}.png"}

def get_rune_details(primary_style: int, keystone_id: int, sub_style: int):
    primary_info = RUNE_MAP.get(primary_style, {"name": f"Unknown Tree ({primary_style})", "icon": ""})
    sub_info = RUNE_MAP.get(sub_style, {"name": f"Unknown Tree ({sub_style})", "icon": ""})
    keystone_info = PERK_MAP.get(keystone_id, {"name": f"Unknown Keystone ({keystone_id})", "icon": ""})
    return {
        "primary_tree": {"id": primary_style, "name": primary_info["name"], "icon": primary_info["icon"]},
        "keystone": {"id": keystone_id, "name": keystone_info["name"], "icon": keystone_info["icon"]},
        "sub_tree": {"id": sub_style, "name": sub_info["name"], "icon": sub_info["icon"]}
    }