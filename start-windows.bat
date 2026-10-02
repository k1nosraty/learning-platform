@echo off
setlocal
cd /d "%~dp0"
title Learning Platform - Windows launcher
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Setup did not finish. Read the message above, then run this file again.
pause
exit /b %RESULT%
