$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'windows-cache.ps1')
function Assert-Equal($Actual, $Expected, [string]$Message) {
    if ($Actual -ne $Expected) { throw "$Message (expected $Expected, got $Actual)" }
}
$directory = Join-Path ([IO.Path]::GetTempPath()) ('learning-start-' + [guid]::NewGuid())
try {
    New-Item -ItemType Directory -Path (Join-Path $directory 'apps/web/src') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $directory 'docs') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $directory 'apps/web/node_modules') -Force | Out-Null
    $source = Join-Path $directory 'apps/web/src/page.tsx'
    Set-Content -LiteralPath $source -Value 'original'
    Set-Content -LiteralPath (Join-Path $directory 'pnpm-lock.yaml') -Value 'dependency-v1'
    $hash = Get-WindowsSourceFingerprint $directory
    Set-Content -LiteralPath (Join-Path $directory 'docs/readme.md') -Value 'doc update'
    Set-Content -LiteralPath (Join-Path $directory 'apps/web/node_modules/temp') -Value 'ignored dependency cache'
    Assert-Equal (Get-WindowsSourceFingerprint $directory) $hash 'Docs and dependency cache must not trigger builds'
    Set-Content -LiteralPath $source -Value 'changed'
    $changed = Get-WindowsSourceFingerprint $directory
    if ($changed -eq $hash) { throw 'Source edits must invalidate saved build' }
    Move-Item -LiteralPath $source -Destination (Join-Path $directory 'apps/web/src/renamed.tsx')
    if ((Get-WindowsSourceFingerprint $directory) -eq $changed) { throw 'Source rename must invalidate saved build' }
    $renamed = Get-WindowsSourceFingerprint $directory
    Set-Content -LiteralPath (Join-Path $directory 'pnpm-lock.yaml') -Value 'dependency-v2'
    if ((Get-WindowsSourceFingerprint $directory) -eq $renamed) { throw 'Dependency update must invalidate saved build' }
    $stateFile = Join-Path $directory '.windows-launch-state.json'
    Assert-Equal (Read-WindowsLaunchState $stateFile) $null 'First launch has no state'
    Write-WindowsLaunchState $stateFile $hash 'config' 'image-ids'
    $state = Read-WindowsLaunchState $stateFile
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'config' 'image-ids' $true $false) 'Ready' 'Healthy unchanged stack is immediate'
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'config' 'image-ids' $false $false) 'Start' 'Stopped/unhealthy stack starts without build'
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'changed-config' 'image-ids' $true $false) 'Start' 'Configuration update reapplies without build'
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'config' 'replaced-image' $true $false) 'Start' 'Replaced images must be reapplied'
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'config' '' $true $false) 'Build' 'Deleted images must rebuild'
    Assert-Equal (Get-WindowsLaunchMode $state 'changed-source' 'config' 'image-ids' $true $false) 'Build' 'Changed source builds automatically'
    Assert-Equal (Get-WindowsLaunchMode $state $hash 'config' 'image-ids' $true $true) 'Build' 'Explicit rebuild is supported'
    Set-Content -LiteralPath $stateFile -Value '{broken'
    Assert-Equal (Read-WindowsLaunchState $stateFile) $null 'Corrupt cache recovers without changing secrets/data'
    Assert-Equal (Get-WindowsLaunchMode $null $hash 'config' 'image-ids' $true $false) 'Build' 'First launch builds'
    Write-Host 'Windows startup fingerprint, cache recovery and cold/warm/ready decisions passed.'
} finally {
    Remove-Item -LiteralPath $directory -Recurse -Force
}
