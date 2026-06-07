#!/usr/bin/env python
"""Create followups table for lead follow-up tracking."""

from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        # Create followups table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS followups (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))

        # Create index on lead_id for faster queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON followups(lead_id)
        """))

        # Create index on scheduled_date for sorting
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date)
        """))

        conn.commit()
        print("✅ Successfully created followups table")

if __name__ == "__main__":
    migrate()
