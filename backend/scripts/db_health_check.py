#!/usr/bin/env python3

import os
import sys
import time
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.db.pg_client import test_connection, execute_query

def check_database_connection():
    """Check if the database connection is working properly"""
    try:
        print("Checking database connection...")
        
        # Test the connection
        if not test_connection():
            print("❌ Database connection failed")
            return False
            
        # Check players table
        try:
            players_count = execute_query("SELECT COUNT(*) as count FROM players", fetchall=False)
            print(f"📊 Players table: {players_count['count']} records")
        except Exception as e:
            print(f"⚠️ Could not query players table: {str(e)}")
        
        # Check matches table
        try:
            matches_count = execute_query("SELECT COUNT(*) as count FROM matches", fetchall=False)
            print(f"📊 Matches table: {matches_count['count']} records")
        except Exception as e:
            print(f"⚠️ Could not query matches table: {str(e)}")
        
        # Check users table
        try:
            users_count = execute_query("SELECT COUNT(*) as count FROM users", fetchall=False)
            print(f"📊 Users table: {users_count['count']} records")
        except Exception as e:
            print(f"⚠️ Could not query users table: {str(e)}")
            
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Environment variables should already be loaded from Docker
    # No need to load .env file specifically when running in Docker
    
    # Check connection
    successful = check_database_connection()
    
    if not successful:
        sys.exit(1)
