@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "SRC_DIR=%ROOT_DIR%src"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "FRONTEND_URL=http://localhost:5173"

echo Starting AI Biometric Attendance System...
echo.

if not exist "%BACKEND_DIR%\package.json" (
  echo Backend folder not found: %BACKEND_DIR%
  pause
  exit /b 1
)

if not exist "%SRC_DIR%\ks-cam.py" (
  echo Python camera app not found: %SRC_DIR%\ks-cam.py
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo Frontend folder not found: %FRONTEND_DIR%
  pause
  exit /b 1
)

set "PYTHON_CMD=python"
if exist "%SRC_DIR%\.venv\Scripts\python.exe" set "PYTHON_CMD=%SRC_DIR%\.venv\Scripts\python.exe"
if exist "%ROOT_DIR%.venv\Scripts\python.exe" set "PYTHON_CMD=%ROOT_DIR%.venv\Scripts\python.exe"
if exist "%ROOT_DIR%venv\Scripts\python.exe" set "PYTHON_CMD=%ROOT_DIR%venv\Scripts\python.exe"

echo Using Python: %PYTHON_CMD%
echo.

echo Starting backend API...
start "ATT Backend API" /D "%BACKEND_DIR%" cmd /k npm.cmd start
timeout /t 3 /nobreak >nul

echo Starting camera recognition and MJPEG stream server...
start "ATT Camera Recognition" /D "%SRC_DIR%" cmd /k ""%PYTHON_CMD%" ks-cam.py"
timeout /t 3 /nobreak >nul

echo Starting React frontend...
start "ATT React Frontend" /D "%FRONTEND_DIR%" cmd /k npm.cmd run dev -- --host 0.0.0.0 --port 5173
timeout /t 5 /nobreak >nul
start "" "%FRONTEND_URL%"

echo.
echo Started three windows:
echo - Backend API:       http://localhost:8000
echo - Camera streams:    http://localhost:5055/video/entry and /video/exit
echo - Frontend:          %FRONTEND_URL%
echo.
echo If port 8000 is already in use, close the old backend window first.
echo If camera streams do not load, check the ATT Camera Recognition window.
echo.
pause
