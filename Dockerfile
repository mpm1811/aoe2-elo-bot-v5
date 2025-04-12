# Build stage for frontend
FROM node:18-alpine as frontend-build

WORKDIR /app

# Copy frontend package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Set frontend environment variables at build time
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_PATH=/

# Build the frontend
RUN npm run build

# Build stage for backend
FROM python:3.11-slim

# Set working directory for backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    supervisor \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend files from the frontend build stage
COPY --from=frontend-build /app/dist /app/dist

# Copy backend files
COPY backend/ /app/backend/

# Copy database files
COPY database/ /app/database/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy supervisor configuration and update entry point script
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY deploy/entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set backend environment variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV SERVE_FRONTEND=true

# Expose Flask port
EXPOSE 5000

# Use the entrypoint script to run migrations and start services
ENTRYPOINT ["/app/entrypoint.sh"]
