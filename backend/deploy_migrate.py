import os
import sys
from sqlalchemy import create_engine, inspect
from alembic.config import Config
from alembic import command
import logging

logging.basicConfig(level=logging.INFO)

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not set, relying on alembic.ini defaults if any.")
    # We will try to rely on env.py pulling from os.environ or config
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    sys.exit(0)

# Render postgres URLs sometimes use postgres:// but sqlalchemy needs postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
    os.environ["DATABASE_URL"] = db_url

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    has_organizations = "organizations" in tables
    has_alembic_version = "alembic_version" in tables

    alembic_cfg = Config("alembic.ini")

    if has_organizations and not has_alembic_version:
        print("Existing database found without alembic tracking. Stamping to baseline.")
        command.stamp(alembic_cfg, "0792e455d8dd")
    
    print("Running migrations...")
    command.upgrade(alembic_cfg, "head")
    print("Migrations complete.")
except Exception as e:
    print(f"Error during migration: {e}")
    sys.exit(1)
