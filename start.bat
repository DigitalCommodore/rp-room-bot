@echo off
setlocal
title RP Room Builder
echo.
echo   RP Room Builder - Starting up...
echo.

:: Ensure working directory is where this script lives
cd /d "%~dp0"

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
if not exist node_modules (
    echo   Installing dependencies ^(first run only^)...
    call npm install --production
    echo.
)

:: Build frontend if needed
if not exist server\public (
    echo   Building web UI ^(first run only^)...
    call npm run build
    echo.
)

:: Start the app in the background
echo   RP Room Builder is running!
echo   http://localhost:3000
echo.
echo   Press any key to stop the application...
echo.
start http://localhost:3000
start /b node server/index.js
:: Find the PID of our specific server process
set NODE_PID=
for /f "tokens=2 delims==" %%a in ('wmic process where "commandline like '%%server/index.js%%'" get processid /value 2^>nul ^| findstr ProcessId') do set NODE_PID=%%a
pause >nul
if defined NODE_PID (
    taskkill /f /pid %NODE_PID% >nul 2>nul
) else (
    taskkill /f /im node.exe >nul 2>nul
)
echo.
echo   RP Room Builder stopped.
