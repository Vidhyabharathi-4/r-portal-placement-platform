from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import get_settings

settings = get_settings()
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine_args = {"connect_args": {"check_same_thread": False}} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, pool_pre_ping=True, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def ensure_sqlite_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as conn:
        inspector = inspect(conn)

        for table, columns in {
            "users": [
                ("preferences", "JSON NOT NULL DEFAULT '{}'"),
            ],
            "companies": [
                ("recruiter_status", "VARCHAR(20) NOT NULL DEFAULT 'COLD'"),
            ],
            "placement_drives": [
                ("description", "TEXT"),
                ("drive_date", "DATETIME"),
                ("departments", "TEXT"),
                ("required_skills", "TEXT"),
                ("work_mode", "VARCHAR(60)"),
                ("is_archived", "BOOLEAN NOT NULL DEFAULT 0"),
            ],
            "applications": [
                ("student_id", "INTEGER"),
            ],
            "placement_team_members": [
                ("role", "VARCHAR(120) NOT NULL DEFAULT 'Placement Officer'"),
                ("responsibility", "VARCHAR(255) NOT NULL DEFAULT ''"),
                ("assignment", "VARCHAR(255)"),
                ("is_team_lead", "BOOLEAN NOT NULL DEFAULT 0"),
                ("department", "VARCHAR(120)"),
                ("phone", "VARCHAR(30)"),
                ("joined_date", "DATETIME"),
                ("invited_by_id", "INTEGER"),
                ("invitation_status", "VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'"),
            ],
        }.items():
            existing = {column["name"] for column in inspector.get_columns(table)}
            for column_name, column_def in columns:
                if column_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_name} {column_def}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
