@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo TripPilot SaaS Docker Deployment
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    exit /b 1
)

echo OK: Docker and Docker Compose found
echo.

REM Check environment file
if not exist ".env.production.local" (
    echo Error: .env.production.local not found
    echo Please copy .env.production to .env.production.local and update it
    exit /b 1
)

echo OK: Environment file found
echo.

REM Select deployment mode
echo Select deployment mode:
echo 1) Development (docker-compose.yml)
echo 2) Production (docker-compose.production.yml)
echo.
set /p DEPLOY_MODE="Enter choice (1-2): "

if "%DEPLOY_MODE%"=="1" (
    set COMPOSE_FILE=docker-compose.yml
    echo Using development configuration
) else if "%DEPLOY_MODE%"=="2" (
    set COMPOSE_FILE=docker-compose.production.yml
    echo Using production configuration
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down 2>nul

if "%DEPLOY_MODE%"=="1" (
    echo Building images...
    docker-compose -f %COMPOSE_FILE% build
    if errorlevel 1 (
        echo Build failed
        exit /b 1
    )
)

echo.
echo Starting services...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo Failed to start services
    exit /b 1
)

echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak

echo.
echo Checking service health...
docker-compose -f %COMPOSE_FILE% ps

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Services are running at:
echo   Backend API:    http://localhost:8000
echo   API Docs:       http://localhost:8000/docs
echo   Frontend:       http://localhost:3000
echo   Admin Portal:   http://localhost:3001
echo   Database:       localhost:3306
echo.
echo View logs:
echo   All:     docker-compose -f %COMPOSE_FILE% logs -f
echo   Backend: docker-compose -f %COMPOSE_FILE% logs -f backend
echo.
echo Stop services:
echo   docker-compose -f %COMPOSE_FILE% down
echo.
pause
