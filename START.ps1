# ============================================================
#  NEXUS Platform — Démarrage rapide
#  Usage: .\START.ps1
#         .\START.ps1 -Mode docker
#         .\START.ps1 -Mode local
#         .\START.ps1 -Stop
# ============================================================

param(
    [string]$Mode = "auto",
    [switch]$Stop
)

$CYAN    = "Cyan"
$MAGENTA = "Magenta"
$GREEN   = "Green"
$RED     = "Red"
$YELLOW  = "Yellow"
$WHITE   = "White"

function Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor $CYAN
    Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor $CYAN
    Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor $MAGENTA
    Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor $MAGENTA
    Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor $CYAN
    Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor $CYAN
    Write-Host ""
    Write-Host "  [ Platform for Hackers & Developers ]" -ForegroundColor $MAGENTA
    Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Log($msg, $color = $WHITE) {
    Write-Host "  » $msg" -ForegroundColor $color
}

function Step($msg) {
    Write-Host ""
    Write-Host "  ┌─ $msg" -ForegroundColor $YELLOW
}

function OK($msg) {
    Write-Host "  └─ ✓ $msg" -ForegroundColor $GREEN
}

function Fail($msg) {
    Write-Host "  └─ ✗ $msg" -ForegroundColor $RED
}

# ── Arrêt ──────────────────────────────────────────────────
if ($Stop) {
    Banner
    Step "Arrêt de NEXUS..."
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose down
        OK "Services Docker arrêtés"
    }
    Get-Job | Where-Object { $_.Name -like "nexus-*" } | Stop-Job
    Get-Job | Where-Object { $_.Name -like "nexus-*" } | Remove-Job
    OK "Processus locaux arrêtés"
    Write-Host ""
    exit 0
}

Banner

# ── Détection du mode ──────────────────────────────────────
if ($Mode -eq "auto") {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerRunning = $false
        try { docker info 2>$null | Out-Null; $dockerRunning = $true } catch {}
        if ($dockerRunning) { $Mode = "docker" } else { $Mode = "local" }
    } else {
        $Mode = "local"
    }
}

Log "Mode sélectionné : $Mode" $CYAN
Log "Répertoire      : $PSScriptRoot" DarkGray

# ══════════════════════════════════════════════════════════
#  MODE DOCKER
# ══════════════════════════════════════════════════════════
if ($Mode -eq "docker") {

    Step "Vérification du fichier .env..."
    if (-not (Test-Path "$PSScriptRoot\.env")) {
        Copy-Item "$PSScriptRoot\.env.example" "$PSScriptRoot\.env"
        OK ".env créé depuis .env.example (vérifie les valeurs si besoin)"
    } else {
        OK ".env déjà présent"
    }

    Step "Construction des images Docker..."
    docker-compose -f "$PSScriptRoot\docker-compose.yml" build --quiet
    if ($LASTEXITCODE -ne 0) { Fail "Échec du build"; exit 1 }
    OK "Images construites"

    Step "Démarrage des services..."
    docker-compose -f "$PSScriptRoot\docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { Fail "Échec du démarrage"; exit 1 }
    OK "Services lancés (db, redis, backend, celery, frontend, nginx)"

    Step "Attente que la base de données soit prête..."
    $tries = 0
    do {
        Start-Sleep -Seconds 2
        $tries++
        $ready = docker-compose exec -T db pg_isready -U nexus_user 2>$null
    } while ($LASTEXITCODE -ne 0 -and $tries -lt 15)
    if ($tries -ge 15) { Fail "Base de données non disponible"; exit 1 }
    OK "PostgreSQL prêt"

    Step "Migrations Django..."
    docker-compose -f "$PSScriptRoot\docker-compose.yml" exec -T backend python manage.py migrate --no-input
    OK "Migrations appliquées"

    Step "Données de démonstration..."
    docker-compose -f "$PSScriptRoot\docker-compose.yml" exec -T backend python manage.py seed_data 2>$null
    OK "Données seed chargées (5 users, 10 challenges, 3 tournois)"

    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor $GREEN
    Write-Host "  ║         NEXUS EST EN LIGNE ✓             ║" -ForegroundColor $GREEN
    Write-Host "  ╠══════════════════════════════════════════╣" -ForegroundColor $GREEN
    Write-Host "  ║  Frontend  →  http://localhost           ║" -ForegroundColor $CYAN
    Write-Host "  ║  API       →  http://localhost/api/v1/   ║" -ForegroundColor $CYAN
    Write-Host "  ║  Swagger   →  http://localhost/api/v1/docs/ ║" -ForegroundColor $CYAN
    Write-Host "  ║  Admin     →  http://localhost/admin/    ║" -ForegroundColor $MAGENTA
    Write-Host "  ╠══════════════════════════════════════════╣" -ForegroundColor $GREEN
    Write-Host "  ║  Pour arrêter : .\START.ps1 -Stop        ║" -ForegroundColor $YELLOW
    Write-Host "  ║  Logs       : docker-compose logs -f     ║" -ForegroundColor DarkGray
    Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor $GREEN
    Write-Host ""

    Start-Process "http://localhost"
    exit 0
}

# ══════════════════════════════════════════════════════════
#  MODE LOCAL (sans Docker)
# ══════════════════════════════════════════════════════════
if ($Mode -eq "local") {

    $backendDir  = "$PSScriptRoot\backend"
    $frontendDir = "$PSScriptRoot\frontend"

    # ── Python ──────────────────────────────────────────
    Step "Vérification Python..."
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Fail "Python introuvable. Installe Python 3.10+ depuis https://python.org"
        exit 1
    }
    $pyVer = python --version 2>&1
    OK "$pyVer détecté"

    # ── Node ────────────────────────────────────────────
    Step "Vérification Node.js..."
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Fail "Node.js introuvable. Installe Node.js 18+ depuis https://nodejs.org"
        exit 1
    }
    $nodeVer = node --version 2>&1
    OK "Node $nodeVer détecté"

    # ── .env backend ────────────────────────────────────
    Step "Fichier .env backend..."
    if (-not (Test-Path "$backendDir\.env")) {
        if (Test-Path "$backendDir\.env.example") {
            Copy-Item "$backendDir\.env.example" "$backendDir\.env"
            OK ".env créé (SQLite par défaut en dev)"
        } else {
            Log "Pas de .env.example trouvé, création manuelle..." $YELLOW
            @"
SECRET_KEY=nexus-dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
REDIS_URL=redis://localhost:6379/0
"@ | Out-File -Encoding utf8 "$backendDir\.env"
            OK ".env minimal créé"
        }
    } else {
        OK ".env backend déjà présent"
    }

    # ── Virtualenv + dépendances Python ─────────────────
    Step "Environnement virtuel Python..."
    if (-not (Test-Path "$backendDir\.venv")) {
        python -m venv "$backendDir\.venv"
        OK "Virtualenv créé"
    } else {
        OK "Virtualenv déjà présent"
    }

    $pip  = "$backendDir\.venv\Scripts\pip.exe"
    $py   = "$backendDir\.venv\Scripts\python.exe"

    Step "Installation des dépendances Python..."
    & $pip install -r "$backendDir\requirements.txt" -q
    if ($LASTEXITCODE -ne 0) { Fail "pip install échoué"; exit 1 }
    OK "Dépendances Python installées"

    # ── Migrations ──────────────────────────────────────
    Step "Migrations Django..."
    & $py "$backendDir\manage.py" migrate --no-input 2>&1 | Out-Null
    OK "Base de données migrée"

    # ── Seed data ───────────────────────────────────────
    Step "Chargement des données de démonstration..."
    & $py "$backendDir\manage.py" seed_data 2>&1 | Out-Null
    OK "5 utilisateurs, 10 challenges, 3 tournois créés"

    # ── npm install ─────────────────────────────────────
    Step "Installation des dépendances Node.js..."
    if (-not (Test-Path "$frontendDir\node_modules")) {
        Push-Location $frontendDir
        npm install --silent
        if ($LASTEXITCODE -ne 0) { Fail "npm install échoué"; exit 1 }
        Pop-Location
        OK "node_modules installés"
    } else {
        OK "node_modules déjà présents"
    }

    # ── Lancement des serveurs ───────────────────────────
    Step "Démarrage du backend Django (port 8000)..."
    $backendJob = Start-Job -Name "nexus-backend" -ScriptBlock {
        param($py, $dir)
        & $py "$dir\manage.py" runserver 0.0.0.0:8000
    } -ArgumentList $py, $backendDir
    OK "Backend lancé (Job: nexus-backend)"

    Start-Sleep -Seconds 2

    Step "Démarrage du frontend React (port 5173)..."
    $frontendJob = Start-Job -Name "nexus-frontend" -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run dev
    } -ArgumentList $frontendDir
    OK "Frontend lancé (Job: nexus-frontend)"

    Start-Sleep -Seconds 3

    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor $GREEN
    Write-Host "  ║         NEXUS EST EN LIGNE ✓             ║" -ForegroundColor $GREEN
    Write-Host "  ╠══════════════════════════════════════════╣" -ForegroundColor $GREEN
    Write-Host "  ║  Frontend  →  http://localhost:5173      ║" -ForegroundColor $CYAN
    Write-Host "  ║  API       →  http://localhost:8000/api/ ║" -ForegroundColor $CYAN
    Write-Host "  ║  Swagger   →  http://localhost:8000/api/v1/docs/ ║" -ForegroundColor $CYAN
    Write-Host "  ║  Admin     →  http://localhost:8000/admin/ ║" -ForegroundColor $MAGENTA
    Write-Host "  ╠══════════════════════════════════════════╣" -ForegroundColor $GREEN
    Write-Host "  ║  Pour arrêter : .\START.ps1 -Stop        ║" -ForegroundColor $YELLOW
    Write-Host "  ║  Logs backend  : Receive-Job nexus-backend ║" -ForegroundColor DarkGray
    Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor $GREEN
    Write-Host ""

    Start-Process "http://localhost:5173"

    # Garder le script vivant + afficher les logs
    Write-Host "  Appuie sur Ctrl+C pour arrêter..." -ForegroundColor DarkGray
    Write-Host ""
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            $beState = (Get-Job -Name "nexus-backend").State
            $feState = (Get-Job -Name "nexus-frontend").State
            if ($beState -eq "Failed") { Log "Backend s'est arrêté (erreur)" $RED }
            if ($feState -eq "Failed") { Log "Frontend s'est arrêté (erreur)" $RED }
        }
    } finally {
        Get-Job | Where-Object { $_.Name -like "nexus-*" } | Stop-Job
        Get-Job | Where-Object { $_.Name -like "nexus-*" } | Remove-Job
        Log "Services arrêtés." $YELLOW
    }
}
