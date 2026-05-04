@echo off
echo Starting ShiroScan Backend...
start "ShiroScan Backend" cmd /k "cd backend & ..\venv\Scripts\python.exe -m uvicorn app.main:app --port 8080"

echo Starting ShiroScan Frontend...
start "ShiroScan Frontend" cmd /k "cd artifacts\shiroscan & pnpm install & pnpm run dev"

echo.
echo ========================================================
echo The backend is running on http://localhost:8080
echo The frontend will be available at http://localhost:5173
echo ========================================================
