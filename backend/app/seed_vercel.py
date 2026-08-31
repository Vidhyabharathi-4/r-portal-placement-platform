from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import app.database
import app.seed_companies_and_drives
import app.seed_students

# The active Neon connection string used by the production Vercel app:
vercel_db_url = "postgresql://neondb_owner:npg_WwkAQiEUX79s@ep-lucky-mode-a1dgv0b3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Adjust driver dialect for psycopg 3
if vercel_db_url.startswith("postgresql://"):
    vercel_db_url = vercel_db_url.replace("postgresql://", "postgresql+psycopg://", 1)

print("Connecting directly to Vercel production Neon database...")
engine = create_engine(vercel_db_url, pool_pre_ping=True)
SessionLocalOverride = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Inject the override engine and session factory into the database module and seeders
app.database.engine = engine
app.database.SessionLocal = SessionLocalOverride
app.seed_companies_and_drives.SessionLocal = SessionLocalOverride
app.seed_students.SessionLocal = SessionLocalOverride

print("\n--- Running Schema Migrations / Updates on Vercel Neon Database ---")
app.database.ensure_sqlite_schema()

print("\n--- Seeding Companies & Placement Drives ---")
app.seed_companies_and_drives.seed_companies_and_drives()

print("\n--- Seeding 120 Student Profiles ---")
app.seed_students.seed_students()

print("\nDirect Vercel Neon database seeding completed successfully!")
