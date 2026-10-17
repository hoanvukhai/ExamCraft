# ExamCraft v3.1 PostgreSQL Restore Script (Windows PowerShell)
param(
    [string]$BackupFile = "",
    [string]$BackupDir = "backups",
    [string]$ContainerName = "examcraft_postgres",
    [string]$DbUser = "examcraft",
    [string]$DbName = "examcraft"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ExamCraft PostgreSQL Restore Service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not $BackupFile) {
    if (-not (Test-Path $BackupDir)) {
        Write-Host "[ERROR] Backup directory not found: $BackupDir" -ForegroundColor Red
        exit 1
    }

    $LatestBackup = Get-ChildItem -Path $BackupDir -Filter "examcraft_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if (-not $LatestBackup) {
        Write-Host "[ERROR] No backup files found in $BackupDir" -ForegroundColor Red
        exit 1
    }

    $BackupFile = $LatestBackup.FullName
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERROR] Backup file does not exist: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Restoring from file: $BackupFile" -ForegroundColor Yellow
Write-Host "[*] Loading into '$DbName' on container '$ContainerName'..." -ForegroundColor Yellow

try {
    Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName
    Write-Host "[OK] Database restore completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to restore database: $_" -ForegroundColor Red
    exit 1
}
