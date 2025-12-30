@echo off
echo 🔍 Checking Docker status...

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

echo 🐳 Starting Docker containers (database and Redis only)...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker containers
    exit /b 1
)

echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo 🚀 Starting development server...
npm run dev:only