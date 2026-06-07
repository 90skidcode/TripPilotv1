#!/usr/bin/env python
"""Migration script to add Meta integration columns and create messages table."""

from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        print("[INFO] Checking organizations table columns...")
        
        # Add meta_access_token
        try:
            conn.execute(text("SELECT meta_access_token FROM organizations LIMIT 1"))
            print("[OK] 'meta_access_token' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'meta_access_token' column to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN meta_access_token VARCHAR(500) NULL"))
            conn.commit()
            print("[OK] Added 'meta_access_token'.")

        # Add meta_verify_token
        try:
            conn.execute(text("SELECT meta_verify_token FROM organizations LIMIT 1"))
            print("[OK] 'meta_verify_token' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'meta_verify_token' column to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN meta_verify_token VARCHAR(200) NULL"))
            conn.commit()
            print("[OK] Added 'meta_verify_token'.")

        # Add whatsapp_phone_number_id
        try:
            conn.execute(text("SELECT whatsapp_phone_number_id FROM organizations LIMIT 1"))
            print("[OK] 'whatsapp_phone_number_id' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'whatsapp_phone_number_id' column to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN whatsapp_phone_number_id VARCHAR(100) NULL"))
            conn.commit()
            print("[OK] Added 'whatsapp_phone_number_id'.")

        # Add instagram_page_id
        try:
            conn.execute(text("SELECT instagram_page_id FROM organizations LIMIT 1"))
            print("[OK] 'instagram_page_id' column already exists in organizations table.")
        except Exception:
            print("[MIGRATE] Adding 'instagram_page_id' column to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN instagram_page_id VARCHAR(100) NULL"))
            conn.commit()
            print("[OK] Added 'instagram_page_id'.")

        print("[INFO] Checking leads table columns...")
        # Add instagram_username
        try:
            conn.execute(text("SELECT instagram_username FROM leads LIMIT 1"))
            print("[OK] 'instagram_username' column already exists in leads table.")
        except Exception:
            print("[MIGRATE] Adding 'instagram_username' column to leads...")
            conn.execute(text("ALTER TABLE leads ADD COLUMN instagram_username VARCHAR(100) NULL"))
            conn.commit()
            print("[OK] Added 'instagram_username'.")

        print("[INFO] Checking messages table...")
        # Create messages table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                lead_id INT NULL,
                channel VARCHAR(50) NOT NULL,
                sender_type VARCHAR(50) NOT NULL,
                sender_id VARCHAR(100) NOT NULL,
                message_text TEXT NULL,
                meta_message_id VARCHAR(255) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
                INDEX (org_id),
                INDEX (lead_id),
                INDEX (channel)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))
        conn.commit()
        print("[OK] messages table verified/created.")

        print("=" * 60)
        print("Meta integration database migration completed successfully!")
        print("=" * 60)

if __name__ == "__main__":
    migrate()
