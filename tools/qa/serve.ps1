# Rebuild-free restart of the :8787 snapshot server (serves dist/).
# Run from the repository root: powershell -NoProfile -File tools/qa/serve.ps1
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$c = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($c) { Stop-Process -Id $c.OwningProcess -Force -Confirm:$false }
Start-Sleep -Milliseconds 400
Start-Process -FilePath node -ArgumentList "server/server.mjs" -WorkingDirectory $projectRoot -WindowStyle Hidden
Start-Sleep -Seconds 1
$n = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($n) { "serving pid $($n.OwningProcess)" } else { "FAILED to start" }
