function pip-add {
    param (
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$packages
    )

    if ($packages) {
        python -m pip install $packages
        python -m pip freeze > requirements.txt
        Write-Host "The library [$($packages -join ', ')] has been successfully installed, requirements.txt was updated." -ForegroundColor Green
    }
}

function pip-remove {
    param (
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$packages
    )

    if ($packages) {
        python -m pip uninstall $package -y
        python -m pip freeze > requirements.txt
        Write-Host "The library [$($packages -join ', ')] has been successfully removed, requirements.txt was updated." -ForegroundColor Cyan
    }  
}

Write-Host "The tools has been successfully installed" -ForegroundColor DarkCyan