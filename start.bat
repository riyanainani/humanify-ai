@echo off
title Humanify AI Launcher
echo ========================================================
echo         Launching Humanify AI (100% Free & Local)
echo ========================================================
echo.

echo Starting Python FastAPI Backend on port 8000...
start "Humanify AI Backend" cmd /k "python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000"

echo Starting Vite Frontend on port 5173...
start "Humanify AI Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul
echo.
echo ========================================================
echo  Access URLs:
echo  - Laptop / PC:  http://localhost:5173
echo  - Mobile Phone: http://192.168.31.196:5173
echo ========================================================
echo.
echo Opening Humanify AI in your default browser...
start http://localhost:5173

echo.
echo Humanify AI is now active! 
echo Keep these terminal windows open while using the app.
pause
