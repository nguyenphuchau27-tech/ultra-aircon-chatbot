#!/bin/bash

PROJECT=ultra_aircon_startup

echo "Starting project setup..."

# Create project if not exists
if [ ! -d "$PROJECT" ]; then

  echo "Creating project structure..."

  mkdir $PROJECT
  cd $PROJECT

  mkdir backend
  mkdir mobile_app
  mkdir admin_dashboard
  mkdir deployment
  mkdir chatbot
  mkdir scripts

  echo "Project structure created"

else

  echo "Project already exists"
  cd $PROJECT

fi


# =========================
# BACKEND SETUP
# =========================

if [ -d "backend" ]; then

  echo "Installing backend dependencies"

  cd backend

  if [ -f "package.json" ]; then
    npm install

    echo "Building backend"
    npm run build
  fi

  cd ..

fi


# =========================
# ADMIN SETUP
# =========================

if [ -d "admin_dashboard/nextjs" ]; then

  echo "Installing admin dependencies"

  cd admin_dashboard/nextjs

  npm install

  echo "Building admin dashboard"
  npm run build

  cd ../../

fi


# =========================
# MOBILE SETUP
# =========================

if [ -d "mobile_app/flutter_app" ]; then

  echo "Flutter setup"

  cd mobile_app/flutter_app

  flutter pub get

  cd ../../

fi


echo "Build complete"
echo "Project setup completed"