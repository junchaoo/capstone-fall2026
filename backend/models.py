from sqlalchemy import Column, Integer, String, ForeignKey
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