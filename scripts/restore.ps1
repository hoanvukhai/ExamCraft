# Restore only to an explicitly named NEW database. Default is validation/dry-run.
param([string]$Package = '', [string]$TargetDatabase = '', [switch]$Execute)
$ErrorActionPreference = 'Stop'
if (-not $Package -or -not $TargetDatabase) { throw 'Supply -Package and -TargetDatabase examcraft_restore_...; automatic latest/overwrite restore is disabled.' }
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try {
    $taskArgs = @('scripts/restore-package.cjs', '--package', $Package, '--target', $TargetDatabase)
    if ($Execute) { $taskArgs += @('--execute', '--confirm', $TargetDatabase) }
    & node @taskArgs
    if ($LASTEXITCODE -ne 0) { throw 'Restore did not complete. Source and partial artifacts retained.' }
} finally { Pop-Location }