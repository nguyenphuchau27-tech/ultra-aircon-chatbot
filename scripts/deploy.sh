#!/bin/bash

# Ultra Aircon Platform Deploy Script

echo "Deploying Ultra Aircon Platform..."

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/

# Deploy infrastructure
terraform apply -auto-approve

# Start services with docker-compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d

echo "Deployment complete!"