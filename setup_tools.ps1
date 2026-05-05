function pip-add {
    param (
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$packages
    )

    if ($packages) {
        pip install $packages
        pip freeze > requirements.txt
        Write-Host "The library [$($packages -join ', ')] has been successfully installed, requirements.txt was updated." -ForegroundColor Green
    }
}

function pip-remove {
    param (
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$packages
    )

    if ($packages) {
        pip uninstall $packages -y
        pip freeze > requirements.txt
        Write-Host "The library [$($packages -join ', ')] has been successfully removed, requirements.txt was updated." -ForegroundColor Cyan
    }  
}

function pip-sync {
    if (!(Test-Path ".\requirements.txt")) {
        Write-Host "File requirements.txt not found" -ForegroundColor Red
        return
    }

    Write-Host "Check dependencies..." -ForegroundColor Cyan

    # Получаем список установленных библиотек
    $installed = pip list --format=freeze | ForEach-Object { $_.Split('==')[0].ToLower() }

    # Читаем файл и фильтруем пустые строки/комментарии
    $required = Get-Content ".\requirements.txt" | Where-Object { $_ -and !($_ -match '^#') }

    $to_install = @()

    foreach ($req in $required) {
        $clean_name = ($req -split '[<>=]')[0].Trim().ToLower()

        if ($clean_name -notin $installed) {
            $to_install += $req
        }
    }

    if ($to_install.Count -gt 0) {
        Write-Host "New libraries found: $($to_install.Count)" -ForegroundColor Yellow
        python -m pip install $to_install
        Write-Host "All libraries have been installed successfully" -ForegroundColor Green
    } else {
        Write-Host "All libraries have already been installed" -ForegroundColor Green
    }
}

# uvicorn initialization function
function app {
    param (
        [Parameter(Position=0)]
        [string]$appname = "src.main"
    )

    uvicorn "$($appname):app" --reload
}

Write-Host "The tools has been successfully installed" -ForegroundColor DarkCyan