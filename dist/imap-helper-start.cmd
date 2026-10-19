@echo off
set "SCRIPT=%~dp0imap-helper.py"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\???? 126?? ???.lnk"
if not exist "%LINK%" powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=New-Object -ComObject WScript.Shell; $l=$w.CreateShortcut($env:LINK); $l.TargetPath=$env:SCRIPT; $l.Arguments=''; $l.WorkingDirectory='%~dp0'; $l.WindowStyle=7; $l.Save()"
where py >nul 2>nul
if %errorlevel%==0 (py -3 "%SCRIPT%" & pause & exit /b)
where python >nul 2>nul
if %errorlevel%==0 (python "%SCRIPT%" & pause & exit /b)
echo Python 3? ???? ?? ????. Microsoft Store?? Python? ??? ? ?? ?????.
pause
