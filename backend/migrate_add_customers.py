#!/usr/bin/env python
"""
Migration: Add Customers table and refactor Leads to use customer_id FK
This script will:
1. Create the new customers table
2. Migrate existing leads to use customers (creating customer records from lead data)
3. Update leads to reference customers
"""

import sys
from sqlalchemy import text
from app.core.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Starting migration: Add Customers table...")

        # Step 1: Create customers table (without UNIQUE constraint on phone first)
        print("\n1. Creating customers table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                whatsapp_number VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (org_id),
                INDEX (phone),
                INDEX (email),
                UNIQUE KEY unique_phone_per_org (org_id, phone),
                FOREIGN KEY (org_id) REFERENCES organizations(id)
            )
        """))
        db.commit()
        print("   OK: customers table created")

        # Step 2: Check if leads table already has customer_id column
        print("\n2. Checking leads table structure...")
        result = db.execute(text("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'leads' AND COLUMN_NAME = 'customer_id'
        """)).fetchone()

        if result:
            print("   OK: customer_id column already exists in leads table")
        else:
            print("   Adding customer_id column to leads table...")
            db.execute(text("""
                ALTER TABLE leads ADD COLUMN customer_id INT AFTER org_id
            """))
            db.commit()
            print("   OK: customer_id column added")

        # Step 3: Migrate existing leads to customers using raw SQL
        print("\n3. Migrating existing leads to customers...")

        # Get all leads with customer_id = NULL, ordered by org_id and phone
        leads = db.execute(text("""
            SELECT id, org_id, name, phone, email, whatsapp_number FROM leads WHERE customer_id IS NULL
            ORDER BY org_id, phone
        """)).fetchall()

        created_count = 0
        linked_count = 0

        for lead_id, org_id, name, phone, email, whatsapp_number in leads:
            # Try to find existing customer with same phone in same org
            existing = db.execute(text("""
                SELECT id FROM customers WHERE phone = :phone AND org_id = :org_id LIMIT 1
            """), {"phone": phone, "org_id": org_id}).fetchone()

            if existing:
                customer_id = existing[0]
                linked_count += 1
            else:
                # Create new customer
                try:
                    db.execute(text("""
                        INSERT INTO customers (org_id, name, phone, email, whatsapp_number)
                        VALUES (:org_id, :name, :phone, :email, :whatsapp_number)
                    """), {
                        "org_id": org_id,
                        "name": name,
                        "phone": phone,
                        "email": email,
                        "whatsapp_number": whatsapp_number,
                    })
                    db.commit()
                    result = db.execute(text("""
                        SELECT id FROM customers WHERE phone = :phone AND org_id = :org_id LIMIT 1
                    """), {"phone": phone, "org_id": org_id}).fetchone()
                    customer_id = result[0]
                    created_count += 1
                except Exception as e:
                    print(f"   WARNING: Could not create customer for lead {lead_id}: {str(e)}")
                    # Try to find it anyway
                    result = db.execute(text("""
                        SELECT id FROM customers WHERE phone = :phone AND org_id = :org_id LIMIT 1
                    """), {"phone": phone, "org_id": org_id}).fetchone()
                    if result:
                        customer_id = result[0]
                    else:
                        continue

            # Update lead with customer_id
            try:
                db.execute(text("""
                    UPDATE leads SET customer_id = :customer_id WHERE id = :lead_id
                """), {"customer_id": customer_id, "lead_id": lead_id})
                db.commit()
            except Exception as e:
                print(f"   WARNING: Could not link lead {lead_id} to customer: {str(e)}")
                db.rollback()

        print(f"   OK: Created {created_count} new customers, linked {linked_count} leads to existing customers")

        # Step 4: Remove old columns from leads
        print("\n4. Cleaning up old columns from leads table...")

        columns_to_remove = ['name', 'phone', 'email', 'whatsapp_number', 'instagram_username', 'num_travellers']

        for col in columns_to_remove:
            try:
                result = db.execute(text(f"""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'leads' AND COLUMN_NAME = '{col}'
                """)).fetchone()

                if result:
                    db.execute(text(f"ALTER TABLE leads DROP COLUMN `{col}`"))
                    db.commit()
                    print(f"   OK: Dropped column '{col}'")
            except Exception as e:
                print(f"   WARNING: Could not drop column '{col}': {str(e)}")

        # Step 5: Add foreign key constraint to customer_id if not exists
        print("\n5. Adding foreign key constraint...")
        try:
            # Check if constraint already exists
            result = db.execute(text("""
                SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_NAME = 'leads' AND COLUMN_NAME = 'customer_id' AND REFERENCED_TABLE_NAME = 'customers'
            """)).fetchone()

            if not result:
                db.execute(text("""
                    ALTER TABLE leads
                    ADD CONSTRAINT fk_leads_customer_id
                    FOREIGN KEY (customer_id) REFERENCES customers(id)
                """))
                db.commit()
                print("   OK: Foreign key constraint added")
            else:
                print("   OK: Foreign key constraint already exists")
        except Exception as e:
            print(f"   INFO: {str(e)}")

        # Step 6: Make customer_id NOT NULL
        print("\n6. Making customer_id NOT NULL...")
        try:
            db.execute(text("""
                ALTER TABLE leads MODIFY customer_id INT NOT NULL
            """))
            db.commit()
            print("   OK: customer_id is now NOT NULL")
        except Exception as e:
            print(f"   INFO: {str(e)}")

        print("\n" + "="*60)
        print("Migration completed successfully!")
        print("="*60)

    except Exception as e:
        print(f"\nERROR during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
