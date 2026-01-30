-- ============================================================================
-- CREATE WALLET TABLES FOR PERSISTENT STORAGE
-- ============================================================================
-- This script creates tables to store wallet balances and transactions
-- Run this in SQL Server Management Studio (SSMS) connected to your FSDP database
-- ============================================================================

USE [FSDP];
GO

-- ============================================================================
-- TABLE: WalletBalances
-- Stores the current balance for each digital wallet (Alipay, WeChat, Touch'n Go)
-- ============================================================================
IF OBJECT_ID(N'dbo.WalletBalances', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WalletBalances (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        WalletId NVARCHAR(100) NOT NULL UNIQUE,
        WalletType NVARCHAR(50) NOT NULL, -- 'alipay', 'wechat', 'touchngo', 'grabpay'
        Balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Currency NVARCHAR(10) NOT NULL DEFAULT 'SGD',
        UserId INT NULL, -- Optional: Link to Users table if wallet belongs to a user
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Created table dbo.WalletBalances';
    
    -- Add foreign key constraint only if Users table exists
    IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.WalletBalances
        ADD CONSTRAINT FK_WalletBalances_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE SET NULL;
        PRINT 'Added foreign key constraint to Users table';
    END
    ELSE
    BEGIN
        PRINT 'Users table not found - skipping foreign key constraint (wallet will work independently)';
    END
END
ELSE
BEGIN
    PRINT 'Table dbo.WalletBalances already exists';
END
GO

-- Create index on WalletId for fast lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WalletBalances_WalletId' AND object_id = OBJECT_ID('dbo.WalletBalances'))
BEGIN
    CREATE INDEX IX_WalletBalances_WalletId ON dbo.WalletBalances(WalletId);
    PRINT 'Index created on WalletId';
END
GO

-- Create index on WalletType
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WalletBalances_WalletType' AND object_id = OBJECT_ID('dbo.WalletBalances'))
BEGIN
    CREATE INDEX IX_WalletBalances_WalletType ON dbo.WalletBalances(WalletType);
    PRINT 'Index created on WalletType';
END
GO

-- ============================================================================
-- TABLE: WalletTransactions
-- Stores all transactions for digital wallets (incoming transfers, payments, etc.)
-- ============================================================================
IF OBJECT_ID(N'dbo.WalletTransactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WalletTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        WalletBalanceId INT NOT NULL,
        WalletId NVARCHAR(100) NOT NULL,
        TransactionType NVARCHAR(50) NOT NULL, -- 'received', 'sent', 'refund'
        Amount DECIMAL(18,2) NOT NULL,
        BalanceBefore DECIMAL(18,2) NOT NULL,
        BalanceAfter DECIMAL(18,2) NOT NULL,
        Currency NVARCHAR(10) NOT NULL DEFAULT 'SGD',
        Description NVARCHAR(500) NULL,
        SourceType NVARCHAR(50) NULL, -- 'ATM', 'TRANSFER', 'PAYMENT', 'REFUND'
        SourceReference NVARCHAR(200) NULL, -- Reference to source transaction (e.g., ATM transaction ID)
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Created table dbo.WalletTransactions';
    
    -- Add foreign key constraint to WalletBalances
    ALTER TABLE dbo.WalletTransactions
    ADD CONSTRAINT FK_WalletTransactions_WalletBalances FOREIGN KEY (WalletBalanceId) REFERENCES dbo.WalletBalances(Id) ON DELETE CASCADE;
    PRINT 'Added foreign key constraint to WalletBalances table';
END
ELSE
BEGIN
    PRINT 'Table dbo.WalletTransactions already exists';
END
GO

-- Create index on WalletId for fast transaction lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WalletTransactions_WalletId' AND object_id = OBJECT_ID('dbo.WalletTransactions'))
BEGIN
    CREATE INDEX IX_WalletTransactions_WalletId ON dbo.WalletTransactions(WalletId);
    PRINT 'Index created on WalletTransactions.WalletId';
END
GO

-- Create index on CreatedAt for time-based queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WalletTransactions_CreatedAt' AND object_id = OBJECT_ID('dbo.WalletTransactions'))
BEGIN
    CREATE INDEX IX_WalletTransactions_CreatedAt ON dbo.WalletTransactions(CreatedAt DESC);
    PRINT 'Index created on WalletTransactions.CreatedAt';
END
GO

-- ============================================================================
-- SAMPLE DATA (Optional)
-- Insert some initial wallet balances for testing
-- ============================================================================
-- Check if sample data already exists
IF NOT EXISTS (SELECT 1 FROM WalletBalances WHERE WalletId = 'wallet-12345')
BEGIN
    INSERT INTO WalletBalances (WalletId, WalletType, Balance, Currency)
    VALUES 
        ('wallet-12345', 'alipay', 0.00, 'SGD'),
        ('wechat-12345', 'wechat', 0.00, 'SGD'),
        ('touchngo-12345', 'touchngo', 0.00, 'SGD'),
        ('grabpay-12345', 'grabpay', 0.00, 'SGD');
    PRINT 'Sample wallet balances inserted';
END
ELSE
BEGIN
    PRINT 'Sample wallet balances already exist';
END
GO

-- ============================================================================
-- VERIFICATION
-- Display the created tables and sample data
-- ============================================================================
PRINT '';
PRINT '=== VERIFICATION ===';
PRINT 'Wallet Balances:';
SELECT * FROM WalletBalances;

PRINT '';
PRINT 'Wallet Transactions:';
SELECT * FROM WalletTransactions;
GO

PRINT '';
PRINT '✅ Wallet tables created successfully!';
PRINT 'You can now run your Node.js application to start using persistent wallet storage.';
GO
