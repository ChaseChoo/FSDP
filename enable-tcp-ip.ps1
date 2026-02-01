# Enable TCP/IP for SQL Server Express using PowerShell
# Run as Administrator

Write-Host "=== Enabling TCP/IP for SQL Server Express ===" -ForegroundColor Cyan
Write-Host ""

# Load SQL Server WMI provider
try {
    [System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SqlServer.SqlWmiManagement") | Out-Null
    
    # Get the SQL Server instance
    $wmi = New-Object 'Microsoft.SqlServer.Management.Smo.Wmi.ManagedComputer' localhost
    
    # Find the SQLEXPRESS instance
    $instance = $wmi.ServerInstances | Where-Object { $_.Name -eq 'SQLEXPRESS' }
    
    if (!$instance) {
        Write-Host "ERROR: SQLEXPRESS instance not found" -ForegroundColor Red
        throw "Instance not found"
    }
    
    Write-Host "Found SQL Server instance: $($instance.Name)" -ForegroundColor Green
    
    # Get TCP protocol
    $tcp = $instance.ServerProtocols | Where-Object { $_.Name -eq 'Tcp' }
    
    if ($tcp) {
        Write-Host "Current TCP/IP Status: $($tcp.IsEnabled)" -ForegroundColor Yellow
        
        if (!$tcp.IsEnabled) {
            Write-Host "Enabling TCP/IP..." -ForegroundColor Yellow
            $tcp.IsEnabled = $true
            $tcp.Alter()
            Write-Host "TCP/IP enabled!" -ForegroundColor Green
        } else {
            Write-Host "TCP/IP is already enabled" -ForegroundColor Green
        }
        
        # Set static port to 1433
        Write-Host ""
        Write-Host "Configuring TCP Port 1433..." -ForegroundColor Yellow
        
        $ipAll = $tcp.IPAddresses | Where-Object { $_.Name -eq 'IPAll' }
        if ($ipAll) {
            $ipAll.IPAddressProperties['TcpPort'].Value = '1433'
            $ipAll.IPAddressProperties['TcpDynamicPorts'].Value = ''
            $tcp.Alter()
            Write-Host "Port 1433 configured!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Restarting SQL Server..." -ForegroundColor Yellow
        Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
        Write-Host "SQL Server restarted!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "SUCCESS! TCP/IP is now enabled on port 1433" -ForegroundColor Green
        Write-Host "You can now restart your Node.js server" -ForegroundColor Cyan
        
    } else {
        Write-Host "ERROR: TCP protocol not found" -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative method using Registry:" -ForegroundColor Yellow
    Write-Host ""
    
    # Try registry method
    try {
        $regPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp"
        $tcpKey = Get-Item $regPath -ErrorAction Stop
        
        # Enable TCP/IP
        Set-ItemProperty -Path "$($tcpKey.PSPath)" -Name "Enabled" -Value 1
        Write-Host "Enabled TCP/IP via registry" -ForegroundColor Green
        
        # Set port
        $ipAllPath = "$($tcpKey.PSPath)\IPAll"
        Set-ItemProperty -Path $ipAllPath -Name "TcpPort" -Value "1433"
        Set-ItemProperty -Path $ipAllPath -Name "TcpDynamicPorts" -Value ""
        Write-Host "Set port to 1433 via registry" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Restarting SQL Server..." -ForegroundColor Yellow
        Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
        Write-Host "Done! Restart your Node.js server" -ForegroundColor Green
        
    } catch {
        Write-Host "Registry method also failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please try manually:" -ForegroundColor Yellow
        Write-Host "1. Search Windows for 'SQL Server 2019 Configuration Manager' (or 2017, 2016, etc.)" -ForegroundColor White
        Write-Host "2. Or run: services.msc and restart 'SQL Server (SQLEXPRESS)'" -ForegroundColor White
    }
}

Write-Host ""
Read-Host "Press Enter to exit"
