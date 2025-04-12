from app import create_app
import os

# Create Flask application
app = create_app()

if __name__ == "__main__":
    # Use environment variable for port if available, otherwise default to 5001
    port = int(os.environ.get('API_PORT', 5001))
    # Run the app in debug mode when executed directly
    # Use 0.0.0.0 to make it accessible externally
    app.run(debug=os.environ.get('FLASK_ENV') == 'development', host="0.0.0.0", port=port)