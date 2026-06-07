#!/usr/bin/env python
"""Check if MySQL is running and try to connect."""
import socket
import sys

DB_HOST = "localhost"
DB_PORT = 3306

print("\n" + "=" * 60)
print("MySQL Connection Diagnostic")
print("=" * 60 + "\n")

# Check if MySQL port is open
print(f"🔍 Checking if MySQL is running on {DB_HOST}:{DB_PORT}...")
try:
    sock = socket.create_connection((DB_HOST, DB_PORT), timeout=2)
    sock.close()
    print("✅ MySQL is running\n")
except Exception as e:
    print(f"❌ MySQL is NOT running: {e}")
    print("\n📝 Fix: Start MySQL service")
    print("   - Windows: Search for 'Services' → find 'MySQL80' → right-click 'Start'")
    print("   - Or: mysql -u root (with no password)")
    sys.exit(1)

# Try to connect with common passwords
print("🔑 Trying common MySQL root passwords...\n")
import pymysql

common_passwords = [
    "",                          # No password
    "root",                      # Common default
    "password",                  # Common default
    "mysql",                     # Common default
    "trippilot123",             # Your app password
]

connected = False
for password in common_passwords:
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user="root",
            password=password,
            charset='utf8mb4'
        )
        print(f"✅ Connected with password: '{password}' (or empty if first in list)")
        print(f"\n💡 Use this password in setup_db.py\n")
        conn.close()
        connected = True
        break
    except pymysql.Error:
        continue

if not connected:
    print("❌ Could not connect with common passwords")
    print("\n📝 Options:")
    print("1. Try your password manually: mysql -u root -p")
    print("2. Reset MySQL root password (see instructions below)")
    print("\n" + "=" * 60)
    print("Reset MySQL Root Password on Windows")
    print("=" * 60)
    print("""
1. Stop MySQL service:
   net stop MySQL80

2. Start MySQL without password requirement:
   mysqld --skip-grant-tables

3. In another PowerShell, connect without password:
   mysql -u root

4. Run these SQL commands:
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
   EXIT;

5. Restart MySQL service normally
""")
