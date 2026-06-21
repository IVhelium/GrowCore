$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Python virtual environment was not found at $python"
}

Push-Location (Join-Path $root "backend")
try {
    & $python -m compileall -q src
    if ($LASTEXITCODE -ne 0) { throw "Backend compilation failed" }

    & $python -m alembic heads
    if ($LASTEXITCODE -ne 0) { throw "Alembic history check failed" }
}
finally {
    Pop-Location
}

Push-Location (Join-Path $root "frontend")
try {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

    npm.cmd run lint
    if ($LASTEXITCODE -ne 0) { throw "Frontend lint failed" }

    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

    npm.cmd audit --audit-level=high
    if ($LASTEXITCODE -ne 0) { throw "npm audit found a high-severity issue" }
}
finally {
    Pop-Location
}

Push-Location $root
try {
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose configuration is invalid" }

    $runningBackend = docker compose ps --status running --services backend 2>$null
    if ($LASTEXITCODE -eq 0 -and $runningBackend -contains "backend") {
        docker compose exec -T backend alembic check
        if ($LASTEXITCODE -ne 0) { throw "SQLAlchemy models and Alembic migrations differ" }
    }
}
finally {
    Pop-Location
}

Write-Host "GrowCore release checks passed." -ForegroundColor Green
