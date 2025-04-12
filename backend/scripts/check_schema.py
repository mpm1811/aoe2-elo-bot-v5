import os
import sys
from pathlib import Path
import pandas as pd

# Add backend directory to path to import our modules
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
sys.path.append(str(backend_dir))

# Import our PostgreSQL client
from app.db.pg_client import execute_query, test_connection

def check_table_schema(table_name):
    """Check the schema of a specific table"""
    try:
        # Check if the table exists
        table_check_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        ) as exists
        """
        
        result = execute_query(table_check_query, (table_name,), fetchall=False)
        
        if result['exists']:
            print(f"✅ Table '{table_name}' exists!")
            
            # Get table schema
            schema_query = """
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM 
                information_schema.columns
            WHERE 
                table_schema = 'public'
                AND table_name = %s
            ORDER BY 
                ordinal_position;
            """
            
            columns = execute_query(schema_query, (table_name,))
            print(f"\nSchema for table '{table_name}':")
            
            # Convert to pandas DataFrame for better display
            df = pd.DataFrame(columns)
            print(df)
            
            # Return columns for further processing
            return [col['column_name'] for col in columns]
        else:
            print(f"❌ Table '{table_name}' does not exist!")
            return []
            
    except Exception as e:
        print(f"❌ Error checking schema for '{table_name}': {e}")
        return []

def create_users_table():
    """Create the users table with the correct schema"""
    try:
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        execute_query(create_table_sql)
        print("✅ Users table created or updated successfully!")
        
        # Verify the table was created properly
        return check_table_schema('users')
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        return []

if __name__ == "__main__":
    # Test database connection
    if test_connection():
        print("✅ Database connection successful!")
        
        # Check users table schema
        print("\nChecking users table schema:")
        users_columns = check_table_schema('users')
        
        # Check what's missing from expected columns
        expected_columns = ['id', 'email', 'password_hash', 'role', 'created_at', 'updated_at']
        missing_columns = [col for col in expected_columns if col not in [c.lower() for c in users_columns]]
        
        if missing_columns:
            print(f"\n❌ Missing columns in users table: {', '.join(missing_columns)}")
            
            # Ask user if they want to recreate the table
            response = input("\nDo you want to create/recreate the users table? (y/n): ")
            if response.lower() == 'y':
                print("\nRecreating users table...")
                # First, drop the existing table if it exists
                execute_query("DROP TABLE IF EXISTS users CASCADE;")
                create_users_table()
        else:
            print("\n✅ All expected columns exist in users table!")
    else:
        print("❌ Database connection failed!")