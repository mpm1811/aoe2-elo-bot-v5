import os
import sys
from pathlib import Path

# Add backend directory to path to import our modules
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
sys.path.append(str(backend_dir))

# Import our PostgreSQL client
from app.db.pg_client import execute_query, test_connection

def add_password_hash_column():
    """Add password_hash column to users table if it doesn't exist"""
    try:
        # Check if column exists
        check_column_sql = """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'password_hash'
        ) as exists;
        """
        
        result = execute_query(check_column_sql, fetchall=False)
        
        if not result['exists']:
            print("Password hash column does not exist. Adding it now...")
            
            # Add the column
            add_column_sql = """
            ALTER TABLE users 
            ADD COLUMN password_hash TEXT NOT NULL DEFAULT 'temp_hash';
            """
            
            execute_query(add_column_sql)
            print("✅ Successfully added password_hash column to users table!")
        else:
            print("✅ password_hash column already exists in users table.")
            
        return True
    except Exception as e:
        print(f"❌ Error adding password_hash column: {e}")
        return False

if __name__ == "__main__":
    # Test database connection
    if test_connection():
        print("✅ Database connection successful!")
        add_password_hash_column()
    else:
        print("❌ Database connection failed!")