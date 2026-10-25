@echo off
chcp 65001 >nul
cd /d "%~dp0"
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not running. Start Docker Desktop and try again.
  pause
  exit /b 1
)
if not exist "exports" mkdir "exports"
docker compose run --build --rm app
pause
