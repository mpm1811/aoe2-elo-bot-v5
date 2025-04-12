from app.db.pg_client import execute_query
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)

class PlayerService:
    @staticmethod
    def get_all_players() -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Get all players sorted by ELO rating"""
        try:
            logger.info("Fetching all players from database")
            
            players = execute_query("SELECT * FROM players ORDER BY elo DESC")
            
            if not players:
                logger.warning("No players found in database")
                return [], None  # Return empty list
            
            logger.info(f"Successfully fetched {len(players)} players")
            return players, None
        except Exception as e:
            logger.error(f"Error fetching players: {str(e)}")
            return [], str(e)
    
    @staticmethod
    def get_player_by_id(player_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Get a player by ID"""
        try:
            player = execute_query("SELECT * FROM players WHERE id = %s", (player_id,), fetchall=False)
            
            if not player:
                return None, "Player not found"
                
            return player, None
        except Exception as e:
            logger.error(f"Error fetching player by ID {player_id}: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def create_player(player_data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Create a new player"""
        try:
            # Generate ID if not provided
            if not player_data.get("id"):
                player_data["id"] = str(uuid.uuid4())
                
            # Generate avatar URL if not provided
            if not player_data.get("avatar_url"):
                player_data["avatar_url"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={player_data['handle'].lower()}"
            
            # Set default ELO rating if not provided
            if not player_data.get("elo"):
                player_data["elo"] = 1000
                
            # Get fields and values for SQL
            fields = list(player_data.keys())
            placeholders = ["%s"] * len(fields)
            values = [player_data[field] for field in fields]
            
            # Insert into database
            query = f"""
            INSERT INTO players ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
            """
            
            new_player = execute_query(query, tuple(values), fetchall=False)
            
            logger.info(f"Created new player with ID: {new_player['id']}")
            return new_player, None
        except Exception as e:
            logger.error(f"Error creating player: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def update_player(player_id: str, player_data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Update an existing player"""
        try:
            # First check if player exists
            existing = execute_query("SELECT id FROM players WHERE id = %s", (player_id,), fetchall=False)
            if not existing:
                logger.warning(f"Failed to update: Player with ID {player_id} not found")
                return None, "Player not found"
            
            # Add updated timestamp
            player_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Build update SQL
            set_clauses = [f"{key} = %s" for key in player_data.keys()]
            values = list(player_data.values())
            
            # Add player_id to values for WHERE clause
            values.append(player_id)
            
            query = f"""
            UPDATE players 
            SET {', '.join(set_clauses)} 
            WHERE id = %s
            RETURNING *
            """
            
            updated_player = execute_query(query, tuple(values), fetchall=False)
            
            logger.info(f"Updated player with ID: {player_id}")
            return updated_player, None
        except Exception as e:
            logger.error(f"Error updating player {player_id}: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def delete_player(player_id: str) -> Tuple[bool, Optional[str]]:
        """Delete a player"""
        try:
            # First check if player exists
            existing = execute_query("SELECT id FROM players WHERE id = %s", (player_id,), fetchall=False)
            if not existing:
                logger.warning(f"Failed to delete: Player with ID {player_id} not found")
                return False, "Player not found"
                
            execute_query("DELETE FROM players WHERE id = %s", (player_id,))
            
            logger.info(f"Deleted player with ID: {player_id}")
            return True, None
        except Exception as e:
            logger.error(f"Error deleting player {player_id}: {str(e)}")
            return False, str(e)