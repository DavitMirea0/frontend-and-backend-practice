@echo off
chcp 65001 >nul
cd /d "%~dp0"
docker compose exec -T db psql -U it_app -d it_equipment -v ON_ERROR_STOP=1 < sql\03-cascade-delete.sql
if errorlevel 1 (
 echo Database update failed.
) else (
 echo Cascade deletion enabled. Existing records are preserved.
)
pause
