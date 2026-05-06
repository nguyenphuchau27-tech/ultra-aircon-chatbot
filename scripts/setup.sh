#!/bin/bash

# Ultra Aircon Platform Setup Script

echo "Setting up Ultra Aircon Platform..."

# Install root dependencies
npm install

# Setup Python environments for AI components
echo "Setting up Python environments..."

# AI Platform
for dir in ai-platform/*/; do
  if [ -d "$dir" ]; then
    echo "Setting up $dir"
    cd "$dir"
    if [ -f "requirements.txt" ]; then
      python -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
      pip install mypy black isort
      deactivate
    fi
    cd ../..
  fi
done

# Digital Twin
for dir in digital-twin/*/; do
  if [ -d "$dir" ]; then
    echo "Setting up $dir"
    cd "$dir"
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt 2>/dev/null || echo "No requirements.txt"
    pip install mypy black isort
    deactivate
    cd ../..
  fi
done

# Super AI
for dir in super-ai/*/; do
  if [ -d "$dir" ]; then
    echo "Setting up $dir"
    cd "$dir"
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt 2>/dev/null || echo "No requirements.txt"
    pip install mypy black isort
    deactivate
    cd ../..
  fi
done

# Setup Node.js workspaces
npm run setup-workspaces

echo "Setup complete!"