from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS
import os
import logging
import json

def create_app():
    # Initialize Flask app - serve static files from the dist directory
    app = Flask(__name__, 
                static_folder='../../dist', 
                static_url_path='')
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Docker provides environment variables - no need to load .env explicitly
    # Environment variables should be provided by Docker / deployment environment
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Import and register blueprints for API routes
    from app.routes.auth_routes import auth_bp
    from app.routes.player_routes import player_bp
    from app.routes.match_routes import match_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(player_bp, url_prefix='/api/players')
    app.register_blueprint(match_bp, url_prefix='/api/matches')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
            from app.config import get_supabase_client
            # Check if Supabase connection is working
            supabase = get_supabase_client()
            
            response = make_response(json.dumps({
                'status': 'healthy',
                'database': 'connected',
                'environment': os.environ.get('FLASK_ENV', 'development')
            }))
            response.headers['Content-Type'] = 'application/json'
            app.logger.info("Health check: Returning healthy response")
            return response
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            response = make_response(json.dumps({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }), 500)
            response.headers['Content-Type'] = 'application/json'
            return response
    
    # Authentication status check endpoint
    @app.route('/api/auth/check', methods=['GET'])
    def auth_check():
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            response = make_response(json.dumps({
                'authenticated': False,
                'message': 'No authentication token provided'
            }))
            response.headers['Content-Type'] = 'application/json'
            return response
        
        try:
            from app.config import get_supabase_client
            from app.middleware.auth_middleware import token_required
            
            token = auth_header.split(' ')[1]
            
            # Try to verify the token with Supabase
            supabase = get_supabase_client()
            supabase.auth.set_session(token)
            user = supabase.auth.get_user()
            
            response = make_response(json.dumps({
                'authenticated': True,
                'user_id': user.user.id,
                'email': user.user.email
            }))
            response.headers['Content-Type'] = 'application/json'
            return response
        except Exception as e:
            app.logger.error(f"Authentication check failed: {str(e)}")
            response = make_response(json.dumps({
                'authenticated': False,
                'message': str(e)
            }))
            response.headers['Content-Type'] = 'application/json'
            return response
    
    # Global error handler for Supabase connection issues
    @app.errorhandler(ConnectionError)
    def handle_supabase_error(error):
        app.logger.error(f"Supabase connection error: {str(error)}")
        response = make_response(json.dumps({
            'error': 'Database connection error',
            'message': str(error)
        }), 503)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Combined route to serve both static files and the React app
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # Skip API routes - they are handled by blueprints
        if path.startswith('api/'):
            return {'error': 'API route not found'}, 404
            
        # For static files that exist, serve them directly
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            app.logger.info(f"Serving static file: {path}")
            return send_from_directory(app.static_folder, path)
        
        # For all other routes, serve the index.html file (for React routing)
        app.logger.info(f"Serving frontend for path: {path}")
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.after_request
    def after_request(response):
        app.logger.info(f"Response headers: {response.headers}")
        app.logger.info(f"Response data: {response.data[:100]}...")
        return response
    
    return app