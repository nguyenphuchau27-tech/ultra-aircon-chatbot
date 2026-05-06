#!/bin/bash

# Ultra Aircon Platform Build Script

echo "Building Ultra Aircon Platform..."

# Build all workspaces
npm run build

# Build AI components
echo "Building AI components..."

# Lint Python code
echo "Linting Python code..."
for dir in ai-platform/*/; do
  if [ -d "$dir" ]; then
    cd "$dir"
    if [ -d "venv" ]; then
      source venv/bin/activate
      mypy . --ignore-missing-imports || echo "MyPy check failed for $dir"
      black . --check || echo "Black check failed for $dir"
      isort . --check-only || echo "Isort check failed for $dir"
      deactivate
    fi
    cd ../..
  fi
done

# Build Docker images for AI services
for dir in ai-platform/*/; do
  if [ -d "$dir" ] && [ -f "$dir/Dockerfile" ]; then
    service_name=$(basename "$dir")
    echo "Building Docker image for $service_name"
    docker build -t "ultra-aircon/$service_name" "$dir"
  fi
done

# Build backend services
for dir in backend/*/; do
  if [ -d "$dir" ]; then
    echo "Building $dir"
    cd "$dir"
    npm run build
    cd ../..
  fi
done

# Build apps
for dir in apps/*/; do
  if [ -d "$dir" ]; then
    echo "Building $dir"
    cd "$dir"
    npm run build 2>/dev/null || echo "No build script"
    cd ../..
  fi
done

echo "Build complete!"