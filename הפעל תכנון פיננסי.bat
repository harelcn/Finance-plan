@echo off
cd /d "%~dp0"
start "" http://localhost:3002
npm run dev
pause
