# Add Windows Firewall Rule for Node.js Server
# Run this script as Administrator

Write-Host "Adding firewall rule for port 3000..." -ForegroundColor Yellow

try {
    # Check if rule already exists
    $existingRule = Get-NetFirewallRule -DisplayName "Node.js Server Port 3000" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Cyan
        Remove-NetFirewallRule -DisplayName "Node.js Server Port 3000"
    }
    
    # Add new rule
    New-NetFirewallRule -DisplayName "Node.js Server Port 3000" `
                        -Direction Inbound `
                        -LocalPort 3000 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any
    
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now access the server from your phone at:" -ForegroundColor Cyan
    Write-Host "http://192.168.18.83:3000/assisted-qr-login.html" -ForegroundColor White
    Write-Host ""
    Write-Host "Make sure your phone is on the same WiFi network." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure you're running PowerShell as Administrator!" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue..."
