@echo off
title OpenDiagram Architect Launcher
color 0b

:menu
cls
echo ==========================================
echo       OpenDiagram Architect Launcher
echo ==========================================
echo.
echo 1. Start locally (Node.js Development)
echo 2. Start via Docker (Production)
echo 3. Stop Docker Container
echo 4. Stop Local Node.js (Kills process by Port)
echo 5. Exit
echo.
set /p choice="Choose an option (1-5): "

if "%choice%"=="1" goto start_node
if "%choice%"=="2" goto start_docker
if "%choice%"=="3" goto stop_docker
if "%choice%"=="4" goto stop_node
if "%choice%"=="5" exit
goto menu

:start_node
echo.
set /p PORT="Enter port number (Press Enter for default 3000): "
if "%PORT%"=="" set PORT=3000
echo.
echo Starting Next.js development server on port %PORT%...
set PORT=%PORT%
start "OpenDiagram (Node: %PORT%)" cmd /k "npm run dev"
echo Application launched in a new window!
echo Waiting for server to start...
timeout /t 3 /nobreak >nul
start http://localhost:%PORT%
echo.
pause
goto menu

:start_docker
echo.
set /p PORT="Enter external port number (Press Enter for default 3001): "
if "%PORT%"=="" set PORT=3001
echo.
echo Starting Docker container mapped to port %PORT%...
set APP_PORT=%PORT%
docker-compose up -d
echo.
echo Docker container started in the background!
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%
echo.
pause
goto menu

:stop_docker
echo.
echo Stopping Docker container...
docker-compose down
echo.
pause
goto menu

:stop_node
echo.
set /p PORT="Enter port number to kill (Press Enter for default 3000): "
if "%PORT%"=="" set PORT=3000
echo.
echo Finding process listening on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    echo Killing process %%a...
    taskkill /f /pid %%a
)
echo.
echo Done.
pause
goto menu
