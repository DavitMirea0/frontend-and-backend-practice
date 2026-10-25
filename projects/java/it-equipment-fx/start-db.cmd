@echo off
chcp 65001 >nul
cd /d "%~dp0"
docker compose up -d --wait db
if errorlevel 1 goto end
docker compose up --no-deps --exit-code-from migrate migrate
if errorlevel 1 echo Database update failed. Check connection settings.
:end
pause
