#!/bin/bash

# Deploy script for mail server application
# Usage: ./deploy.sh [environment]
# environment can be 'development' (default) or 'production'

ENVIRONMENT=${1:-development}
echo "Deploying mail server in $ENVIRONMENT mode..."

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Building all services..."
  # Build all services first
  pm2 startOrRestart ecosystem.production.config.js --env production
  
  # Wait a moment for builds to complete
  sleep 10
  
  # Then start the services
  echo "Starting services..."
  pm2 startOrRestart ecosystem.config.js --env production
else
  echo "Starting services in development mode..."
  pm2 startOrRestart ecosystem.config.js --env development
fi

echo "Deployment completed!"
pm2 list