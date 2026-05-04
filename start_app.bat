@echo off
echo Starting ShiroScan Backend (API)...
start "ShiroScan Backend" cmd /k "cd backend & ..\venv\Scripts\python.exe -m uvicorn app.main:app --port 8080 --host 127.0.0.1"

echo Starting ShiroScan Frontend (UI)...
start "ShiroScan Frontend" cmd /k "cd artifacts\shiroscan & pnpm install & pnpm run dev"

echo.
echo ========================================================
echo  SHIROSCAN IS STARTING
echo ========================================================
echo  FRONTEND (Main App): http://localhost:5173
echo  BACKEND (API/Docs):  http://localhost:8080/docs
echo ========================================================
echo.
echo Note: The backend at :8080 is an API and will only show
echo raw JSON at the root. Use the Frontend for scanning!
pause
