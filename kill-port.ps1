# PowerShell script to kill process using port 5000
$port = 5000
Write-Host "Checking for processes using port $port..." -ForegroundColor Yellow

$processes = netstat -ano | findstr ":$port" | findstr "LISTENING"
if ($processes) {
    $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            Write-Host "Killing process $pid using port $port..." -ForegroundColor Red
            taskkill /PID $pid /F 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Process $pid terminated" -ForegroundColor Green
            } else {
                Write-Host "✗ Failed to kill process $pid" -ForegroundColor Red
            }
        }
    }
    Write-Host "`nPort $port should now be free!" -ForegroundColor Green
} else {
    Write-Host "No processes found using port $port" -ForegroundColor Green
}

