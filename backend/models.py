from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    league = Column(String, nullable=False)      
    region = Column(String, nullable=False)      
    logo_url = Column(String, nullable=True)     

    players = relationship("Player", back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)  
    name = Column(String, nullable=False)                            
    role = Column(String, nullable=False)                            
    photo_url = Column(String, nullable=True)
    leaguepedia_url = Column(String, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    team = relationship("Team", back_populates="players")
    accounts = relationship("Account", back_populates="player", cascade="all, delete-orphan")
    socials = relationship("Social", back_populates="player", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    player = relationship("Player", back_populates="accounts")


class Social(Base):
    __tablename__ = "socials"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, nullable=False)    
    handle = Column(String, nullable=False)
    url = Column(String, nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    player = relationship("Player", back_populates="socials")

class LadderEntry(Base):
    __tablename__ = "ladder_entries"
    __table_args__ = (UniqueConstraint("region", "puuid", name="uq_ladder_region_puuid"),)
 
    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True, nullable=False)   
    puuid = Column(String, nullable=False)                 #riots permanent player ID
    game_name = Column(String, nullable=False, default="")  #riot ID name
    tag_line = Column(String, nullable=False, default="")   #riot ID tag 
    tier = Column(String, nullable=False)                 #ranks
    lp = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, nullable=False)         #when this row was fetched 