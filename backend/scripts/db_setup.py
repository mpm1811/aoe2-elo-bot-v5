#!/usr/bin/env python3

import os
import sys
import time
from pathlib import Path
import subprocess
import logging
import psycopg2
import psycopg2.extensions
from psycopg2 import sql
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

def get_db_connection():
    """
    Get a connection to the Postgres database
    """
    # Get connection parameters from environment variables or use defaults
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

def execute_sql_file(filepath):
    """
    Execute an SQL file using a direct PostgreSQL connection
    
    Args:
        filepath: Path to the SQL file to execute
    """
    try:
        logger.info(f"Reading SQL file: {filepath}")
        with open(filepath, 'r') as file:
            sql_content = file.read()
        
        # Get a database connection
        conn = get_db_connection()
        if not conn:
            logger.error(f"Cannot execute SQL file {filepath}: Database connection failed")
            return False
            
        try:
            with conn.cursor() as cur:
                logger.info(f"Executing SQL script")
                cur.execute(sql_content)
                logger.info(f"SQL script executed successfully")
            return True
        except Exception as e:
            logger.error(f"Error executing SQL: {e}")
            return False
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Failed to execute SQL file {filepath}: {e}")
        return False

def execute_sql_commands_individually(filepath):
    """
    Execute SQL commands individually for better error reporting
    
    Args:
        filepath: Path to the SQL file to execute
    """
    try:
        logger.info(f"Reading SQL file: {filepath}")
        with open(filepath, 'r') as file:
            sql_content = file.read()
            
        # Split into commands (naive split by semicolon - may not work for all SQL)
        commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        # Get a database connection
        conn = get_db_connection()
        if not conn:
            logger.error(f"Cannot execute SQL file {filepath}: Database connection failed")
            return False
            
        try:
            with conn.cursor() as cur:
                for i, command in enumerate(commands, 1):
                    logger.info(f"Executing command {i}/{len(commands)}")
                    try:
                        cur.execute(command)
                        logger.info(f"Command {i} executed successfully")
                    except Exception as cmd_error:
                        logger.error(f"Error executing command {i}: {cmd_error}")
                        logger.error(f"Command was: {command[:100]}...")
                        # Continue with next command
            return True
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Failed to execute SQL file {filepath}: {e}")
        return False

def setup_database():
    """Run database migrations and seed data"""
    # Define paths to SQL files
    migrations_path = Path(__file__).parent.parent.parent / "database" / "migrations" / "schema.sql"
    seed_path = Path(__file__).parent.parent.parent / "database" / "seed.sql"
    
    # Check if files exist
    if not migrations_path.exists():
        logger.error(f"Migrations file not found: {migrations_path}")
        return False
    
    if not seed_path.exists():
        logger.error(f"Seed file not found: {seed_path}")
        return False
    
    # Execute migrations
    logger.info("Running database migrations...")
    if not execute_sql_commands_individually(migrations_path):
        logger.error("Database migrations failed")
        return False
    
    # Execute seed data
    logger.info("Seeding database...")
    if not execute_sql_commands_individually(seed_path):
        logger.error("Database seeding failed")
        return False
    
    logger.info("Database setup completed successfully")
    return True

def check_database_connection():
    """
    Check if the database connection works
    """
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()
                logger.info(f"Connected to PostgreSQL: {version[0]}")
                return True
        finally:
            conn.close()
    return False

def check_tables_exist():
    """Check if expected tables exist in the database"""
    try:
        conn = get_db_connection()
        if not conn:
            return False
            
        tables_to_check = ['players', 'matches', 'users']
        
        try:
            with conn.cursor() as cur:
                for table in tables_to_check:
                    cur.execute("SELECT to_regclass(%s);", (f'public.{table}',))
                    result = cur.fetchone()[0]
                    if result:
                        logger.info(f"Table {table} exists")
                        # Count rows
                        cur.execute(f"SELECT COUNT(*) FROM {table};")
                        count = cur.fetchone()[0]
                        logger.info(f"Table {table} has {count} rows")
                    else:
                        logger.warning(f"Table {table} does not exist")
            return True
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Failed to check tables: {e}")
        return False

if __name__ == "__main__":
    # Add psycopg2 to requirements if not already there
    try:
        import psycopg2
        logger.info("psycopg2 is already installed.")
    except ImportError:
        logger.info("Installing psycopg2...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        logger.info("psycopg2 has been installed.")
        
    # Check database connection
    if not check_database_connection():
        logger.error("Failed to connect to database. Exiting.")
        sys.exit(1)
    
    # Check if tables exist
    tables_exist = check_tables_exist()
    
    # Run setup if needed or if forced by environment variable
    run_setup = os.environ.get('RUN_MIGRATIONS', '').lower() == 'true'
    
    if run_setup:
        logger.info("Running database setup as requested...")
        if setup_database():
            logger.info("Database setup completed successfully")
        else:
            logger.error("Database setup failed")
            sys.exit(1)
    else:
        logger.info("Skipping database setup (RUN_MIGRATIONS not set to 'true')")
        
    logger.info("Database checks completed")