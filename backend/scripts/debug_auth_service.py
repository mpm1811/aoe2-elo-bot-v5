import os
import sys
from pathlib import Path
import pandas as pd

# Add backend directory to path to import our modules
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
sys.path.append(str(backend_dir))

# Import our PostgreSQL client and AuthService
from app.db.pg_client import execute_query, test_connection, get_connection
from app.services.auth_service import AuthService

def debug_users_table():
    """Debug the users table schema and the exact SQL used by AuthService"""
    try:
        print("=== Testing Database Connection ===")
        if test_connection():
            print("✅ Database connection successful!")
        else:
            print("❌ Database connection failed!")
            return
        
        print("\n=== Users Table Schema ===")
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
            AND table_name = 'users'
        ORDER BY 
            ordinal_position;
        """
        
        columns = execute_query(schema_query)
        print("Users table schema:")
        df = pd.DataFrame(columns)
        print(df)

        print("\n=== Database Connection String Used ===")
        conn = get_connection()
        if conn:
            print(f"Host: {conn.info.host}")
            print(f"Port: {conn.info.port}")
            print(f"Database: {conn.info.dbname}")
            print(f"User: {conn.info.user}")
            conn.close()

        print("\n=== AuthService Sign-up SQL ===")
        # Create a test email that won't be used for actual registration
        test_email = "debugging_test_do_not_create@example.com"
        test_password = "Test1234!"
        
        # Monkey patch the sign_up method to print SQL instead of executing
        original_signup = AuthService.sign_up
        
        def debug_sign_up(email, password, user_data=None):
            print(f"Would register user with email: {email}")
            # Check if there's a sign_up_user method in the class
            if hasattr(AuthService, 'sign_up_user'):
                sign_up_method = getattr(AuthService, 'sign_up_user')
                print(f"Found sign_up_user method: {sign_up_method}")
            
            # Print the insert statement that would be used
            from inspect import getsource
            try:
                print("\nSource code of sign_up method:")
                print(getsource(original_signup))
            except Exception as e:
                print(f"Could not get source: {e}")
            
            return {"debug": "This is just debugging"}, None
        
        # Replace temporarily
        AuthService.sign_up = staticmethod(debug_sign_up)
        
        # Call the method
        AuthService.sign_up(test_email, test_password)
        
        # Restore original method
        AuthService.sign_up = original_signup
        
        print("\n=== Direct SQL Test ===")
        try:
            sql = """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'users'
                AND column_name = 'password_hash'
            ) as exists;
            """
            result = execute_query(sql, fetchall=False)
            print(f"password_hash column exists: {result['exists']}")
            
            if result['exists']:
                # Try a direct insert
                print("\nTesting direct SQL insert with password_hash (will be rolled back):")
                conn = get_connection()
                conn.autocommit = False  # Start transaction
                
                try:
                    with conn.cursor() as cur:
                        test_sql = """
                        INSERT INTO users (id, email, password_hash, role, created_at)
                        VALUES ('00000000-0000-0000-0000-000000000000', 'test_direct_sql@example.com', 'test_hash', 'user', NOW())
                        """
                        cur.execute(test_sql)
                        print("✅ Direct SQL insert test succeeded!")
                except Exception as e:
                    print(f"❌ Direct SQL insert failed: {e}")
                finally:
                    conn.rollback()  # Roll back the test insert
                    conn.close()
        except Exception as e:
            print(f"❌ SQL test error: {e}")
        
    except Exception as e:
        print(f"❌ Debug error: {e}")

if __name__ == "__main__":
    debug_users_table()