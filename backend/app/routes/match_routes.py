from flask import Blueprint, request, jsonify
from app.services.match_service import MatchService
from app.middleware.auth_middleware import token_required, admin_required
import logging

logger = logging.getLogger(__name__)
match_bp = Blueprint('match', __name__)

@match_bp.route('', methods=['GET'])
def get_all_matches():
    """Get all matches - public endpoint"""
    matches, error = MatchService.get_all_matches()
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify(matches), 200

@match_bp.route('/<match_id>', methods=['GET'])
def get_match(match_id):
    """Get a match by ID - public endpoint"""
    match, error = MatchService.get_match_by_id(match_id)
    
    if error:
        return jsonify({"error": error}), 404 if error == "Match not found" else 500
    
    return jsonify(match), 200

@match_bp.route('', methods=['POST'])
@token_required
def create_match(current_user):
    """Create a new match - authenticated endpoint"""
    data = request.json
    logger.info(f"Received match creation request: {data}")
    
    if not data or not data.get('matchDate') or not data.get('team1Players') or not data.get('team2Players'):
        return jsonify({"error": "Required fields missing: matchDate, team1Players, team2Players"}), 400
    
    # Transform frontend data format to database format
    match_data = {
        "match_date": data.get('matchDate'),
        "status": data.get('status', 'scheduled'),
        "map": data.get('map'),
        "notes": data.get('notes'),
        "team1_score": data.get('team1Score'),
        "team2_score": data.get('team2Score'),
        "created_by": current_user.get('id') if current_user else None
    }
    
    # Create the match first
    match, error = MatchService.create_match(match_data)
    
    if error:
        return jsonify({"error": f"Error creating match: {error}"}), 500
    
    return jsonify(match), 201

@match_bp.route('/<match_id>/result', methods=['PUT'])
@token_required
def update_match_result(current_user, match_id):
    """Update match result - authenticated endpoint"""
    data = request.json
    
    if not data or 'team1Score' not in data or 'team2Score' not in data:
        return jsonify({"error": "Required fields missing: team1Score, team2Score"}), 400
    
    match, error = MatchService.update_match_result(match_id, data.get('team1Score'), data.get('team2Score'))
    
    if error:
        return jsonify({"error": error}), 404 if "not found" in error else 500
    
    return jsonify(match), 200

@match_bp.route('/<match_id>/cancel', methods=['PUT'])
@token_required
def cancel_match(current_user, match_id):
    """Cancel a match - authenticated endpoint"""
    success, error = MatchService.cancel_match(match_id)
    
    if error:
        return jsonify({"error": error}), 404 if "not found" in error else 500
    
    return jsonify({"success": success, "message": "Match cancelled successfully"}), 200