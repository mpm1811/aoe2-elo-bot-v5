from app.db.pg_client import execute_query
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)

class MatchService:
    @staticmethod
    def get_all_matches() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Get all matches sorted by date (newest first)"""
        try:
            logger.info("Fetching all matches from database")
            
            matches = execute_query("SELECT * FROM matches ORDER BY match_date DESC")
            
            if not matches:
                logger.warning("No matches found in database")
                return [], None  # Return empty list
            
            logger.info(f"Successfully fetched {len(matches)} matches")
            return matches, None
        except Exception as e:
            logger.error(f"Error fetching matches: {str(e)}")
            return [], str(e)
    
    @staticmethod
    def get_match_by_id(match_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Get a match by ID"""
        try:
            match = execute_query("SELECT * FROM matches WHERE id = %s", (match_id,), fetchall=False)
            
            if not match:
                return None, "Match not found"
                
            return match, None
        except Exception as e:
            logger.error(f"Error fetching match by ID {match_id}: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def create_match(match_data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Create a new match"""
        try:
            # Generate ID if not provided
            if not match_data.get("id"):
                match_data["id"] = str(uuid.uuid4())
                
            # Add timestamp
            match_data["created_at"] = datetime.utcnow().isoformat()
            
            # Get fields and values for SQL
            fields = list(match_data.keys())
            placeholders = ["%s"] * len(fields)
            values = [match_data[field] for field in fields]
            
            # Insert into database
            query = f"""
            INSERT INTO matches ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
            """
            
            new_match = execute_query(query, tuple(values), fetchall=False)
            
            logger.info(f"Created new match with ID: {new_match['id']}")
            return new_match, None
        except Exception as e:
            logger.error(f"Error creating match: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def update_match_result(match_id: str, team1_score: int, team2_score: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Update match result"""
        try:
            # First check if match exists
            existing = execute_query("SELECT id FROM matches WHERE id = %s", (match_id,), fetchall=False)
            if not existing:
                logger.warning(f"Failed to update: Match with ID {match_id} not found")
                return None, "Match not found"
                
            # Prepare update data
            update_data = {
                "team1_score": team1_score,
                "team2_score": team2_score,
                "status": "completed",
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Build update SQL
            set_clauses = [f"{key} = %s" for key in update_data.keys()]
            values = list(update_data.values())
            
            # Add match_id to values for WHERE clause
            values.append(match_id)
            
            query = f"""
            UPDATE matches 
            SET {', '.join(set_clauses)} 
            WHERE id = %s
            RETURNING *
            """
            
            updated_match = execute_query(query, tuple(values), fetchall=False)
            
            logger.info(f"Updated match result for ID: {match_id}")
            return updated_match, None
        except Exception as e:
            logger.error(f"Error updating match {match_id}: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def cancel_match(match_id: str) -> Tuple[bool, Optional[str]]:
        """Cancel a match"""
        try:
            # First check if match exists
            existing = execute_query("SELECT id FROM matches WHERE id = %s", (match_id,), fetchall=False)
            if not existing:
                logger.warning(f"Failed to cancel: Match with ID {match_id} not found")
                return False, "Match not found"
                
            # Prepare update data
            query = """
            UPDATE matches 
            SET status = 'cancelled', updated_at = %s 
            WHERE id = %s
            """
            
            execute_query(query, (datetime.utcnow().isoformat(), match_id))
            
            logger.info(f"Cancelled match with ID: {match_id}")
            return True, None
        except Exception as e:
            logger.error(f"Error cancelling match {match_id}: {str(e)}")
            return False, str(e)