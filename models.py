from database import Base
from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String


class Player(Base):
    __tablename__ = "players"

    # Use PUUID as primary key since Riot IDs can change (PUUID remains permanent)
    puuid = Column(String, primary_key=True, index=True)
    game_name = Column(String, index=True)
    tag_line = Column(String)
    summoner_level = Column(Integer, default=0)


class MatchRecord(Base):
    __tablename__ = "match_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, index=True)
    puuid = Column(String, ForeignKey("players.puuid"), index=True)
    champion_name = Column(String)
    outcome = Column(String)
    win = Column(Boolean)
    kills = Column(Integer)
    deaths = Column(Integer)
    assists = Column(Integer)
    kda_ratio = Column(Float)
    items_json = Column(String)  # Stored as serialized string, e.g. "[3161, 3073, 6333]"
    game_mode = Column(String)
    game_duration_seconds = Column(Integer)