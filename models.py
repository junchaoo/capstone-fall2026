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
    queue_id = Column(Integer, nullable=True)
    champion_name = Column(String)
    outcome = Column(String)
    win = Column(Boolean)
    kills = Column(Integer)
    deaths = Column(Integer)
    assists = Column(Integer)
    kda_ratio = Column(Float)
    items_json = Column(String) 
    game_mode = Column(String)
    game_duration_seconds = Column(Integer)
    cs_total = Column(Integer, default=0)
    cs_per_min = Column(Float, default=0.0)
    vision_score = Column(Integer, default=0)
    role_played = Column(String, default="UNKNOWN")
    primary_style = Column(Integer, nullable=True)
    keystone_id = Column(Integer, nullable=True)
    sub_style = Column(Integer, nullable=True)