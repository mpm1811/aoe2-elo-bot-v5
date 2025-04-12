#!/usr/bin/env python3

import os
import sys
import logging
from pathlib import Path
import psycopg2

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# DB connection parameters
def get_db_connection():
    """Get a connection to the Postgres database"""
    host = os.environ.get('SUPABASE_HOST', 'localhost')
    port = os.environ.get('DB_PORT', '5433')  # Using external port from docker-compose
    dbname = os.environ.get('SUPABASE_DB', 'postgres')
    user = os.environ.get('SUPABASE_USER', 'postgres')
    password = os.environ.get('SUPABASE_PASSWORD', 'postgres')
    
    logger.info(f"Connecting to database at {host}:{port}/{dbname} with user {user}")
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        conn.autocommit = True
        logger.info("Database connection established successfully")
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def fix_auth_schema():
    """Create auth schema and auth.uid() function if they don't exist"""
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database")
        return False
        
    try:
        with conn.cursor() as cur:
            # Check if auth schema exists
            cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';")
            if not cur.fetchone():
                logger.info("Creating auth schema...")
                cur.execute("CREATE SCHEMA IF NOT EXISTS auth;")
                
            # Create auth.uid() function if it doesn't exist
            logger.info("Creating auth.uid() function...")
            cur.execute("""
            CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
            LANGUAGE sql STABLE
            AS $$
              SELECT coalesce(
                current_setting('request.jwt.claim.sub', true)::uuid,
                (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
                '00000000-0000-0000-0000-000000000000'::uuid
              )
            $$;
            """)
            logger.info("auth.uid() function created successfully")
            
            return True
    except Exception as e:
        logger.error(f"Error fixing auth schema: {e}")
        return False
    finally:
        conn.close()

def add_missing_columns():
    """Add missing columns to tables"""
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database")
        return False
        
    try:
        with conn.cursor() as cur:
            # Check if users table exists
            cur.execute("SELECT to_regclass('public.users');")
            if cur.fetchone()[0]:
                # Check if first_name and last_name columns exist
                cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
                AND column_name IN ('first_name', 'last_name');
                """)
                existing_columns = [row[0] for row in cur.fetchall()]
                
                # Add missing columns
                if 'first_name' not in existing_columns:
                    logger.info("Adding first_name column to users table...")
                    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;")
                
                if 'last_name' not in existing_columns:
                    logger.info("Adding last_name column to users table...")
                    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;")
                
                logger.info("Added missing columns to users table")
            else:
                logger.warning("Users table does not exist")
            
            return True
    except Exception as e:
        logger.error(f"Error adding missing columns: {e}")
        return False
    finally:
        conn.close()

def check_database_health():
    """Check database health and structure"""
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database")
        return False
        
    try:
        with conn.cursor() as cur:
            # Check if auth.uid() function exists
            cur.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'auth' AND routine_name = 'uid';
            """)
            if cur.fetchone():
                logger.info("auth.uid() function exists")
            else:
                logger.warning("auth.uid() function does not exist")
            
            # Check main tables
            tables_to_check = ['users', 'players', 'matches']
            for table in tables_to_check:
                cur.execute(f"SELECT to_regclass('public.{table}');")
                result = cur.fetchone()[0]
                if result:
                    logger.info(f"Table {table} exists")
                    # Count rows
                    cur.execute(f"SELECT COUNT(*) FROM {table};")
                    count = cur.fetchone()[0]
                    logger.info(f"Table {table} has {count} rows")
                    
                    # Check key columns in users table
                    if table == 'users':
                        cur.execute("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'users' AND table_schema = 'public';
                        """)
                        columns = [row[0] for row in cur.fetchall()]
                        logger.info(f"Users table columns: {', '.join(columns)}")
                else:
                    logger.warning(f"Table {table} does not exist")
            
            return True
    except Exception as e:
        logger.error(f"Error checking database health: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    logger.info("Starting database fix process...")
    
    try:
        # Check initial database status
        logger.info("Checking database status before fixes...")
        check_database_health()
        
        # Apply fixes
        logger.info("Fixing auth schema...")
        if not fix_auth_schema():
            logger.error("Failed to fix auth schema")
            sys.exit(1)
        
        logger.info("Adding missing columns...")
        if not add_missing_columns():
            logger.error("Failed to add missing columns")
            sys.exit(1)
        
        # Check database status after fixes
        logger.info("Checking database status after fixes...")
        check_database_health()
        
        logger.info("Database fixes completed successfully")
    except Exception as e:
        logger.error(f"Error during database fix: {e}")
        sys.exit(1)