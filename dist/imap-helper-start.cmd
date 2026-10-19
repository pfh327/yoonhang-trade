@echo off
set "SCRIPT=%~dp0imap-helper.py"
if not exist "%SCRIPT%" (
  echo imap-helper.py ??? ????. ????? ?? ZIP? ?? ???? ??? ?? ?????.
  pause
  exit /b 1
)
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\YoonhangTrade126Mail.lnk"
if not exist "%LINK%" powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=New-Object -ComObject WScript.Shell; $l=$w.CreateShortcut($env:LINK); $l.TargetPath=$env:ComSpec; $l.Arguments='/c ""%~dp0imap-helper-start.cmd""'; $l.WorkingDirectory='%~dp0'; $l.WindowStyle=7; $l.Save()"
where py >nul 2>nul
if %errorlevel%==0 (py -3 "%SCRIPT%" & pause & exit /b)
where python >nul 2>nul
if %errorlevel%==0 (python "%SCRIPT%" & pause & exit /b)
echo Python 3? ???? ?? ????.
pause
