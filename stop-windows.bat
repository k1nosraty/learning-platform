@echo off
setlocal
cd /d "%~dp0"
title Learning Platform - Stop
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows.ps1" -Stop
set "RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULT%
