@echo off
echo.
echo  ============================================================
echo           ARIA - Veridian Corp IT Support Agent              
echo  ============================================================
echo.

cd /d "%~dp0"

if exist ".env" (
    echo  [+] .env file found
) else (
    echo  [!] Copying .env.example to .env...
    copy .env.example .env
)

echo  [*] Starting Flask Backend on http://localhost:5000...
start "ARIA Backend" cmd /k "cd backend && python app.py"

echo  [*] Starting Next.js Frontend on http://localhost:3001...
start "ARIA Frontend" cmd /k "cd frontend-next && npm run dev"

echo.
echo  ============================================================
echo  ARIA is running!
echo  -> Frontend: http://localhost:3001
echo  -> Backend:  http://localhost:5000
echo  ============================================================
echo.
pause
