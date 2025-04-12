import os
import logging
import time
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5433')
DB_NAME = os.environ.get('DB_NAME', 'postgres')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

# Maximum retry attempts for database connection
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds

def get_supabase_client():
    """
    Get a Supabase client instance for authentication and database operations.
    
    Returns:
        dict: A simple client dictionary with URL and key for services to use
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not configured. Some authentication features may not work.")
    
    # Return a simple client configuration dictionary
    # In a real implementation, you might use the actual Supabase client library
    return {
        'url': SUPABASE_URL,
        'key': SUPABASE_KEY
    }

def get_db_connection():
    """
    Get a connection to the PostgreSQL database
    
    Returns:
        psycopg2.connection: A PostgreSQL database connection
    """
    if not DB_HOST or not DB_USER or not DB_PASSWORD:
        error_msg = "Missing database credentials. Please check your environment variables."
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    for attempt in range(MAX_RETRIES):
        try:
            logger.debug(f"Connecting to database at {DB_HOST}:{DB_PORT}/{DB_NAME} with user {DB_USER}")
            
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            
            # Test the connection with a simple query
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                result = cur.fetchone()
                
            logger.debug(f"Database connection successful on attempt {attempt+1}")
            return conn
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt+1} failed: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                logger.error(f"All {MAX_RETRIES} connection attempts to database failed")
                raise ConnectionError(f"Could not connect to database: {str(e)}")

def get_service_connection():
    """
    Get a database connection with elevated privileges for admin operations
    
    Returns:
        psycopg2.connection: A PostgreSQL database connection
    """
    # For a direct PostgreSQL connection, we use the same credentials
    # In a more sophisticated setup, you might have different credentials for admin operations
    return get_db_connection()

def execute_query(query, params=None, fetchall=True):
    """
    Execute a SQL query and return the results
    
    Args:
        query (str): SQL query to execute
        params (tuple or dict, optional): Parameters for the SQL query
        fetchall (bool): Whether to fetch all results or just one row
    
    Returns:
        list or dict: Query results
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            if query.strip().upper().startswith(('SELECT', 'SHOW', 'WITH')):
                if fetchall:
                    results = cur.fetchall()
                else:
                    results = cur.fetchone()
                return results
            else:
                conn.commit()
                return {'affected_rows': cur.rowcount}
    except Exception as e:
        logger.error(f"Query execution failed: {str(e)}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        conn.rollback()
        raise
    finally:
        conn.close()