import re
import sys

from database import Base, engine, SessionLocal
from models import Team, Player, Account, Social

# Always in this order for each roster: Top, Jungle, Mid, ADC (bot lane), Support
ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"]

# (team name, league, region, roster)
TEAMS = [
    # LCK (Korea)
    ("Gen.G", "LCK", "KR", ["Kiin", "Canyon", "Chovy", "Ruler", "Duro"]),
    ("Hanwha Life Esports", "LCK", "KR", ["Zeus", "Kanavi", "Zeka", "Gumayusi", "Delight"]),
    ("T1", "LCK", "KR", ["Doran", "Oner", "Faker", "Peyz", "Keria"]),
    ("Dplus KIA", "LCK", "KR", ["Siwoo", "Lucid", "ShowMaker", "Smash", "Career"]),
    # LPL (China)
    ("Anyone's Legend", "LPL", "CN", ["Breathe", "Tarzan", "Shanks", "hope", "Kael"]),
    ("Bilibili Gaming", "LPL", "CN", ["bin", "XUN", "Knight", "Viper", "ON"]),
    # top laner
    ("Top Esports", "LPL", "CN", ["369", "Tian", "Creme", "JackeyLove", "Zhuo"]),
    ("Shanghai Invictus Gaming", "LPL", "CN", ["TheShy", "Wei", "Rookie", "JiaQi", "meiko"]),
    # LEC (Europe / EMEA)
    ("G2 Esports", "LEC", "EU", ["BrokenBlade", "SkewMond", "Caps", "hans sama", "Labrov"]),
    ("Movistar KOI", "LEC", "EU", ["Myrwn", "Elyoya", "jojopyun", "Supa", "Alvaro"]),
    ("Karmine Corp", "LEC", "EU", ["Canna", "Yike", "Kyeahoo", "Caliste", "Busio"]),
    # LCS (North America)
    ("Team Liquid Alienware", "LCS", "NA", ["Morgan", "Josedeodo", "Quid", "Yeon", "CoreJJ"]),
    ("LYON", "LCS", "NA", ["Dhokla", "Inspired", "Saint", "Berserker", "Isles"]),
    ("Cloud9 KIA", "LCS", "NA", ["Thanatos", "Blaber", "Loki", "Tactical", "Vulcan"]),
    # LCP (Asia-Pacific)
    ("Team Secret Whales", "LCP", "APAC", ["Pun", "Hizto", "Dire", "Eddie", "Bie"]),
    ("CTBC Flying Oyster", "LCP", "APAC", ["Rest", "Shad0w", "Pout", "Doggo", "Kino"]),
    ("MVK Esports", "LCP", "APAC", ["Kratos", "Gury", "Chika", "Harky", "SiuLoong"]),
    # CBLOL (Brazil)
    ("LOS", "CBLOL", "BR", ["ZEST", "Curse", "Feisty", "Duduhh", "Ackerman"]),
    ("FURIA Esports", "CBLOL", "BR", ["Guigo", "Tatu", "Tutsz", "Ayu", "Jojo"]),
]

SOCIALS = {
    # =========================
    # LCK
    # =========================

    "Kiin": [
        ("X", "@kiin_99", "https://x.com/kiin_99"),
        ("Instagram", "@lol_kiin", "https://www.instagram.com/lol_kiin"),
    ],

    "Canyon": [
        ("Instagram", "@canyo_n_", "https://www.instagram.com/canyo_n_/"),
    ],

    "Chovy": [
        ("X", "@j1hu1V_chovy", "https://x.com/j1hu1V_chovy"),
        ("Instagram", "@chovy_jihun", "https://www.instagram.com/chovy_jihun"),
    ],

    "Ruler": [
        ("X", "@Ruler_park", "https://x.com/Ruler_park"),
        ("Instagram", "@ruler.park", "https://www.instagram.com/ruler.park"),
    ],

    "Duro": [
    ],

    "Zeus": [
        ("Instagram", "@godthunderzeus", "https://www.instagram.com/godthunderzeus"),
    ],

    "Kanavi": [
    ],

    "Zeka": [
        ("X", "@gun8952", "https://x.com/gun8952"),
        ("Instagram", "@kkaze1128", "https://www.instagram.com/kkaze1128"),
    ],

    "Gumayusi": [
        ("X", "@gumayusi_min", "https://x.com/gumayusi_min"),
        ("Instagram", "@t1_gumayusi", "https://www.instagram.com/t1_gumayusi"),
    ],

    "Delight": [
        ("Instagram", "@lol_delight", "https://www.instagram.com/lol_delight"),
    ],

    "Doran": [
        ("X", "@doran_choi", "https://x.com/doran_choi"),
        ("Instagram", "@choi_doran", "https://www.instagram.com/choi_doran"),
    ],

    "Oner": [
        ("Instagram", "@t1_oner", "https://www.instagram.com/t1_oner"),
    ],

    "Faker": [
        ("X", "@faker", "https://x.com/faker"),
        ("Instagram", "@faker", "https://www.instagram.com/faker"),
    ],

    "Peyz": [
        ("X", "@peyz05", "https://x.com/peyz05"),
        ("Instagram", "@lol_peyz", "https://www.instagram.com/lol_peyz/"),
    ],

    "Keria": [
        ("X", "@T1Keria", "https://x.com/T1Keria"),
        ("Instagram", "@keria_minseok", "https://www.instagram.com/keria_minseok"),
    ],

    "Siwoo": [],
    "Lucid": [
        ("Instagram", "@lucid__dk", "https://www.instagram.com/lucid__dk/"),
    ],
    "ShowMaker": [
        ("Instagram", "@__showmaker", "https://www.instagram.com/__showmaker/"),
    ],
    "Smash": [],
    "Career": [],


    # =========================
    # LEC
    # =========================

    "BrokenBlade": [
        ("X", "@tsm.brokenblade", "https://x.com/tsm.brokenblade"),
    ],

    "SkewMond": [],

    "Caps": [
        ("X", "@G2Caps", "https://x.com/G2Caps"),
    ],

    "hans sama": [
        ("X", "@Hanssama", "https://x.com/Hanssama"),
    ],

    "Labrov": [],

    "Myrwn": [],
    "Elyoya": [
        ("X", "@Elyoya_LoL", "https://x.com/Elyoya_LoL"),
    ],
    "jojopyun": [
        ("X", "@jojopyunlol", "https://x.com/jojopyunlol"),
    ],
    "Supa": [
        ("X", "@Supa_LoL", "https://x.com/Supa_LoL"),
    ],
    "Alvaro": [
        ("X", "@AlVaRo710_", "https://x.com/AlVaRo710_"),
    ],

    "Canna": [
        ("X", "@CannaXDXD", "https://x.com/CannaXDXD"),
    ],
    "Yike": [
        ("X", "@YikeLoL", "https://x.com/YikeLoL"),
    ],
    "Kyeahoo": [
        ("X", "@kyeahoo0813", "https://x.com/kyeahoo0813"),
    ],
    "Caliste": [
        ("X", "@CalisteLoL", "https://x.com/CalisteLoL"),
    ],
    "Busio": [
        ("X", "@alan_cwalina", "https://x.com/alan_cwalina"),
    ],


    # =========================
    # LCS
    # =========================

    "Morgan": [
        ("X", "@lordmorganruhan", "https://x.com/lordmorganruhan"),
    ],

    "Josedeodo": [
        ("X", "@Josedeodo", "https://x.com/Josedeodo"),
    ],

    "Quid": [
        ("X", "@im_gustmd", "https://x.com/im_gustmd"),
    ],

    "Yeon": [],
    "CoreJJ": [
        ("X", "@TLCoreJJ", "https://x.com/TLCoreJJ"),
    ],

    "Dhokla": [
        ("X", "@dhoklalol", "https://x.com/dhoklalol"),
    ],

    "Inspired": [
        ("X", "@inspired.lol", "https://x.com/inspired.lol"),
    ],

    "Saint": [],
    "Berserker": [],
    "Isles": [],

    "Thanatos": [],
    "Blaber": [],
    "Loki": [],
    "Tactical": [],
    "Vulcan": [],


    # =========================
    # LCP
    # =========================

    "Pun": [],
    "Hizto": [],
    "Dire": [],
    "Eddie": [],
    "Bie": [],

    "Rest": [],
    "Shad0w": [],
    "Pout": [],
    "Doggo": [],
    "Kino": [],

    "Kratos": [],
    "Gury": [],
    "Chika": [],
    "Harky": [],
    "SiuLoong": [],


    # =========================
    # CBLOL
    # =========================

    "ZEST": [],
    "Curse": [],
    "Feisty": [],
    "Duduhh": [],
    "Ackerman": [],

    "Guigo": [],
    "Tatu": [
        ("X", "@tatulol_", "https://x.com/tatulol_"),
    ],
    "Tutsz": [
        ("X", "@tutszlol", "https://x.com/tutszlol"),
    ],
    "Ayu": [],
    "Jojo": [],
}

ORG_YOUTUBE = {
    "Gen.G": ("YouTube", "Gen.G", "https://www.youtube.com/@gengesports"),
    "Hanwha Life Esports": ("YouTube", "Hanwha Life Esports", "https://www.youtube.com/@HanwhaLifeEsports"),
    "T1": ("YouTube", "T1", "https://www.youtube.com/@SKTT1"),
    "Dplus KIA": ("YouTube", "Dplus KIA", "https://www.youtube.com/@DplusKia_LOL"),

    "Anyone's Legend": ("YouTube", "Anyone's Legend", "https://www.youtube.com/@lolesports"),
    "Bilibili Gaming": ("YouTube", "Bilibili Gaming", "https://www.youtube.com/@lolesports"),
    "Top Esports": ("YouTube", "Top Esports", "https://www.youtube.com/@lolesports"),
    "Shanghai Invictus Gaming": ("YouTube", "Invictus Gaming", "https://www.youtube.com/@iG_invictusgaming"),

    "G2 Esports": ("YouTube", "G2 Esports", "https://www.youtube.com/@G2esports"),
    "Movistar KOI": ("YouTube", "Movistar KOI", "https://www.youtube.com/@MovistarKOILoL"),
    "Karmine Corp": ("YouTube", "Karmine Corp", "https://www.youtube.com/@Karmine_Corp"),

    "Team Liquid Alienware": ("YouTube", "Team Liquid", "https://www.youtube.com/@TeamLiquidLoL"),
    "LYON": ("YouTube", "LYON", "https://www.youtube.com/@LyonLATAM"),
    "Cloud9 KIA": ("YouTube", "Cloud9", "https://www.youtube.com/@cloud9"),

    "Team Secret Whales": ("YouTube", "Team Secret", "https://www.youtube.com/@teamsecret"),
    "CTBC Flying Oyster": ("YouTube", "CTBC Flying Oyster", "https://www.youtube.com/@lolesports"),
    "MVK Esports": ("YouTube", "MVK Esports", "https://www.youtube.com/@lolesports"),

    "LOS": ("YouTube", "LOS", "https://www.youtube.com/@lolesports"),
    "FURIA Esports": ("YouTube", "FURIA", "https://www.youtube.com/@lolesports"),
}

LEAGUEPEDIA = {
    # LCK
    "Kiin": "https://lol.fandom.com/wiki/Kiin",
    "Canyon": "https://lol.fandom.com/wiki/Canyon",
    "Chovy": "https://lol.fandom.com/wiki/Chovy",
    "Ruler": "https://lol.fandom.com/wiki/Ruler",
    "Duro": "https://lol.fandom.com/wiki/Duro",

    "Zeus": "https://lol.fandom.com/wiki/Zeus",
    "Kanavi": "https://lol.fandom.com/wiki/Kanavi",
    "Zeka": "https://lol.fandom.com/wiki/Zeka",
    "Gumayusi": "https://lol.fandom.com/wiki/Gumayusi",
    "Delight": "https://lol.fandom.com/wiki/Delight",

    "Doran": "https://lol.fandom.com/wiki/Doran",
    "Oner": "https://lol.fandom.com/wiki/Oner",
    "Faker": "https://lol.fandom.com/wiki/Faker",
    "Peyz": "https://lol.fandom.com/wiki/Peyz",
    "Keria": "https://lol.fandom.com/wiki/Keria",

    "Siwoo": "https://lol.fandom.com/wiki/Siwoo",
    "Lucid": "https://lol.fandom.com/wiki/Lucid",
    "ShowMaker": "https://lol.fandom.com/wiki/ShowMaker",
    "Smash": "https://lol.fandom.com/wiki/Smash",
    "Career": "https://lol.fandom.com/wiki/Career",

    # LPL
    "Breathe": "https://lol.fandom.com/wiki/Breathe",
    "Tarzan": "https://lol.fandom.com/wiki/Tarzan",
    "Shanks": "https://lol.fandom.com/wiki/Shanks",
    "hope": "https://lol.fandom.com/wiki/Hope",
    "Kael": "https://lol.fandom.com/wiki/Kael",

    "bin": "https://lol.fandom.com/wiki/Bin",
    "XUN": "https://lol.fandom.com/wiki/XUN",
    "Knight": "https://lol.fandom.com/wiki/Knight",
    "Viper": "https://lol.fandom.com/wiki/Viper",
    "ON": "https://lol.fandom.com/wiki/ON",

    "369": "https://lol.fandom.com/wiki/369",
    "Tian": "https://lol.fandom.com/wiki/Tian",
    "Creme": "https://lol.fandom.com/wiki/Creme",
    "JackeyLove": "https://lol.fandom.com/wiki/JackeyLove",
    "Zhuo": "https://lol.fandom.com/wiki/Zhuo",

    "TheShy": "https://lol.fandom.com/wiki/TheShy",
    "Wei": "https://lol.fandom.com/wiki/Wei",
    "Rookie": "https://lol.fandom.com/wiki/Rookie",
    "JiaQi": "https://lol.fandom.com/wiki/JiaQi",
    "meiko": "https://lol.fandom.com/wiki/Meiko",

    # LEC
    "BrokenBlade": "https://lol.fandom.com/wiki/BrokenBlade",
    "SkewMond": "https://lol.fandom.com/wiki/SkewMond",
    "Caps": "https://lol.fandom.com/wiki/Caps",
    "hans sama": "https://lol.fandom.com/wiki/Hans_Sama",
    "Labrov": "https://lol.fandom.com/wiki/Labrov",

    "Myrwn": "https://lol.fandom.com/wiki/Myrwn",
    "Elyoya": "https://lol.fandom.com/wiki/Elyoya",
    "jojopyun": "https://lol.fandom.com/wiki/Jojopyun",
    "Supa": "https://lol.fandom.com/wiki/Supa",
    "Alvaro": "https://lol.fandom.com/wiki/Alvaro",

    "Canna": "https://lol.fandom.com/wiki/Canna",
    "Yike": "https://lol.fandom.com/wiki/Yike",
    "Kyeahoo": "https://lol.fandom.com/wiki/Kyeahoo",
    "Caliste": "https://lol.fandom.com/wiki/Caliste",
    "Busio": "https://lol.fandom.com/wiki/Busio",

    # LCS
    "Morgan": "https://lol.fandom.com/wiki/Morgan",
    "Josedeodo": "https://lol.fandom.com/wiki/Josedeodo",
    "Quid": "https://lol.fandom.com/wiki/Quid",
    "Yeon": "https://lol.fandom.com/wiki/Yeon",
    "CoreJJ": "https://lol.fandom.com/wiki/CoreJJ",

    "Dhokla": "https://lol.fandom.com/wiki/Dhokla",
    "Inspired": "https://lol.fandom.com/wiki/Inspired",
    "Saint": "https://lol.fandom.com/wiki/Saint",
    "Berserker": "https://lol.fandom.com/wiki/Berserker",
    "Isles": "https://lol.fandom.com/wiki/Isles",

    "Thanatos": "https://lol.fandom.com/wiki/Thanatos",
    "Blaber": "https://lol.fandom.com/wiki/Blaber",
    "Loki": "https://lol.fandom.com/wiki/Loki",
    "Tactical": "https://lol.fandom.com/wiki/Tactical",
    "Vulcan": "https://lol.fandom.com/wiki/Vulcan",

    # LCP
    "Pun": "https://lol.fandom.com/wiki/Pun",
    "Hizto": "https://lol.fandom.com/wiki/Hizto",
    "Dire": "https://lol.fandom.com/wiki/Dire",
    "Eddie": "https://lol.fandom.com/wiki/Eddie",
    "Bie": "https://lol.fandom.com/wiki/Bie",

    "Rest": "https://lol.fandom.com/wiki/Rest",
    "Shad0w": "https://lol.fandom.com/wiki/Shad0w",
    "Pout": "https://lol.fandom.com/wiki/Pout",
    "Doggo": "https://lol.fandom.com/wiki/Doggo",
    "Kino": "https://lol.fandom.com/wiki/Kino",

    "Kratos": "https://lol.fandom.com/wiki/Kratos",
    "Gury": "https://lol.fandom.com/wiki/Gury",
    "Chika": "https://lol.fandom.com/wiki/Chika",
    "Harky": "https://lol.fandom.com/wiki/Harky",
    "SiuLoong": "https://lol.fandom.com/wiki/SiuLoong",

    # CBLOL
    "ZEST": "https://lol.fandom.com/wiki/Zest",
    "Curse": "https://lol.fandom.com/wiki/Curse",
    "Feisty": "https://lol.fandom.com/wiki/Feisty",
    "Duduhh": "https://lol.fandom.com/wiki/Duduhh",
    "Ackerman": "https://lol.fandom.com/wiki/Ackerman",

    "Guigo": "https://lol.fandom.com/wiki/Guigo",
    "Tatu": "https://lol.fandom.com/wiki/Tatu",
    "Tutsz": "https://lol.fandom.com/wiki/Tutsz",
    "Ayu": "https://lol.fandom.com/wiki/Ayu",
    "Jojo": "https://lol.fandom.com/wiki/Jojo",
}

ACCOUNTS = {
    # =========================
    # LCK
    # =========================

    "Kiin": [
    ],

    "Canyon": [
        "JUGKlNG#kr",
        "asfdwrqe#123",
        "doyouknowkimchi",
        "밴쿠버#123",
        "São Paulo#3628",
        "Concrete jungle#USA",
    ],

    "Chovy": [
        "허거덩#0303",
        "calm down#can",
    ],

    "Ruler": [
        "강 철#샤 넬",
        "proteinmonster#thief",
    ],

    "Duro": [
        "New York#1114",
    ],

    "Zeus": [
        "Athene#lll",
        "Austin#lll",
    ],

    "Kanavi": [
        "Lillie#397",
    ],

    "Zeka": [
        "DAZBEEE#777",
    ],

    "Gumayusi": [
        "HLE Gumayusi#0298",
        "Know my name#9999",
    ],

    "Delight": [
        "2026sup1#111",
    ],

    "Doran": [
        "buriburii#1234",
    ],

    "Oner": [
        "오 너#111",
        "hi hello#12341",
    ],

    "Faker": [
        "Hide on bush#KR1",
        "Hide on bush#61151",
        "Hide in bush#NYKR",
    ],

    "Peyz": [
        "Peyz#KR11",
        "gaesalbuger#aaaa",
    ],

    "Keria": [
        "Ciro#KR10",
        "doryunnim#Frank",
    ],

    "Siwoo": [
        "Siuuuuuuuuuuuuuu#yarrr",
    ],

    "Lucid": [
        "tyjoierg#123",
    ],

    "ShowMaker": [
        "Sonny Hayes#722",
    ],

    "Smash": [
        "123321#KR12",
    ],

    "Career": [
        "하이용#1015",
    ],


    # =========================
    # LPL
    # =========================

    "Breathe": [
    ],

    "Tarzan": [
    ],

    "Shanks": [
    ],

    "hope": [
    ],

    "Kael": [
    ],

    "bin": [
        "hfdgjhfgdnh#123",
    ],

    "XUN": [
        "Xun#OOK",
        "eewqoeowqeqwoo#2223",
    ],

    "Knight": [
    ],

    "Viper": [
        "painn#110",
    ],

    "ON": [
        "SUP08WH",
        "KiZiED",
        "키보드에음료쏟아서고장내는이도윤#KR1",
        "BLG 온#KR1",
        "onc#12345",
        "TFTChallenger#11111",
        "burgershutiao#zxcvb",
    ],

    "369": [
        "haohaohao",
        "qsxmiocmio#KR1",
        "JZDKVFYPNO#EUW",
        "MM9 ghost#NA1",
        "godrjs#gktpd",
    ],

    "Tian": [
    ],

    "Creme": [
    ],

    "JackeyLove": [
    ],

    "Zhuo": [
    ],

    "TheShy": [
    ],

    "Wei": [
        "qweasdzxc#TWSJM",
    ],

    "Rookie": [
        "把我当成一颗树叭",
        "QWEASDQWE123",
        "所有事都要一起#KR1",
        "dyjkbysb#KR1",
        "asdfzxcvasdfwqer#KR2",
        "v0PnXqLxFmfcD83s",
    ],

    "JiaQi": [
        "Whymesod1ao#Jiaq3",
    ],

    "meiko": [
        "qweasdqweasdb#1372",
        "cinema",
        "iv0ry tower",
    ],


    # =========================
    # LEC
    # =========================

    "BrokenBlade": [
        "Broken Blade#1918",
        "G2 BrokenBlade#1819",
        "1a2b3c4d5f6",
        "str8 beefy mode",
        "asdovjstsmapibb",
        "YassuoSanchovies",
        "G2 Fogo de Chão#1918",
        "BrokenBlade#12345",
    ],

    "SkewMond": [
        "G2 Egghead#Bald",
    ],

    "Caps": [
        "G2 Caps#1323",
        "G2 Caps#1324",
        "A 99 mid laner#EUW",
        "Speedy McJingles#EUW",
    ],

    "hans sama": [
        "Hans von melzer#1234",
    ],

    "Labrov": [
        "cheap book key#6767",
    ],

    "Myrwn": [
        "Lamine Yamal#Annie",
        "MANZANA VAPE#TFNYS",
        "Bb trickz#Tipz",
    ],

    "Elyoya": [
        "Yoyadeodo#tuki",
    ],

    "jojopyun": [
        "jojooooooooo#9999",
    ],

    "Supa": [
        "Charmander#MKOI",
    ],

    "Alvaro": [
        "alvarooo#EUW",
        "Articuno#sup",
    ],

    "Canna": [
        "칸 나#0211",
        "K C#kcwin",
        "worldspro0073#world",
    ],

    "Yike": [
        "quentin#dawg",
    ],

    "Kyeahoo": [
        "yeahoo#yaho",
    ],

    "Caliste": [
        "MASTERMOVE#WORLD",
    ],

    "Busio": [
        "KC Busio#000",
    ],


    # =========================
    # LCS
    # =========================

    "Morgan": [
        "PORDER#MON",
    ],

    "Josedeodo": [
        "Josedeodo#NA12",
    ],

    "Quid": [
    ],

    "Yeon": [
        "TL Yeon#7lol",
    ],

    "CoreJJ": [
        "From Iron#1123",
        "리퀴드 코어장전#KR1",
        "TL Honda CoreJJ#EUEU",
        "avatar2",
        "TL Honda CoreJJ#LTAN",
    ],

    "Dhokla": [
        "Dhokla#NA1",
    ],

    "Inspired": [
        "a Special One#1of1",
    ],

    "Saint": [
        "Jesse Pinkman#LYON",
    ],

    "Berserker": [
        "LYON Berserker#ddd",
    ],

    "Isles": [
        "depresion#NA2",
    ],

    "Thanatos": [
        "Thanatoes#kr2",
    ],

    "Blaber": [
        "blaberfish2#NA1",
    ],

    "Loki": [
        "C9 Loki#kr3",
    ],

    "Tactical": [
        "Tactical0#NA1",
    ],

    "Vulcan": [
        "VULCAN#5125",
    ],


    # =========================
    # LCP
    # =========================

    "Pun": [
        "aesansang#hihi",
    ],

    "Hizto": [
        "Hizto#KR2",
        "chimorangrua#LCP1",
        "hjzt0ahjhj#KR2",
        "New York#15097",
    ],

    "Dire": [
        "reina#244",
    ],

    "Eddie": [
    ],

    "Bie": [
    ],

    "Rest": [
    ],

    "Shad0w": [
    ],

    "Pout": [
        "bug cat capoo#123",
    ],

    "Doggo": [
    ],

    "Kino": [
    ],

    "Kratos": [
        "Ayanokoji#2005",
    ],

    "Gury": [
        "big fish crew#666",
    ],

    "Chika": [
        "Phuong My Chi#2026",
    ],

    "Harky": [
    ],

    "SiuLoong": [
    ],


    # =========================
    # CBLOL
    # =========================

    "ZEST": [
    ],

    "Curse": [
    ],

    "Feisty": [
        "7777케이",
    ],

    "Duduhh": [
    ],

    "Ackerman": [
    ],

    "Guigo": [
    ],

    "Tatu": [
    ],

    "Tutsz": [
    ],

    "Ayu": [
        "Yahallo#2610",
    ],

    "Jojo": [
    ],
}

def slug(text: str) -> str:
    """'Gen.G' -> 'gen-g', 'hans sama' -> 'hans-sama'"""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def seed(reset: bool = False) -> None:
    Base.metadata.create_all(bind=engine)  # makes sure the tables exist
    db = SessionLocal()
    try:
        if reset:
            db.query(Social).delete()
            db.query(Account).delete()
            db.query(Player).delete()
            db.query(Team).delete()
            db.commit()
            print("Cleared teams, players, accounts and socials.")

        if db.query(Team).count() > 0:
            print("Already seeded - nothing to do. (Use --reset to start over.)")
            return

        for team_name, league, region, roster in TEAMS:
            team = Team(
                name=team_name,
                league=league,
                region=region,
                logo_url=f"/logos/{slug(team_name)}.webp",
            )
            db.add(team)

            for role, ign in zip(ROLES, roster):
                player_slug = f"{slug(team_name)}-{slug(ign)}"

                player = Player(
                    slug=player_slug,
                    name=ign,
                    role=role,
                    photo_url=f"/players/{player_slug}.webp",
                    leaguepedia_url=LEAGUEPEDIA.get(ign),
                )

                for username in ACCOUNTS.get(ign, []):
                    player.accounts.append(
                        Account(name=username)
                    )
                
                # Add the players social accounts
                socials = SOCIALS.get(ign, []).copy()

                if team_name in ORG_YOUTUBE:
                    socials.append(ORG_YOUTUBE[team_name])

                for platform, handle, url in socials:
                    player.socials.append(
                        Social(
                            platform=platform,
                            handle=handle,
                            url=url,
                        )
                    )

                team.players.append(player)

        db.commit()
        print(f"Seeded {len(TEAMS)} teams and {len(TEAMS) * 5} players.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)