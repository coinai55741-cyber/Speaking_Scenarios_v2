@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ===================================================================
rem  客語即時辨識 · 取票服務
rem
rem  下背三行个「等號後背」換做你們真正个值，存檔了後雙擊這隻檔案就好。
rem  等號前後毋好加空格。引號愛留等（密碼有特殊符號乜毋會出問題）。
rem ===================================================================

set "HK_HOST=https://hkrtasr.bronci.com.tw"
set "HK_USER=Hakka20251017_03763109"
set "HK_PASS=Speech03763109"

rem  自簽憑證講毋通个時節，將下背這行頭前个 rem 拿忒
rem set "HK_INSECURE=1"

rem ===================================================================

echo.
if "%HK_USER%"=="在這位填帳號" (
  echo   !! 還吂填帳號密碼。
  echo   !! 請用「記事本」開這隻 .bat，改第 13、14 行，存檔了再雙擊一擺。
  echo.
  pause
  exit /b
)

if not exist "asr_server.js" (
  echo   !! 這隻資料夾內底揣無 asr_server.js
  echo   !! 請確認 .bat 同 asr_server.js 囥在共一隻資料夾。
  echo.
  pause
  exit /b
)

echo   主機：%HK_HOST%
echo   帳號：%HK_USER%
echo.
echo   跑起來以後，這隻視窗毋好關。
echo   愛停就撳 Ctrl+C，抑係直接關這隻視窗。
echo.

node asr_server.js

echo.
echo   服務停忒咧。
pause
