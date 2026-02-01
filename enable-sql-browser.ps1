# Run this script as Administrator to enable SQL Server Browser
# Right-click PowerShell and choose "Run as Administrator"
# Then run: .\enable-sql-browser.ps1

Write-Host "Enabling SQL Server Browser Service..." -ForegroundColor Cyan

try {
    # Start the service
    Start-Service -Name 'SQLBrowser' -ErrorAction Stop
    Write-Host "✓ SQL Server Browser started" -ForegroundColor Green
    
    # Set to start automatically
    Set-Service -Name 'SQLBrowser' -StartupType Automatic -ErrorAction Stop
    Write-Host "✓ SQL Server Browser set to start automatically" -ForegroundColor Green
    
    # Verify status
    $service = Get-Service -Name 'SQLBrowser'
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor Yellow
    Write-Host "  Name: $($service.Name)"
    Write-Host "  Status: $($service.Status)"
    Write-Host "  StartType: $($service.StartType)"
    Write-Host ""
    Write-Host "✓ SQL Server Browser is now enabled and running!" -ForegroundColor Green
    Write-Host "You can now restart your Node.js server." -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you are running PowerShell as Administrator!" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
