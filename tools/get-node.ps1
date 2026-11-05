# Скачивает портативный Node.js (LTS 22) с nodejs.org в папку runtime\node и проверяет контрольную сумму.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = 'Tls12'
Set-Location (Split-Path -Parent $PSScriptRoot)
$base = 'https://nodejs.org/dist/latest-v22.x/'
$sums = (Invoke-WebRequest ($base + 'SHASUMS256.txt') -UseBasicParsing).Content
$line = ($sums -split "`n") | Where-Object { $_ -match 'node-v[\d.]+-win-x64\.zip' } | Select-Object -First 1
$hash, $name = $line.Trim() -split '\s+'
New-Item -ItemType Directory -Force 'runtime' | Out-Null
$zip = 'runtime\node.zip'
Invoke-WebRequest ($base + $name) -OutFile $zip -UseBasicParsing
if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $hash.ToUpper()) { Remove-Item $zip; throw 'Контрольная сумма Node.js не совпала' }
Expand-Archive $zip 'runtime' -Force
Remove-Item $zip
if (Test-Path 'runtime\node') { Remove-Item 'runtime\node' -Recurse -Force }
Move-Item (Join-Path 'runtime' ($name -replace '\.zip$', '')) 'runtime\node'
Write-Host 'Node.js готов.'
