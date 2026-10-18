@echo off
cd /d "%~dp0"
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "do { Start-Sleep 1; try { $ok = (Invoke-WebRequest http://localhost:3002 -UseBasicParsing -TimeoutSec 60).StatusCode -eq 200 } catch { $ok = $false } } until ($ok); Start-Process 'http://localhost:3002'"
npm run dev
pause
