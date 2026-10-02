# Windows PowerShell 5.1 compatible; no global execution-policy changes.
[CmdletBinding()]
param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path += ';' + (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin')
    $env:Path += ';' + (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin')
}

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Executable failed (exit $LASTEXITCODE). See the output above." }
}

function New-HexSecret {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

function Test-DockerReady {
    # PowerShell 5.1 treats native stderr as ErrorRecords; a stopped engine
    # is an expected probe result, not a terminating setup error.
    $ErrorActionPreference = 'Continue'
    & docker.exe info --format '{{.OSType}}' 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Test-WslReady {
    $ErrorActionPreference = 'Continue'
    & wsl.exe --status 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

try {
    Refresh-Path
    if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) {
        if ($Stop) { throw 'Docker is not installed; there is no Windows stack to stop.' }
        if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
            Start-Process 'https://apps.microsoft.com/detail/9nblggh4nns1'
            throw 'Install/update Microsoft App Installer from the opened Store page to enable winget, then run start-windows.bat again.'
        }
        Write-Host 'Installing Docker Desktop. Windows may ask for administrator approval.'
        Invoke-Checked winget.exe @('install', '--id', 'Docker.DockerDesktop', '--exact', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements')
        Refresh-Path
        if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) {
            throw 'Docker installation needs a sign-out or restart. Restart Windows and run start-windows.bat again.'
        }
    }

    # CLI presence does not mean the Desktop engine is running.
    if (-not (Test-DockerReady)) {
        if ($Stop) { throw 'Docker Desktop is not running. Start it, then run stop-windows.bat again.' }
        if (-not (Test-WslReady)) {
            Write-Host 'Enabling WSL 2 (Windows administrator prompt). No Linux distribution is needed.'
            $wsl = Start-Process -FilePath 'wsl.exe' -ArgumentList '--install', '--no-distribution' -Verb RunAs -Wait -PassThru
            if ($wsl.ExitCode -ne 0 -and $wsl.ExitCode -ne 3010) {
                throw 'WSL setup failed. Check Windows Update and enable hardware virtualization in BIOS/UEFI, then retry.'
            }
            throw 'WSL setup was requested. Restart Windows, then run start-windows.bat again.'
        }
        $desktop = @(
            (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
            (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
        ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
        if (-not $desktop) { throw 'Open Docker Desktop from the Start menu, then run this file again.' }
        Start-Process -FilePath $desktop
        Write-Host 'Waiting for Docker Desktop. Complete any first-run setup in its window.'
        $deadline = (Get-Date).AddMinutes(4)
        do {
            if (Test-DockerReady) { break }
            Start-Sleep -Seconds 3
        } while ((Get-Date) -lt $deadline)
        if (-not (Test-DockerReady)) { throw 'Docker did not become ready. Check its window for WSL/virtualization/restart instructions and run this file again.' }
    }
    $osType = & docker.exe info --format '{{.OSType}}'
    if ($osType -ne 'linux') { throw 'In Docker Desktop, select Switch to Linux containers, then run this file again.' }
    Invoke-Checked docker.exe @('compose', 'version')

    $envFile = Join-Path $root '.env.windows'
    $compose = @('compose', '--project-name', 'learning-platform-windows', '--env-file', $envFile, '-f', (Join-Path $root 'compose.windows.yaml'))
    if ($Stop) {
        if (-not (Test-Path -LiteralPath $envFile)) { throw 'No Windows configuration exists in this folder.' }
        Invoke-Checked docker.exe ($compose + @('stop'))
        Write-Host 'Stopped. Your database and configuration are preserved.'
        exit 0
    }
    if (-not (Test-Path -LiteralPath $envFile)) {
        $text = "BETTER_AUTH_SECRET=$(New-HexSecret)`r`nMAIL_ENCRYPTION_KEY=$(New-HexSecret)`r`n"
        [IO.File]::WriteAllText($envFile, $text, (New-Object Text.UTF8Encoding($false)))
        Write-Host 'Created private local configuration in .env.windows.'
    }
    # Never replace existing keys: pending mail and sessions depend on them.
    foreach ($key in @('BETTER_AUTH_SECRET', 'MAIL_ENCRYPTION_KEY')) {
        $match = Select-String -LiteralPath $envFile -Pattern "^$key=([a-fA-F0-9]{64})$"
        if (-not $match) { throw "Invalid $key in .env.windows. Restore the original file; existing keys are never reset automatically." }
    }
    Write-Host 'Building and starting PostgreSQL, mail inbox, migrations, web and email worker...'
    Write-Host 'First launch downloads dependencies and can take several minutes.'
    Invoke-Checked docker.exe ($compose + @('up', '--detach', '--build', '--wait', '--wait-timeout', '180'))
    Write-Host 'Ready: http://localhost:3000/en/register'
    Write-Host 'Verification/reset/invitation emails: http://localhost:8025'
    Write-Host 'Use stop-windows.bat to stop; closing this window leaves the application running.'
    Start-Process 'http://localhost:8025'
    Start-Process 'http://localhost:3000/en/register'
    exit 0
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No data is deleted. Fix the issue and run the launcher again.'
    exit 1
}
