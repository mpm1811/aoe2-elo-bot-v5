from flask import Blueprint, request, jsonify
from app.services.player_service import PlayerService
from app.middleware.auth_middleware import token_required, admin_required

player_bp = Blueprint('player', __name__)

@player_bp.route('', methods=['GET'])
def get_all_players():
    """Get all players - public endpoint"""
    players, error = PlayerService.get_all_players()
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify(players), 200

@player_bp.route('/<player_id>', methods=['GET'])
def get_player(player_id):
    """Get a player by ID - public endpoint"""
    player, error = PlayerService.get_player_by_id(player_id)
    
    if error:
        return jsonify({"error": error}), 404 if error == "Player not found" else 500
    
    return jsonify(player), 200

@player_bp.route('', methods=['POST'])
@token_required
def create_player():
    """Create a new player - authenticated endpoint"""
    data = request.json
    
    if not data or not data.get('handle') or not data.get('firstName') or not data.get('lastName') or 'elo' not in data:
        return jsonify({"error": "Required fields missing: handle, firstName, lastName, elo"}), 400
    
    player, error = PlayerService.create_player(data)
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify(player), 201

@player_bp.route('/<player_id>', methods=['PUT'])
@token_required
def update_player(player_id):
    """Update a player - authenticated endpoint"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    player, error = PlayerService.update_player(player_id, data)
    
    if error:
        return jsonify({"error": error}), 404 if "not found" in error else 500
    
    return jsonify(player), 200

@player_bp.route('/<player_id>', methods=['DELETE'])
@admin_required
def delete_player(player_id):
    """Delete a player - admin only endpoint"""
    success, error = PlayerService.delete_player(player_id)
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify({"success": success, "message": "Player deleted successfully"}), 200