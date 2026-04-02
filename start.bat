@echo off
title RP Room Builder
echo.
echo   RP Room Builder - Starting up...
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   ERROR: Node.js is not installed!
    echo   Download it from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo   Installing dependencies (first run only)...
    npm install --production
    echo.
)

:: Build frontend if needed
if not exist "server\public" (
    echo   Building web UI (first run only)...
    call npm run build
    echo.
)

:: Start the app
echo   Starting RP Room Builder...
echo   Open http://localhost:3000 in your browser
echo   Press Ctrl+C to stop
echo.
node server/index.js
pause
