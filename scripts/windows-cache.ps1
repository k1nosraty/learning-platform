# Shared Windows PowerShell 5.1 startup decisions. No Docker/network side effects.
function Get-WindowsSourceFingerprint {
    param([string]$Root)
    $files = New-Object 'System.Collections.Generic.List[string]'
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    foreach ($name in @('apps', 'packages', 'scripts', 'infra')) {
        $path = Join-Path $Root $name
        if (Test-Path -LiteralPath $path) { $pending.Push($path) }
    }
    while ($pending.Count) {
        foreach ($item in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
            if ($item.PSIsContainer) {
                if ($item.Name -notin @('node_modules', '.next', '.git', 'dist', '.content-storage')) { $pending.Push($item.FullName) }
            } elseif ($item.Name -notlike '*.tsbuildinfo') { $files.Add($item.FullName) }
        }
    }
    foreach ($name in @('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', '.dockerignore', 'compose.windows.yaml')) {
        $path = Join-Path $Root $name
        if (Test-Path -LiteralPath $path) { $files.Add($path) }
    }
    $lines = foreach ($path in ($files | Sort-Object)) {
        $relative = $path.Substring($Root.TrimEnd([char[]]@('\', '/')).Length + 1).Replace('\', '/')
        $relative + ':' + (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
    }
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join "`n"))
        return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    } finally { $sha.Dispose() }
}

function Read-WindowsLaunchState {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try { return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json } catch { return $null }
}

function Get-WindowsLaunchMode {
    param($State, [string]$Fingerprint, [string]$Configuration, [string]$Images, [bool]$Healthy, [bool]$Rebuild)
    if ($Rebuild -or -not $State -or $State.version -ne 1 -or $State.source -ne $Fingerprint -or -not $Images) { return 'Build' }
    if ($State.configuration -eq $Configuration -and $State.images -eq $Images -and $Healthy) { return 'Ready' }
    return 'Start'
}

function Write-WindowsLaunchState {
    param([string]$Path, [string]$Fingerprint, [string]$Configuration, [string]$Images)
    $json = @{ version = 1; source = $Fingerprint; configuration = $Configuration; images = $Images } | ConvertTo-Json
    # Publish only after build, migrations and health checks succeed.
    $temporary = $Path + '.tmp'
    [IO.File]::WriteAllText($temporary, $json, (New-Object Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}
