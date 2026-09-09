@echo off
cd /d "%~dp0\hf_space_asr"

echo ========================================================
echo   Starting Hakka ASR Backend (Port 5000)
echo ========================================================
echo.

if exist ".venv\Scripts\activate.bat" (
    echo [OK] Loading virtualenv .venv...
    call .venv\Scripts\activate.bat
)

echo [OK] Running Uvicorn on http://127.0.0.1:5000 ...
python -m uvicorn main:app --host 0.0.0.0 --port 5000

pause
