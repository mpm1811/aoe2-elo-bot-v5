from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Extract user data
    email = data.get('email')
    password = data.get('password')
    user_data = {
        "firstName": data.get('firstName', ''),
        "lastName": data.get('lastName', ''),
        "role": data.get('role', 'user')  # Default role is 'user'
    }
    
    # Call auth service
    result, error = AuthService.sign_up(email, password, user_data)
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({
        "message": "User registered successfully",
        "user": result.get("user"),
        "session": result.get("session")
    }), 201

@auth_bp.route('/signin', methods=['POST'])
def signin():
    """Sign in an existing user"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Extract credentials
    email = data.get('email')
    password = data.get('password')
    
    # Call auth service
    result, error = AuthService.sign_in(email, password)
    
    if error:
        return jsonify({"error": error}), 401
    
    return jsonify({
        "user": result.get("user"),
        "session": result.get("session"),
        "role": result.get("role")
    }), 200

@auth_bp.route('/signout', methods=['POST'])
def signout():
    """Sign out a user"""
    # Get access token from Authorization header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header with Bearer token is required"}), 401
    
    access_token = auth_header.split(' ')[1]
    
    # Call auth service
    result, error = AuthService.sign_out(access_token)
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "User signed out successfully"}), 200

@auth_bp.route('/user', methods=['GET'])
def get_user():
    """Get user information"""
    # Get access token from Authorization header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header with Bearer token is required"}), 401
    
    access_token = auth_header.split(' ')[1]
    
    # Call auth service
    result, error = AuthService.get_user(access_token)
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"user": result.get("user")}), 200