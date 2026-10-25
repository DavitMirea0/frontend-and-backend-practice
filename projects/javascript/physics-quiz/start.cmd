@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22 or newer from nodejs.org.
  pause
  exit /b 1
)
echo Open http://localhost:3000 in your browser.
echo Keep this window open. Press Ctrl+C to stop.
node server.mjs
pause
