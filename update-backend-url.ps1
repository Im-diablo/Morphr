# PowerShell script to update backend URL
# Usage: .\update-backend-url.ps1 "https://your-actual-backend.onrender.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

$envFile = "frontend\.env"
$envProdFile = "frontend\.env.production"

# Remove trailing slash if present
$BackendUrl = $BackendUrl.TrimEnd('/')

# Update .env
(Get-Content $envFile) -replace 'VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$BackendUrl" | Set-Content $envFile

# Update .env.production
(Get-Content $envProdFile) -replace 'VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$BackendUrl" | Set-Content $envProdFile

Write-Host "✅ Updated backend URL to: $BackendUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Files updated:" -ForegroundColor Cyan
Write-Host "  - $envFile"
Write-Host "  - $envProdFile"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. git add ."
Write-Host "  2. git commit -m 'Update backend URL'"
Write-Host "  3. git push origin main"
