@echo off
where py >nul 2>nul
if %errorlevel%==0 (py -3 "%~dp0imap-helper.py" & pause & exit /b)
where python >nul 2>nul
if %errorlevel%==0 (python "%~dp0imap-helper.py" & pause & exit /b)
echo Python 3? ???? ?? ????. Microsoft Store?? Python? ??? ? ?? ?????.
pause
