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
    is_postgres = not settings.database_url.startswith("sqlite")

    with engine.begin() as conn:
        if is_postgres:
            try:
                conn.execute(text("ALTER TYPE recruiterstatus ADD VALUE IF NOT EXISTS 'DRIVE_COMPLETED'"))
            except Exception:
                pass

        inspector = inspect(conn)
        existing_tables = set(inspector.get_table_names())

        table_defs = {
            "users": [
                ("preferences", "JSON NOT NULL DEFAULT '{}'"),
            ],
            "companies": [
                ("recruiter_status", "VARCHAR(20) NOT NULL DEFAULT 'COLD'"),
                ("contact_phone", "VARCHAR(30)"),
                ("contact_designation", "VARCHAR(120) DEFAULT 'HR Manager'"),
                ("logo_url", "VARCHAR(500)"),
                ("notes", "TEXT"),
                ("last_contacted_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ],
            "placement_drives": [
                ("description", "TEXT"),
                ("drive_date", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
                ("departments", "TEXT"),
                ("required_skills", "TEXT"),
                ("work_mode", "VARCHAR(60)"),
                ("is_archived", "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0"),
            ],
            "applications": [
                ("student_id", "INTEGER"),
            ],
            "placement_team_members": [
                ("role", "VARCHAR(120) NOT NULL DEFAULT 'Placement Officer'"),
                ("responsibility", "VARCHAR(255) NOT NULL DEFAULT ''"),
                ("assignment", "VARCHAR(255)"),
                ("is_team_lead", "BOOLEAN NOT NULL DEFAULT FALSE" if is_postgres else "BOOLEAN NOT NULL DEFAULT 0"),
                ("department", "VARCHAR(120)"),
                ("phone", "VARCHAR(30)"),
                ("joined_date", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
                ("invited_by_id", "INTEGER"),
                ("invitation_status", "VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'"),
            ],
        }

        for table, columns in table_defs.items():
            if table not in existing_tables:
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for column_name, column_def in columns:
                if column_name not in existing:
                    try:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_name} {column_def}"))
                    except Exception:
                        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
