@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
  ) else (
    echo Node.js belum terpasang atau tidak ditemukan di PATH.
    echo Unduh dan pasang Node.js versi 22 atau lebih baru dari https://nodejs.org/
    echo Setelah selesai, tutup dan buka kembali jendela ini, lalu jalankan start.bat lagi.
    pause
    exit /b 1
  )
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm tidak ditemukan. Pasang ulang Node.js versi 22 atau lebih baru.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Memasang dependensi website...
  call npm install
  if errorlevel 1 (
    echo Gagal memasang dependensi.
    pause
    exit /b 1
  )
)

echo Menjalankan website di http://localhost:3000
call npm start
pause
