from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./lol_data.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def migrate_match_record_columns(db_engine):
    columns = {
        "cs_total": "INTEGER",
        "cs_per_min": "FLOAT",
        "vision_score": "INTEGER",
        "role_played": "VARCHAR",
        "primary_style": "INTEGER",
        "keystone_id": "INTEGER",
        "sub_style": "INTEGER",
    }
    existing = {column["name"] for column in inspect(db_engine).get_columns("match_records")}
    with db_engine.begin() as connection:
        for name, column_type in columns.items():
            if name not in existing:
                connection.exec_driver_sql(f"ALTER TABLE match_records ADD COLUMN {name} {column_type}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()