# LingoLink AI - One-Command Local Startup
# Run with: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Continue"
$projectRoot = "C:\Users\user\Desktop\lingolink"
$nodeServer = "$projectRoot\node-server"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  🌐 LingoLink AI - Starting Local Stack" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Docker backend + postgres
Write-Host "[1/4] Starting Docker (backend + postgres)..." -ForegroundColor Yellow
Set-Location $projectRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; docker compose up"

Start-Sleep -Seconds 5

# Step 2: Start frontend
Write-Host "[2/4] Starting frontend on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$nodeServer'; npx http-server -p 3001"

Start-Sleep -Seconds 3

# Step 3: Start frontend tunnel
Write-Host "[3/4] Starting frontend Cloudflare tunnel..." -ForegroundColor Yellow
$frontendTunnelLog = "$projectRoot\frontend_tunnel.log"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:3001 *>&1 | Tee-Object -FilePath '$frontendTunnelLog'"

# Step 4: Start backend tunnel
Write-Host "[4/4] Starting backend Cloudflare tunnel..." -ForegroundColor Yellow
$backendTunnelLog = "$projectRoot\backend_tunnel.log"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:8000 *>&1 | Tee-Object -FilePath '$backendTunnelLog'"

Write-Host ""
Write-Host "Waiting 15 seconds for tunnels to establish..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 5: Extract URLs from tunnel logs
Write-Host ""
Write-Host "Extracting tunnel URLs..." -ForegroundColor Yellow

$frontendUrl = $null
$backendUrl = $null

if (Test-Path $frontendTunnelLog) {
    $frontendContent = Get-Content $frontendTunnelLog -Raw
    if ($frontendContent -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
        $frontendUrl = $matches[0]
    }
}

if (Test-Path $backendTunnelLog) {
    $backendContent = Get-Content $backendTunnelLog -Raw
    if ($backendContent -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
        $backendUrl = $matches[0]
    }
}

if (-not $frontendUrl -or -not $backendUrl) {
    Write-Host "⚠️  Could not auto-detect tunnel URLs." -ForegroundColor Red
    Write-Host "   Check the tunnel PowerShell windows manually and update:" -ForegroundColor Red
    Write-Host "   - translator.html" -ForegroundColor Red
    Write-Host "   - admin.html" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "🎉 Tunnels established!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "  Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 6: Update HTML files with new URLs
    Write-Host "Updating HTML files with new URLs..." -ForegroundColor Yellow
    
    $translatorFile = "$nodeServer\translator.html"
    $adminFile = "$nodeServer\admin.html"
    
    # Extract old URLs from current files
    $translatorContent = Get-Content $translatorFile -Raw
    
    # Find current backend URL (was previously set)
    if ($translatorContent -match "(const API_BASE = ')(https://[a-z0-9\-]+\.trycloudflare\.com)(')") {
        $oldBackendUrl = $matches[2]
        $translatorContent = $translatorContent -replace [regex]::Escape($oldBackendUrl), $backendUrl
        Set-Content -Path $translatorFile -Value $translatorContent -Encoding UTF8
        Write-Host "  ✅ Updated translator.html" -ForegroundColor Green
    }
    
    # Update admin.html
    $adminContent = Get-Content $adminFile -Raw
    if ($adminContent -match "(const API_BASE = ')(https://[a-z0-9\-]+\.trycloudflare\.com)(')") {
        $oldAdminBackendUrl = $matches[2]
        $adminContent = $adminContent -replace [regex]::Escape($oldAdminBackendUrl), $backendUrl
    }
    if ($adminContent -match "window\.open\('(https://[a-z0-9\-]+\.trycloudflare\.com)") {
        $oldFrontendUrlInAdmin = $matches[1]
        $adminContent = $adminContent -replace [regex]::Escape($oldFrontendUrlInAdmin), $frontendUrl
    }
    Set-Content -Path $adminFile -Value $adminContent -Encoding UTF8
    Write-Host "  ✅ Updated admin.html" -ForegroundColor Green
    
    # Save URLs for reference
    @"
Frontend: $frontendUrl
Backend:  $backendUrl
Started:  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@ | Out-File -FilePath "$projectRoot\current_urls.txt" -Encoding UTF8
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ✨ LingoLink AI is running!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open the Frontend URL in your browser" -ForegroundColor White
Write-Host "  2. Login and start translating" -ForegroundColor White
Write-Host "  3. To stop: close all PowerShell windows" -ForegroundColor White
Write-Host ""
Write-Host "Admin credentials: admin / lingolink256" -ForegroundColor Magenta
Write-Host ""

# Open frontend in default browser
if ($frontendUrl) {
    Start-Sleep -Seconds 2
    Start-Process $frontendUrl
}