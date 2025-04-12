#!/bin/bash

echo "==== Checking Docker Network Configuration ===="
docker network ls
echo ""

echo "==== Checking Network Details for App Network ===="
docker network inspect app-network
echo ""

echo "==== Checking Frontend Container Status ===="
docker ps | grep frontend
echo ""

echo "==== Checking Backend Container Status ===="
docker ps | grep backend
echo ""

echo "==== Checking Nginx Container Status ===="
docker ps | grep nginx
echo ""

echo "==== Checking Frontend Build Files ===="
docker exec -it $(docker ps -q --filter name=frontend) ls -la /app/dist || echo "ERROR: Could not access /app/dist in frontend container"
echo ""

echo "==== Checking Nginx Container Files ===="
docker exec -it $(docker ps -q --filter name=nginx) ls -la /app/dist || echo "ERROR: Could not access /app/dist in nginx container"
echo ""

echo "==== Checking DNS Resolution in Nginx Container ===="
docker exec -it $(docker ps -q --filter name=nginx) ping -c 2 backend || echo "ERROR: Cannot resolve backend hostname"
echo ""

echo "==== Verifying Network Configuration ===="
echo "Backend service IP:"
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q --filter name=backend) || echo "ERROR: Cannot get backend IP"
echo ""

echo "Nginx service IP:"
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q --filter name=nginx) || echo "ERROR: Cannot get nginx IP"
echo ""

echo "==== Testing Backend API Health ===="
docker exec -it $(docker ps -q --filter name=nginx) curl -I http://backend:5000/api/health || echo "ERROR: Cannot access backend health endpoint"
echo ""

echo "==== Testing Nginx Frontend Access ===="
curl -I http://localhost:8080/
echo ""

echo "==== Testing Nginx API Proxying ===="
curl -I http://localhost:8080/api/health
echo ""

echo "==== Container Logs ===="
echo "--- Frontend Logs ---"
docker logs $(docker ps -q --filter name=frontend) --tail 20
echo ""

echo "--- Backend Logs ---"
docker logs $(docker ps -q --filter name=backend) --tail 20
echo ""

echo "--- Nginx Logs ---"
docker logs $(docker ps -q --filter name=nginx) --tail 20
