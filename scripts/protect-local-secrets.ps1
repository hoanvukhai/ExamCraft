param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
$workspaceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$backupTarget = [IO.Path]::GetFullPath((Join-Path $workspaceRoot $Destination))
if (-not $backupTarget.StartsWith((Join-Path $workspaceRoot 'backups') + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Protected backup must be inside workspace backups.' }
Add-Type -AssemblyName System.Security
[IO.Directory]::CreateDirectory($backupTarget) | Out-Null
$protectedFiles = @()
foreach ($fileName in @('.env', '.env.test')) {
  $sourcePath = Join-Path $workspaceRoot $fileName
  if (-not [IO.File]::Exists($sourcePath)) { continue }
  $outputPath = Join-Path $backupTarget ($fileName + '.dpapi')
  if ([IO.File]::Exists($outputPath)) { throw 'A protected backup already exists; refusing overwrite.' }
  $plainBytes = [IO.File]::ReadAllBytes($sourcePath)
  try {
    $encryptedBytes = [Security.Cryptography.ProtectedData]::Protect($plainBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    [IO.File]::WriteAllBytes($outputPath, $encryptedBytes)
    $checkBytes = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($outputPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    if ([Convert]::ToBase64String($plainBytes) -ne [Convert]::ToBase64String($checkBytes)) { throw 'Protected backup verification failed.' }
    [Array]::Clear($checkBytes, 0, $checkBytes.Length)
    $protectedFiles += $fileName
  } finally { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
}
@{ files = $protectedFiles; verification = 'decrypt-compare passed'; protection = 'Windows DPAPI CurrentUser; recovery requires the same Windows user profile'; destination = $backupTarget } | ConvertTo-Json
