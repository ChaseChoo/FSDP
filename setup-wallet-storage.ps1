# Setup Wallet Persistent Storage
# Run this script to create the wallet database tables

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Wallet Persistent Storage Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if SQL Server is accessible
Write-Host "Checking SQL Server connection..." -ForegroundColor Yellow

$serverInstance = "127.0.0.1\SQLEXPRESS"
$database = "FSDP"
$username = "myuser"
$password = "FSDP123"
$sqlFile = "Sql queries\CREATE_WALLET_TABLES.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the FSDP directory" -ForegroundColor Red
    exit 1
}

Write-Host "Found SQL script: $sqlFile" -ForegroundColor Green
Write-Host ""

# Run the SQL script
Write-Host "Creating wallet tables..." -ForegroundColor Yellow
Write-Host "Server: $serverInstance" -ForegroundColor Gray
Write-Host "Database: $database" -ForegroundColor Gray
Write-Host ""

try {
    # Use sqlcmd to execute the script
    $output = sqlcmd -S $serverInstance -U $username -P $password -d $database -i $sqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "======================================" -ForegroundColor Green
        Write-Host "  SUCCESS!" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Wallet tables created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Cyan
        Write-Host $output
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Start your server: node server.js" -ForegroundColor White
        Write-Host "2. Open http://localhost:3000/wallet-mobile" -ForegroundColor White
        Write-Host "3. Transfer money to any wallet (Alipay, WeChat, Touch'n Go)" -ForegroundColor White
        Write-Host "4. Your transactions are now saved permanently!" -ForegroundColor White
        Write-Host ""
        Write-Host "To verify in database:" -ForegroundColor Yellow
        Write-Host "  SELECT * FROM WalletBalances;" -ForegroundColor Gray
        Write-Host "  SELECT * FROM WalletTransactions;" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "ERROR: Failed to create tables" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Make sure SQL Server is running" -ForegroundColor White
        Write-Host "2. Verify credentials in .env file" -ForegroundColor White
        Write-Host "3. Check if FSDP database exists" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. SQL Server is installed and running" -ForegroundColor White
    Write-Host "2. sqlcmd is available (comes with SQL Server)" -ForegroundColor White
    Write-Host "3. Database credentials are correct" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
