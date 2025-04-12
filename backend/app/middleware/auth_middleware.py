from flask import request, jsonify, g
from functools import wraps
from app.services.auth_service import AuthService

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header with Bearer token is required"}), 401
        
        access_token = auth_header.split(' ')[1]
        
        try:
            # Verify the token using our AuthService
            result, error = AuthService.get_user(access_token)
            
            if error:
                return jsonify({"error": error}), 401
                
            # Store user in flask g object for use in the route
            g.user = result['user']
            g.token = access_token
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
            
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header with Bearer token is required"}), 401
        
        access_token = auth_header.split(' ')[1]
        
        try:
            # Verify the token using our AuthService
            result, error = AuthService.get_user(access_token)
            
            if error:
                return jsonify({"error": error}), 401
                
            user = result['user']
            
            # Check if the user has admin role
            if user['role'] != 'admin':
                return jsonify({"error": "Admin privileges required"}), 403
                
            # Store user in flask g object for use in the route
            g.user = user
            g.token = access_token
            g.is_admin = True
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
            
    return decorated