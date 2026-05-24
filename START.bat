@echo off
title NEXUS Platform - Demarrage

:: ============================================================
::  NEXUS Platform - Demarrage rapide
::  Double-cliquez pour tout lancer
::  Argument : START.bat stop  -> arreter les serveurs
:: ============================================================

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

:: -- Banniere -------------------------------------------------
echo.
echo  ##  ##  #####  ##  ##  ##  ##  #####
echo  ### ##  ##     ##  ##  ##  ##  ##
echo  ######  ####    ####   ##  ##  #####
echo  ## ###  ##      ####   ##  ##      ##
echo  ##  ##  #####    ##     ####   #####
echo.
echo  [ Platform for Hackers and Developers ]
echo  -----------------------------------------
echo.

:: -- Arret ----------------------------------------------------
if /i "%1"=="stop" goto :STOP

:: -- Detection Docker -----------------------------------------
docker info >nul 2>&1
if %errorlevel% == 0 (
    echo  [AUTO] Docker detecte  --^>  Mode Docker
    goto :DOCKER
) else (
    echo  [AUTO] Docker absent   --^>  Mode Local
    goto :LOCAL
)

:: =============================================================
:DOCKER
:: =============================================================
echo.
echo  [1/5] Fichier .env...
if not exist "%ROOT%.env" (
    copy "%ROOT%.env.example" "%ROOT%.env" >nul
    echo        .env cree depuis .env.example
) else (
    echo        .env deja present
)

echo.
echo  [2/5] Construction des images Docker...
docker-compose -f "%ROOT%docker-compose.yml" build --quiet
if %errorlevel% neq 0 (
    echo  ERREUR : build Docker echoue
    pause & exit /b 1
)
echo        Images construites

echo.
echo  [3/5] Demarrage des services...
docker-compose -f "%ROOT%docker-compose.yml" up -d
if %errorlevel% neq 0 (
    echo  ERREUR : demarrage echoue
    pause & exit /b 1
)
echo        db, redis, backend, celery, frontend, nginx demarres

echo.
echo  [4/5] Attente PostgreSQL...
:WAIT_DB
timeout /t 2 /nobreak >nul
docker-compose exec -T db pg_isready -U nexus_user >nul 2>&1
if %errorlevel% neq 0 goto :WAIT_DB
echo        PostgreSQL pret

echo.
echo  [5/5] Migrations + seed data...
docker-compose -f "%ROOT%docker-compose.yml" exec -T backend python manage.py migrate --no-input >nul 2>&1
docker-compose -f "%ROOT%docker-compose.yml" exec -T backend python manage.py seed_data >nul 2>&1
echo        Base de donnees prete

goto :SUCCESS_DOCKER

:: =============================================================
:LOCAL
:: =============================================================
echo.
echo  [1/6] Verification Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERREUR : Python introuvable.
    echo  Installe Python 3.10+ depuis https://python.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo        %%v detecte

echo.
echo  [2/6] Verification Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERREUR : Node.js introuvable.
    echo  Installe Node.js 18+ depuis https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo        Node %%v detecte

echo.
echo  [3/6] Fichier .env backend...
if not exist "%BACKEND%\.env" (
    if exist "%BACKEND%\.env.example" (
        copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    ) else (
        echo SECRET_KEY=nexus-dev-secret-key-change-in-production > "%BACKEND%\.env"
        echo DEBUG=True >> "%BACKEND%\.env"
        echo ALLOWED_HOSTS=localhost,127.0.0.1 >> "%BACKEND%\.env"
        echo REDIS_URL=redis://localhost:6379/0 >> "%BACKEND%\.env"
    )
    echo        .env cree
) else (
    echo        .env deja present
)

echo.
echo  [4/6] Environnement Python + dependances...
if not exist "%BACKEND%\.venv" (
    python -m venv "%BACKEND%\.venv"
    echo        Virtualenv cree
) else (
    echo        Virtualenv existant
)
"%BACKEND%\.venv\Scripts\pip.exe" install -r "%BACKEND%\requirements.txt" --only-binary=:all: -q
if %errorlevel% neq 0 (
    echo.
    echo  Tentative sans --only-binary (compilation source)...
    "%BACKEND%\.venv\Scripts\pip.exe" install -r "%BACKEND%\requirements.txt" -q
)
if %errorlevel% neq 0 (
    echo  ERREUR : pip install echoue
    echo  Conseil : utilise Python 3.11 ou 3.12 (python.org/downloads)
    pause & exit /b 1
)
echo        Dependances Python installees

echo.
echo  [5/6] Migrations + seed data...
"%BACKEND%\.venv\Scripts\python.exe" "%BACKEND%\manage.py" migrate --no-input >nul 2>&1
"%BACKEND%\.venv\Scripts\python.exe" "%BACKEND%\manage.py" seed_data >nul 2>&1
echo        Base de donnees prete (5 users, 10 challenges, 3 tournois)

echo.
echo  [6/6] Dependances Node.js...
if not exist "%FRONTEND%\node_modules" (
    pushd "%FRONTEND%"
    npm install --silent
    if %errorlevel% neq 0 (
        echo  ERREUR : npm install echoue
        pause & exit /b 1
    )
    popd
    echo        node_modules installes
) else (
    echo        node_modules deja presents
)

echo.
echo  Lancement backend Django sur le port 8000...
start "NEXUS Backend" cmd /k ""%BACKEND%\.venv\Scripts\python.exe" "%BACKEND%\manage.py" runserver 0.0.0.0:8000"

timeout /t 2 /nobreak >nul

echo  Lancement frontend React sur le port 5173...
start "NEXUS Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"

timeout /t 3 /nobreak >nul

goto :SUCCESS_LOCAL

:: =============================================================
:SUCCESS_DOCKER
echo.
echo  +----------------------------------------------+
echo  ^|        NEXUS EST EN LIGNE  OK               ^|
echo  +----------------------------------------------+
echo  ^|  Frontend  --^>  http://localhost            ^|
echo  ^|  API       --^>  http://localhost/api/v1/    ^|
echo  ^|  Swagger   --^>  http://localhost/api/v1/docs^|
echo  ^|  Admin     --^>  http://localhost/admin/     ^|
echo  +----------------------------------------------+
echo  ^|  Arreter   :  START.bat stop                ^|
echo  ^|  Logs      :  docker-compose logs -f        ^|
echo  +----------------------------------------------+
echo.
start "" "http://localhost"
pause
exit /b 0

:SUCCESS_LOCAL
echo.
echo  +----------------------------------------------+
echo  ^|        NEXUS EST EN LIGNE  OK               ^|
echo  +----------------------------------------------+
echo  ^|  Frontend  --^>  http://localhost:5173       ^|
echo  ^|  API       --^>  http://localhost:8000/api/  ^|
echo  ^|  Swagger   --^>  http://localhost:8000/api/v1/docs^|
echo  ^|  Admin     --^>  http://localhost:8000/admin/^|
echo  +----------------------------------------------+
echo  ^|  Arreter : ferme les 2 fenetres CMD         ^|
echo  +----------------------------------------------+
echo.
start "" "http://localhost:5173"
pause
exit /b 0

:: =============================================================
:STOP
echo.
echo  Arret de NEXUS...
docker-compose -f "%ROOT%docker-compose.yml" down >nul 2>&1
taskkill /fi "WindowTitle eq NEXUS Backend*" /f >nul 2>&1
taskkill /fi "WindowTitle eq NEXUS Frontend*" /f >nul 2>&1
echo  Tous les services sont arretes.
echo.
pause
exit /b 0
