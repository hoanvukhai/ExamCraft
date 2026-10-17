# ExamCraft v3.1 PostgreSQL Backup Script (Windows PowerShell)
param(
    [string]$BackupDir = "backups",
    [string]$ContainerName = "examcraft_postgres",
    [string]$DbUser = "examcraft",
    [string]$DbName = "examcraft",
    [int]$KeepDays = 7
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " ExamCraft PostgreSQL Backup Service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "[+] Created directory: $BackupDir" -ForegroundColor Green
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $BackupDir "examcraft_backup_$Timestamp.sql"

Write-Host "[*] Exporting PostgreSQL database from container '$ContainerName'..." -ForegroundColor Yellow

try {
    # Run pg_dump with --clean --if-exists for smooth drop-and-restore
    docker exec $ContainerName pg_dump -U $DbUser --clean --if-exists $DbName | Out-File -FilePath $OutputFile -Encoding utf8

    if (Test-Path $OutputFile) {
        $FileSize = (Get-Item $OutputFile).Length
        $FileSizeKb = [math]::Round($FileSize / 1024, 2)
        Write-Host "[OK] Backup completed: $OutputFile ($FileSizeKb KB)" -ForegroundColor Green
    } else {
        throw "Backup file was not created."
    }

    # Delete backups older than $KeepDays
    $CutoffDate = (Get-Date).AddDays(-$KeepDays)
    Get-ChildItem -Path $BackupDir -Filter "examcraft_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "[-] Cleaned old backup: $($_.Name)" -ForegroundColor DarkGray
    }

    Write-Host "[OK] Backup process finished successfully." -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to backup PostgreSQL database: $_" -ForegroundColor Red
    exit 1
}
