# AOE2 Elo Bot v6

A team balancer app for Age of Empires 2 matches with ELO rating tracking.

## Project Structure

This project uses a modern architecture with:
- React + TypeScript + Vite for the frontend
- Python Flask API for the backend
- Supabase for authentication and database

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Docker (optional, for local Supabase)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a Python virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already present)
   - Update Supabase credentials in `.env`

6. Start the backend server:
   ```
   python run.py
   ```
   The backend API will be available at http://localhost:5000/api

### Frontend Setup

1. From the root directory, install frontend dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already present) 
   - Set `VITE_API_BASE_URL=http://localhost:5000/api`

3. Start the development server:
   ```
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

## Supabase Setup

### Using Local Supabase (Recommended for Development)

1. Install Supabase CLI:
   ```
   npm install supabase --save-dev
   ```

2. Start local Supabase:
   ```
   npx supabase start
   ```

3. Update your backend `.env` file with the local Supabase credentials.

### Using Remote Supabase

1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys from the Supabase dashboard
3. Update the credentials in both frontend and backend `.env` files

## Docker Setup

### Build and Run with Docker

1. Configure environment variables:
   - Copy `.env.docker` to `.env`
   - Update Supabase credentials in `.env`

2. Build and run the Docker container:
   ```
   docker-compose up --build
   ```
   The application will be available at http://localhost:8080

### Environment Variables

The Docker setup requires the following environment variables:

#### Frontend Variables:
- `VITE_API_BASE_URL` - URL for the API (default: /api)
- `VITE_USE_LOCAL_SUPABASE` - Whether to use local Supabase (default: false for Docker)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_BASE_PATH` - Base path for the application (default: /)

#### Backend Variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `FLASK_APP` - Flask application entry point (default: run.py)
- `FLASK_ENV` - Flask environment (development/production)
- `SECRET_KEY` - Secret key for Flask sessions

### Development vs Production

For development with hot-reloading:
```
docker-compose -f docker-compose.dev.yml up
```

For production deployment:
```
docker-compose up --build -d
```

## Project Structure

- `/src` - Frontend React application
  - `/components` - UI components
  - `/services` - API service layer
  - `/lib` - Utility functions and shared code
- `/backend` - Python Flask API
  - `/app` - Main application package
    - `/routes` - API route definitions
    - `/services` - Business logic and Supabase interactions

## Features

- Player management with ELO ratings
- Match scheduling and result tracking
- Fair team balancing based on player ratings
- Authentication system
