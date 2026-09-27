"""
Database setup — creates a local SQLite file and gives us a
'session' object that the rest of the app uses to talk to it.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# This creates a file called app.db in the same folder when the app runs.
# SQLite is just a single file on disk — no separate server needed.
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All our table models (see models.py) will inherit from this
Base = declarative_base()


def get_db():
    """
    Used by FastAPI as a 'dependency' — gives each request its own
    database session, and closes it automatically when done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
