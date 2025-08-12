@echo off
echo 🚀 Cosmic Commander Game - Git Push Script
echo.

echo 📁 Adding all files to git...
git add .

echo 📝 Committing changes...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Deploy ready - Added Docker, deployment configs, and documentation

git commit -m "%commit_message%"

echo 🌐 Pushing to GitHub...
git push origin main

echo.
echo ✅ Successfully pushed to GitHub!
echo 🔗 Now you can deploy to Render using your GitHub repository
echo.
pause
