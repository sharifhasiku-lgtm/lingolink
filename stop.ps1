# LingoLink AI - Stop Everything
# Run with: powershell -ExecutionPolicy Bypass -File stop.ps1

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  🛑 Stopping LingoLink AI" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Docker
Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
Set-Location "C:\Users\user\Desktop\lingolink"
docker compose down

Write-Host ""
Write-Host "Killing cloudflared processes..." -ForegroundColor Yellow
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Killing http-server (Node) processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
Write-Host "✅ Everything stopped." -ForegroundColor Green
Write-Host ""