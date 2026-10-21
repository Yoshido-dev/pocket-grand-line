# Rebuild-free restart of the :8787 snapshot server (serves dist/). Usage: powershell -NoProfile -File <LOCAL_HOME>/.t3/tools/serve.ps1
$c = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($c) { Stop-Process -Id $c.OwningProcess -Force -Confirm:$false }
Start-Sleep -Milliseconds 400
Start-Process -FilePath node -ArgumentList "server/server.mjs" -WorkingDirectory "<LOCAL_HOME>\.t3\projects\video-game" -WindowStyle Hidden
Start-Sleep -Seconds 1
$n = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($n) { "serving pid $($n.OwningProcess)" } else { "FAILED to start" }
