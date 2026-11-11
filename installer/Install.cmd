@echo off
title English Through Time Studio installer
echo Placing the English Through Time Studio infographic on your Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); Copy-Item -LiteralPath '%~dp0English Through Time Studio - How It Works.png' -Destination $d -Force; Write-Host ('Copied to ' + $d)"
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1" -Source "%~dp0payload"
echo.
pause
