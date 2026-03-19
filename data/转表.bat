@echo off
cd /d "%~dp0.."
call npx tsx scripts/build-data.ts
if %ERRORLEVEL% neq 0 (
    echo.
    echo [FAILED] Check errors above.
    pause
    exit /b 1
)
echo.
echo [DONE] JSON updated. Refresh browser to apply changes.
pause
