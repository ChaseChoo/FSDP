# SQL Server Configuration Check and Fix
# Run this as Administrator

Write-Host "=== SQL Server Configuration Checker ===" -ForegroundColor Cyan
Write-Host ""

# Check services
Write-Host "1. Checking SQL Server services..." -ForegroundColor Yellow
$sqlService = Get-Service -Name 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
$browserService = Get-Service -Name 'SQLBrowser' -ErrorAction SilentlyContinue

if ($sqlService) {
    Write-Host "   SQL Server (SQLEXPRESS): $($sqlService.Status)" -ForegroundColor $(if($sqlService.Status -eq 'Running'){'Green'}else{'Red'})
    if ($sqlService.Status -ne 'Running') {
        Write-Host "   Starting SQL Server..." -ForegroundColor Yellow
        Start-Service -Name 'MSSQL$SQLEXPRESS'
        Write-Host "   SQL Server started" -ForegroundColor Green
    }
} else {
    Write-Host "   ERROR: SQL Server (SQLEXPRESS) not found!" -ForegroundColor Red
    exit
}

if ($browserService) {
    Write-Host "   SQL Browser: $($browserService.Status)" -ForegroundColor $(if($browserService.Status -eq 'Running'){'Green'}else{'Red'})
    if ($browserService.Status -ne 'Running') {
        Write-Host "   Starting SQL Browser..." -ForegroundColor Yellow
        Start-Service -Name 'SQLBrowser' -ErrorAction SilentlyContinue
        Set-Service -Name 'SQLBrowser' -StartupType Automatic
        Write-Host "   SQL Browser started" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "2. Checking TCP/IP configuration..." -ForegroundColor Yellow

# Find SQL Server installation path
$sqlPath = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll' -ErrorAction SilentlyContinue

if ($sqlPath) {
    $tcpPort = $sqlPath.TcpPort
    $dynamicPort = $sqlPath.TcpDynamicPorts
    
    Write-Host "   Current TCP Port: $tcpPort" -ForegroundColor White
    Write-Host "   Dynamic Ports: $dynamicPort" -ForegroundColor White
    
    if ([string]::IsNullOrEmpty($tcpPort)) {
        Write-Host ""
        Write-Host "   TCP/IP is using dynamic ports. Setting static port 1433..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   IMPORTANT: You need to configure TCP/IP manually:" -ForegroundColor Red
        Write-Host "   1. Open 'SQL Server Configuration Manager'" -ForegroundColor Yellow
        Write-Host "   2. Expand 'SQL Server Network Configuration'" -ForegroundColor Yellow
        Write-Host "   3. Click 'Protocols for SQLEXPRESS'" -ForegroundColor Yellow
        Write-Host "   4. Right-click 'TCP/IP' and select 'Enable'" -ForegroundColor Yellow
        Write-Host "   5. Right-click 'TCP/IP' again and select 'Properties'" -ForegroundColor Yellow
        Write-Host "   6. Go to 'IP Addresses' tab" -ForegroundColor Yellow
        Write-Host "   7. Scroll to 'IPAll' section at the bottom" -ForegroundColor Yellow
        Write-Host "   8. Set 'TCP Port' to 1433" -ForegroundColor Yellow
        Write-Host "   9. Clear 'TCP Dynamic Ports' (make it empty)" -ForegroundColor Yellow
        Write-Host "   10. Click OK and restart SQL Server" -ForegroundColor Yellow
    } else {
        Write-Host "   TCP Port is configured: $tcpPort" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3. Testing connection with sqlcmd..." -ForegroundColor Yellow

$testResult = sqlcmd -S localhost\SQLEXPRESS -U myuser -P FSDP123 -Q "SELECT @@VERSION" -b 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SUCCESS: Can connect to SQL Server!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Configuration Summary ===" -ForegroundColor Cyan
    Write-Host "Server: localhost\SQLEXPRESS" -ForegroundColor White
    Write-Host "Database: FSDP" -ForegroundColor White
    Write-Host "User: myuser" -ForegroundColor White
    Write-Host ""
    Write-Host "Your Node.js app should now be able to connect!" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Cannot connect to SQL Server" -ForegroundColor Red
    Write-Host "   $testResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Try opening SQL Server Configuration Manager to enable TCP/IP" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
