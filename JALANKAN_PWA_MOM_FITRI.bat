@echo off
title DAPUR MOM FITRI - PWA Local Server
cd /d "%~dp0"

echo ========================================================
echo   MENJALANKAN APLIKASI DAPUR MOM FITRI (MODE PWA)
echo ========================================================
echo.
echo Sedang memulai server lokal port 8080...
echo Browser akan terbuka secara otomatis.
echo.
echo JANGAN TUTUP JENDELA INI SELAMA APLIKASI DIGUNAKAN.
echo ========================================================
echo.

node server.js

pause
