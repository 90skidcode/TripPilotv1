#!/usr/bin/env python
"""Migration script to add new agency and user fields to database."""

from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        print("[INFO] Checking organizations table columns...")
        
        # Check if phone_number already exists in organizations
        try:
            conn.execute(text("SELECT phone_number FROM organizations LIMIT 1"))
            print("[OK] 'phone_number' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'phone_number' column to organizations table...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN phone_number VARCHAR(50) NULL AFTER plan"))
            conn.commit()
            print("[OK] Successfully added 'phone_number' column to organizations table.")

        # Check if logo_url already exists in organizations
        try:
            conn.execute(text("SELECT logo_url FROM organizations LIMIT 1"))
            print("[OK] 'logo_url' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'logo_url' column to organizations table...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN logo_url VARCHAR(500) NULL AFTER phone_number"))
            conn.commit()
            print("[OK] Successfully added 'logo_url' column to organizations table.")

        print("[INFO] Checking users table columns...")
        # Check if phone_number already exists in users
        try:
            conn.execute(text("SELECT phone_number FROM users LIMIT 1"))
            print("[OK] 'phone_number' column already exists in users table.")
        except Exception:
            print("[MIGRATE] Adding 'phone_number' column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) NULL AFTER email"))
            conn.commit()
            print("[OK] Successfully added 'phone_number' column to users table.")

        conn.commit()
        print("=" * 60)
        print("Database migration completed successfully!")
        print("=" * 60)

if __name__ == "__main__":
    migrate()
