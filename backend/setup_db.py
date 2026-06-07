#!/usr/bin/env python
"""
Setup script to create MySQL database and user for TripPilot.
Run this before starting the backend for the first time.
"""
import sys
import pymysql
from pymysql import MySQLError

DB_HOST = "localhost"
DB_PORT = 3306
DB_NAME = "trippilot"
DB_USER = "trippilot"
DB_PASS = "trippilot123"
ROOT_USER = "root"

def get_root_password():
    """Prompt user for MySQL root password."""
    import getpass
    return getpass.getpass(f"Enter MySQL root password for '{ROOT_USER}@{DB_HOST}': ")

def setup_database():
    """Create database and user."""
    root_password = get_root_password()

    try:
        # Connect as root
        print(f"🔗 Connecting to MySQL as {ROOT_USER}@{DB_HOST}...")
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=ROOT_USER,
            password=root_password,
            charset='utf8mb4'
        )
        print("✅ Connected to MySQL\n")

        cursor = conn.cursor()

        # Create database
        print(f"📁 Creating database '{DB_NAME}'...")
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
        cursor.execute(f"""
            CREATE DATABASE {DB_NAME}
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        """)
        print(f"✅ Database '{DB_NAME}' created\n")

        # Create user
        print(f"👤 Creating user '{DB_USER}'@'{DB_HOST}'...")
        cursor.execute(f"DROP USER IF EXISTS '{DB_USER}'@'{DB_HOST}'")
        cursor.execute(f"""
            CREATE USER '{DB_USER}'@'{DB_HOST}'
            IDENTIFIED BY '{DB_PASS}'
        """)
        print(f"✅ User '{DB_USER}' created\n")

        # Grant privileges
        print(f"🔐 Granting privileges...")
        cursor.execute(f"GRANT ALL PRIVILEGES ON {DB_NAME}.* TO '{DB_USER}'@'{DB_HOST}'")
        cursor.execute("FLUSH PRIVILEGES")
        print(f"✅ Privileges granted\n")

        conn.commit()
        cursor.close()
        conn.close()

        print("=" * 60)
        print("✅ Database setup complete!")
        print("=" * 60)
        print(f"\nConnection details:")
        print(f"  Host: {DB_HOST}")
        print(f"  Port: {DB_PORT}")
        print(f"  Database: {DB_NAME}")
        print(f"  User: {DB_USER}")
        print(f"  Password: {DB_PASS}")
        print("\nNext steps:")
        print("1. Run migrations: alembic upgrade head")
        print("2. Start the backend: uvicorn app.main:app --reload")
        return True

    except MySQLError as e:
        print(f"\n❌ MySQL Error: {e}")
        if "Access denied" in str(e):
            print("   Wrong root password or MySQL is not running")
        elif "Can't connect" in str(e):
            print("   MySQL is not running. Start MySQL and try again.")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("TripPilot Database Setup")
    print("=" * 60 + "\n")

    if setup_database():
        sys.exit(0)
    else:
        sys.exit(1)
