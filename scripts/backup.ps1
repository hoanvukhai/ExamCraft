# Full DB/public/protected-config package. Default dry-run; never deletes older backups.
param([string]$BackupDir = 'backups', [switch]$Execute)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try {
    $taskArgs = @('scripts/backup-package.cjs', '--out', $BackupDir)
    if ($Execute) { $taskArgs += '--execute' }
    & node @taskArgs
    if ($LASTEXITCODE -ne 0) { throw 'Backup package did not complete. No success is claimed.' }
} finally { Pop-Location }