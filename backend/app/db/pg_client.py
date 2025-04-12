import os
import logging
import time
import psycopg2
import psycopg2.extras
from psycopg2.extensions import connection
from psycopg2.pool import ThreadedConnectionPool
from typing import Dict, Any, List, Optional, Tuple, Union
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

# Maximum retry attempts for database connection
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds

# Connection pool
_pool = None

def _get_pool():
    """
    Get or create a connection pool
    
    Returns:
        ThreadedConnectionPool: A PostgreSQL connection pool
    """
    global _pool
    
    if _pool is None:
        logger.info(f"Creating PostgreSQL connection pool to {DB_HOST}:{DB_PORT}/{DB_NAME}")
        
        for attempt in range(MAX_RETRIES):
            try:
                _pool = ThreadedConnectionPool(
                    minconn=1,
                    maxconn=10,
                    host=DB_HOST,
                    port=DB_PORT,
                    dbname=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD
                )
                logger.info("PostgreSQL connection pool created successfully")
                return _pool
            except Exception as e:
                logger.warning(f"Connection pool creation attempt {attempt+1} failed: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error(f"All {MAX_RETRIES} attempts to create connection pool failed")
                    raise ConnectionError(f"Could not create PostgreSQL connection pool: {str(e)}")
    
    return _pool

def get_connection():
    """
    Get a connection from the pool
    
    Returns:
        psycopg2.connection: A PostgreSQL connection
    """
    pool = _get_pool()
    return pool.getconn()

def release_connection(conn):
    """
    Release a connection back to the pool
    
    Args:
        conn: A PostgreSQL connection
    """
    pool = _get_pool()
    pool.putconn(conn)

def execute_query(query: str, params=None, fetchall=True) -> Union[List[Dict[str, Any]], Dict[str, Any], Dict[str, int]]:
    """
    Execute a SQL query and return the results
    
    Args:
        query (str): SQL query to execute
        params (tuple or dict, optional): Parameters for the SQL query
        fetchall (bool): Whether to fetch all results or just one row
    
    Returns:
        list or dict: Query results or affected rows count
    """
    conn = None
    try:
        conn = get_connection()
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
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_connection(conn)

def execute_transaction(queries_and_params: List[Tuple[str, Optional[tuple]]]) -> Dict[str, int]:
    """
    Execute multiple queries in a single transaction
    
    Args:
        queries_and_params: List of (query, params) tuples to execute
    
    Returns:
        dict: Dict with affected_rows count
    """
    conn = None
    try:
        conn = get_connection()
        total_affected = 0
        
        with conn.cursor() as cur:
            for query, params in queries_and_params:
                cur.execute(query, params)
                total_affected += cur.rowcount
                
            conn.commit()
        return {'affected_rows': total_affected}
    except Exception as e:
        logger.error(f"Transaction execution failed: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_connection(conn)

def test_connection() -> bool:
    """
    Test database connection
    
    Returns:
        bool: True if connection is successful
    """
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            result = cur.fetchone()
        release_connection(conn)
        return True
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return False