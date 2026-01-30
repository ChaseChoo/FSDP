@echo off
REM Bank Appointment - ngrok Quick Start
REM This script will download and start ngrok for mobile access

echo ==========================================
echo Bank Appointment - Mobile Access Setup
echo ==========================================
echo.

REM Check if ngrok exists
if not exist "%USERPROFILE%\ngrok\ngrok.exe" (
    echo ngrok not found!
    echo.
    echo Please download ngrok first:
    echo 1. Go to https://ngrok.com/download
    echo 2. Download the Windows version
    echo 3. Extract to: %USERPROFILE%\ngrok\
    echo.
    echo After extracting, run this script again.
    pause
    exit /b 1
)

REM Check if auth token is set
echo.
echo Checking ngrok authentication...
"%USERPROFILE%\ngrok\ngrok.exe" config check >nul 2>&1
if errorlevel 1 (
    echo.
    echo ngrok not authenticated!
    echo.
    echo To authenticate:
    echo 1. Sign up at https://ngrok.com/signup
    echo 2. Get your auth token from https://dashboard.ngrok.com/auth
    echo 3. Run this command:
    echo    "%USERPROFILE%\ngrok\ngrok.exe" config add-authtoken YOUR_TOKEN_HERE
    echo.
    pause
    exit /b 1
)

REM Start ngrok
echo.
echo Starting ngrok on port 3000...
echo.
echo Your mobile URL will be displayed below.
echo Keep this window open while accessing from mobile.
echo.
echo ==========================================
echo.

"%USERPROFILE%\ngrok\ngrok.exe" http 3000 --log=stdout

pause
