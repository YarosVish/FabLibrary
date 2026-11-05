@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Fab Library

rem --- 1. Собственный портативный Node.js 22 LTS в папке runtime (системный Node не используется) ---
set "NODEDIR=%~dp0runtime\node"
if not exist "%NODEDIR%\node.exe" (
  echo Скачиваю портативный Node.js 22 LTS с nodejs.org ^(около 30 МБ, один раз^)...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\get-node.ps1"
  if errorlevel 1 (
    echo.
    echo Не удалось скачать Node.js. Проверьте интернет и запустите этот файл ещё раз.
    pause
    exit /b 1
  )
)
set "PATH=%NODEDIR%;%PATH%"

rem --- 2. Electron — только при первом запуске ---
if not exist "node_modules\electron\dist\electron.exe" (
  echo Первый запуск: устанавливаю Electron ^(около 100 МБ, один раз^)...
  "%NODEDIR%\node.exe" "%NODEDIR%\node_modules\npm\bin\npm-cli.js" install --no-audit --no-fund --ignore-scripts=false --foreground-scripts
  if errorlevel 1 (
    echo Ошибка установки. Проверьте интернет и запустите ещё раз.
    pause
    exit /b 1
  )
)
rem Иногда npm не запускает скрипт, который скачивает сам Electron (около 100 МБ с GitHub). Запускаем его напрямую.
if not exist "node_modules\electron\dist\electron.exe" if exist "node_modules\electron\install.js" (
  echo Скачиваю Electron с GitHub...
  "%NODEDIR%\node.exe" "node_modules\electron\install.js"
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Electron не скачался. Проверьте, открывается ли github.com, удалите папку node_modules и запустите ещё раз.
  pause
  exit /b 1
)

rem --- 3. Запуск ---
start "" "node_modules\electron\dist\electron.exe" .
exit /b 0
