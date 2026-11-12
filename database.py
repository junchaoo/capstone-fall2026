from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Local SQLite file that stores our data
SQLALCHEMY_DATABASE_URL = "sqlite:///./lol_data.db"

# check_same_thread=False is needed because FastAPI handles requests across multiple threads
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models
Base = declarative_base()


# Dependency to get a db session per request and close it when done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()