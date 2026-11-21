@echo off
title Humanify AI GitHub Push & Deploy Helper
echo ========================================================
echo         Humanify AI - Push to GitHub & Deploy
echo ========================================================
echo.
echo All deployment files (vercel.json, api/index.py) are ready!
echo.
echo Steps:
echo 1. Go to https://github.com/new and create a new repository
echo    (e.g., named 'humanify-ai').
echo 2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/humanify-ai.git).
echo.
set /p REPO_URL="Paste your GitHub Repository URL here: "

if "%REPO_URL%"=="" (
    echo No URL entered. Exiting.
    pause
    exit /b
)

echo.
echo Setting remote origin to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing code to GitHub...
git push -u origin main

echo.
echo ========================================================
echo  Code successfully pushed to GitHub!
echo.
echo  Now to deploy in 60 seconds (100% Free):
echo  1. Visit https://vercel.com/new
echo  2. Select your 'humanify-ai' repository.
echo  3. Click 'Deploy'!
echo.
echo  Your app will be live at: https://humanify-ai.vercel.app
echo ========================================================
pause
