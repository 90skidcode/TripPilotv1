"""
Migration script to assign users to Admin Group if they don't have a group assigned.
Run this once to fix existing users after the group-based permission system migration.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.user_group import UserGroup
    from app.models.organization import Organization
except ImportError as e:
    print(f"✗ Error importing modules: {e}")
    print("Make sure you're running this from the backend directory with the virtual environment activated")
    sys.exit(1)

def migrate():
    try:
        print("Connecting to database...")
        db = SessionLocal()
        db.execute("SELECT 1")  # Test connection
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        print("Make sure the database is running and accessible")
        sys.exit(1)

    try:
        # Get all organizations
        orgs = db.query(Organization).all()
        print(f"Found {len(orgs)} organization(s)")

        for org in orgs:
            print(f"Processing organization: {org.name} (ID: {org.id})")

            # Get or create Admin Group for this org
            admin_group = db.query(UserGroup).filter(
                UserGroup.org_id == org.id,
                UserGroup.name == "Admin Group"
            ).first()

            if not admin_group:
                print(f"  ⚠ No Admin Group found for {org.name}, creating one...")
                admin_group = UserGroup(
                    org_id=org.id,
                    name="Admin Group",
                    permissions={
                        "leads": {"read": True, "write": True},
                        "itinerary": {"read": True, "write": True},
                        "vouchers": {"read": True, "write": True},
                        "inventory": {"read": True, "write": True},
                        "dashboard": {"read": True, "write": True},
                        "settings": {"read": True, "write": True},
                        "users": {"read": True, "write": True},
                    }
                )
                db.add(admin_group)
                db.commit()
                db.refresh(admin_group)

            # Find users without a group
            users_without_group = db.query(User).filter(
                User.org_id == org.id,
                User.group_id == None,
                User.role.in_(["admin", "superadmin"])
            ).all()

            for user in users_without_group:
                print(f"  ✓ Assigning {user.name} ({user.email}) to Admin Group")
                user.group_id = admin_group.id
                db.add(user)

            if users_without_group:
                db.commit()
                print(f"  Updated {len(users_without_group)} users")
            else:
                print(f"  No admin users without group assignment")

        print("\n✓ Migration completed successfully!")

    except Exception as e:
        print(f"✗ Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
