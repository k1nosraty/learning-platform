# Windows PowerShell 5.1 compatible; no global execution-policy changes.
[CmdletBinding()]
param([switch]$Stop, [switch]$Rebuild, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root
. (Join-Path $PSScriptRoot 'windows-cache.ps1')

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

function Get-StackImages {
    # IDs also detect removed/replaced images after a Docker cleanup.
    $names = & docker.exe @compose config --images
    if ($LASTEXITCODE -ne 0) { throw 'Unable to resolve Windows stack images.' }
    $ErrorActionPreference = 'Continue'
    $ids = foreach ($name in ($names | Sort-Object -Unique)) {
        $id = & docker.exe image inspect --format '{{.Id}}' $name 2>$null
        if ($LASTEXITCODE -ne 0) { return '' }
        "$name=$id"
    }
    return ($ids -join "`n")
}

function Test-StackHealthy {
    $ErrorActionPreference = 'Continue'
    $ids = @(& docker.exe @compose ps --all --quiet postgres mailpit web worker)
    if ($LASTEXITCODE -ne 0 -or $ids.Count -ne 4) { return $false }
    $json = & docker.exe inspect @ids 2>$null
    if ($LASTEXITCODE -ne 0) { return $false }
    try {
        $containers = ($json -join "`n") | ConvertFrom-Json
        foreach ($container in $containers) {
            if (-not $container.State.Running) { return $false }
            if ($container.State.Health -and $container.State.Health.Status -ne 'healthy') { return $false }
        }
        return $true
    } catch { return $false }
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
    $stateFile = Join-Path $root '.windows-launch-state.json'
    $fingerprint = Get-WindowsSourceFingerprint -Root $root
    $configuration = (Get-FileHash -LiteralPath $envFile -Algorithm SHA256).Hash
    $images = Get-StackImages
    $mode = Get-WindowsLaunchMode -State (Read-WindowsLaunchState $stateFile) -Fingerprint $fingerprint -Configuration $configuration -Images $images -Healthy (Test-StackHealthy) -Rebuild $Rebuild.IsPresent
    if ($mode -eq 'Build') {
        Write-Host 'First launch, source update or missing images: building the application.'
        Write-Host 'Dependency downloads are cached separately from source changes.'
        Invoke-Checked docker.exe ($compose + @('pull', '--policy', 'missing', 'postgres', 'mailpit'))
        Invoke-Checked docker.exe ($compose + @('build'))
        Invoke-Checked docker.exe ($compose + @('up', '--detach', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '180'))
    } elseif ($mode -eq 'Start') {
        Write-Host 'Starting the saved application. No build or image download.'
        Invoke-Checked docker.exe ($compose + @('up', '--detach', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '180'))
    } else {
        Write-Host 'Application is already running and healthy. Opening it directly.'
    }
    Write-WindowsLaunchState -Path $stateFile -Fingerprint $fingerprint -Configuration $configuration -Images (Get-StackImages)
    Write-Host 'Ready: http://localhost:3000/en/workspaces'
    Write-Host 'Verification/reset/invitation emails: http://localhost:8025'
    Write-Host 'Use stop-windows.bat to stop; closing this window leaves the application running.'
    if (-not $NoBrowser) { Start-Process 'http://localhost:3000/en/workspaces' }
    exit 0
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No data is deleted. Fix the issue and run the launcher again.'
    exit 1
}
