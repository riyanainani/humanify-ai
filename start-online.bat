@echo off
title Humanify AI (Anywhere / Mobile Data Access)
echo ========================================================
echo   Launching Humanify AI with Free Public Tunnel
echo   (Access from Phone on 4G/5G/Anywhere in the World!)
echo ========================================================
echo.

echo Starting Python Backend on port 8000...
start "Humanify AI Backend" cmd /k "python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000"

echo Starting Vite Frontend on port 5173...
start "Humanify AI Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak >nul
echo.
echo ========================================================
echo  Local URLs:
echo  - Laptop / PC:  http://localhost:5173
echo  - Same Wi-Fi:   http://192.168.31.196:5173
echo ========================================================
echo.
echo Creating Free Public Tunnel for Cellular / 4G / 5G...
echo Copy the public URL shown below and open it on your phone!
echo.
npx localtunnel --port 5173
pause

