"""
Quick fix script to update existing admin users to have role='admin'
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.organization import Organization
    from sqlalchemy import text
except ImportError as e:
    print(f"✗ Error importing modules: {e}")
    sys.exit(1)

def fix_admin_roles():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        sys.exit(1)

    try:
        # Find the first user (owner) of each organization
        orgs = db.query(Organization).all()
        print(f"\nFound {len(orgs)} organization(s)\n")

        updated_count = 0
        for org in orgs:
            # Get the first user (owner) of this org
            owner = db.query(User).filter(
                User.org_id == org.id
            ).order_by(User.id.asc()).first()

            if owner and owner.role != "admin":
                print(f"Updating {owner.name} ({owner.email}) role to 'admin' for org {org.name}")
                owner.role = "admin"
                db.add(owner)
                updated_count += 1
            elif owner:
                print(f"✓ {owner.name} ({owner.email}) already has admin role")

        if updated_count > 0:
            db.commit()
            print(f"\n✓ Successfully updated {updated_count} user(s) to admin role")
        else:
            print("\n✓ All organization owners already have admin role")

    except Exception as e:
        print(f"✗ Error during migration: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_roles()
