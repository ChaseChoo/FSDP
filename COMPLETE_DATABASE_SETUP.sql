-- ============================================================================
-- COMPLETE DATABASE SETUP FOR FSDP
-- ============================================================================
-- Database Configuration from .env:
--   Server: 127.0.0.1\SQLEXPRESS
--   Database: FSDP
--   User: myuser
--   Password: FSDP123
--   Port: 1433
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open this file in SQL Server Management Studio (SSMS)
-- 2. Connect to your SQL Server instance (127.0.0.1\SQLEXPRESS)
-- 3. Run this entire script (F5)
-- ============================================================================

USE master;
GO

-- ============================================================================
-- STEP 1: CREATE DATABASE
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'FSDP')
BEGIN
    PRINT 'Creating database FSDP...';
    CREATE DATABASE [FSDP];
    PRINT 'Database FSDP created.';
END
ELSE
BEGIN
    PRINT 'Database FSDP already exists.';
END
GO

-- ============================================================================
-- STEP 2: CREATE LOGIN
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'myuser')
BEGIN
    PRINT 'Creating server login [myuser]...';
    CREATE LOGIN [myuser] WITH PASSWORD = N'FSDP123';
    PRINT 'Login [myuser] created.';
END
ELSE
BEGIN
    PRINT 'Login [myuser] already exists.';
END
GO

-- Switch to FSDP database
USE [FSDP];
GO

-- ============================================================================
-- STEP 3: CREATE DATABASE USER AND GRANT PERMISSIONS
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'myuser')
BEGIN
    PRINT 'Creating database user [myuser]...';
    CREATE USER [myuser] FOR LOGIN [myuser];
    PRINT 'Database user [myuser] created.';
END
ELSE
BEGIN
    PRINT 'Database user [myuser] already exists.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members drm
    JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
    JOIN sys.database_principals m ON drm.member_principal_id = m.principal_id
    WHERE r.name = N'db_owner' AND m.name = N'myuser'
)
BEGIN
    PRINT 'Adding [myuser] to db_owner role...';
    ALTER ROLE [db_owner] ADD MEMBER [myuser];
    PRINT '[myuser] is now a member of db_owner.';
END
ELSE
BEGIN
    PRINT '[myuser] is already a member of db_owner.';
END
GO

-- ============================================================================
-- STEP 4: CREATE USERS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ExternalId NVARCHAR(200) NOT NULL,
        FullName NVARCHAR(200) NULL,
        Email NVARCHAR(200) NULL,
        Password NVARCHAR(255) NULL,
        Phone NVARCHAR(20) NULL,
        IsActive BIT NULL DEFAULT 1,
        CardNumber NVARCHAR(16) NULL,
        PIN NVARCHAR(255) NULL,
        CardIssueDate DATETIME NULL,
        CardExpiryDate DATETIME NULL,
        CardStatus NVARCHAR(20) NULL DEFAULT 'ACTIVE',
        FailedPinAttempts INT NULL DEFAULT 0,
        CardBlocked BIT NULL DEFAULT 0,
        LastPinAttempt DATETIME NULL,
        CreatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Created table dbo.Users';
END
ELSE
BEGIN
    PRINT 'Table dbo.Users already exists';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Phone')
    BEGIN
        ALTER TABLE Users ADD Phone NVARCHAR(20) NULL;
        PRINT 'Added Phone column to Users table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsActive')
    BEGIN
        ALTER TABLE Users ADD IsActive BIT NULL DEFAULT 1;
        PRINT 'Added IsActive column to Users table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE Users ADD CreatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME();
        PRINT 'Added CreatedAt column to Users table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE Users ADD UpdatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME();
        PRINT 'Added UpdatedAt column to Users table';
    END
    
    -- Add card columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'CardNumber')
    BEGIN
        ALTER TABLE Users ADD 
            CardNumber NVARCHAR(16) NULL,
            PIN NVARCHAR(255) NULL,
            CardIssueDate DATETIME NULL,
            CardExpiryDate DATETIME NULL,
            CardStatus NVARCHAR(20) DEFAULT 'ACTIVE',
            FailedPinAttempts INT DEFAULT 0,
            CardBlocked BIT DEFAULT 0,
            LastPinAttempt DATETIME NULL;
        
        PRINT 'Card authentication columns added to Users table';
    END
END
GO

-- Create index on CardNumber for fast lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_CardNumber' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_CardNumber ON Users(CardNumber);
    PRINT 'Index created on CardNumber';
END
GO

-- ============================================================================
-- STEP 5: CREATE ACCOUNTS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.Accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Accounts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Balance DECIMAL(18,2) NULL DEFAULT 0.00,
        Currency NVARCHAR(10) NULL DEFAULT 'SGD',
        AccountType NVARCHAR(20) NULL DEFAULT 'SAVINGS',
        Status NVARCHAR(20) NULL DEFAULT 'ACTIVE',
        AccountNumber NVARCHAR(20) NULL,
        CreatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Accounts_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
    PRINT 'Created table dbo.Accounts';
END
ELSE
BEGIN
    PRINT 'Table dbo.Accounts already exists';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Accounts') AND name = 'AccountType')
    BEGIN
        ALTER TABLE Accounts ADD AccountType NVARCHAR(20) NULL DEFAULT 'SAVINGS';
        PRINT 'Added AccountType column to Accounts table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Accounts') AND name = 'Status')
    BEGIN
        ALTER TABLE Accounts ADD Status NVARCHAR(20) NULL DEFAULT 'ACTIVE';
        PRINT 'Added Status column to Accounts table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Accounts') AND name = 'AccountNumber')
    BEGIN
        ALTER TABLE Accounts ADD AccountNumber NVARCHAR(20) NULL;
        PRINT 'Added AccountNumber column to Accounts table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Accounts') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE Accounts ADD CreatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME();
        PRINT 'Added CreatedAt column to Accounts table';
    END
    
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Accounts') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE Accounts ADD UpdatedAt DATETIME2 NULL DEFAULT SYSUTCDATETIME();
        PRINT 'Added UpdatedAt column to Accounts table';
    END
END
GO

-- ============================================================================
-- STEP 6: CREATE TRANSACTIONS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.Transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Transactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AccountId INT NOT NULL,
        TransactionType NVARCHAR(50) NULL,
        Type NVARCHAR(50) NULL,
        Amount DECIMAL(18,2) NOT NULL,
        BalanceBefore DECIMAL(18,2) NULL,
        BalanceAfter DECIMAL(18,2) NULL,
        Description NVARCHAR(255) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        Method NVARCHAR(50) NULL,
        Recipient NVARCHAR(100) NULL,
        Purpose NVARCHAR(255) NULL,
        RiskLevel NVARCHAR(20) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Transactions_Accounts FOREIGN KEY (AccountId) REFERENCES Accounts(Id) ON DELETE CASCADE
    );
    PRINT 'Created table dbo.Transactions';
END
ELSE
BEGIN
    PRINT 'Table dbo.Transactions already exists';
END
GO

-- ============================================================================
-- STEP 7: CREATE CARDTRANSACTIONS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.CardTransactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CardTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CardNumber NVARCHAR(16) NOT NULL,
        TransactionType NVARCHAR(50) NOT NULL,
        Amount DECIMAL(18,2) NULL,
        Status NVARCHAR(20) NOT NULL,
        ATMLocation NVARCHAR(100) NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        CONSTRAINT FK_CardTransactions_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    PRINT 'CardTransactions table created';
END
ELSE
BEGIN
    PRINT 'CardTransactions table already exists';
END
GO

-- ============================================================================
-- STEP 8: CREATE APPROVEDRECIPIENTS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.ApprovedRecipients', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ApprovedRecipients (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ExternalId NVARCHAR(200) NOT NULL DEFAULT 'PUBLIC',
        Label NVARCHAR(200) NULL,
        Value NVARCHAR(200) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT 'Created table dbo.ApprovedRecipients';
END
ELSE
BEGIN
    PRINT 'Table dbo.ApprovedRecipients already exists';
END
GO

-- Enforce that Value contains digits only
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CHK_ApprovedRecipients_ValueDigitsOnly'
)
BEGIN
    ALTER TABLE dbo.ApprovedRecipients
    ADD CONSTRAINT CHK_ApprovedRecipients_ValueDigitsOnly CHECK (Value NOT LIKE '%[^0-9]%');
    PRINT 'Added CHECK constraint CHK_ApprovedRecipients_ValueDigitsOnly';
END
GO

-- Create indexes for ApprovedRecipients
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ApprovedRecipients_ExternalId' AND object_id = OBJECT_ID('ApprovedRecipients')
)
BEGIN
    CREATE INDEX IX_ApprovedRecipients_ExternalId ON dbo.ApprovedRecipients(ExternalId);
    PRINT 'Created index IX_ApprovedRecipients_ExternalId';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ApprovedRecipients_Value' AND object_id = OBJECT_ID('ApprovedRecipients')
)
BEGIN
    CREATE INDEX IX_ApprovedRecipients_Value ON dbo.ApprovedRecipients(Value);
    PRINT 'Created index IX_ApprovedRecipients_Value';
END
GO

-- ============================================================================
-- STEP 9: CREATE USEROTPS TABLE
-- ============================================================================
IF OBJECT_ID(N'dbo.UserOtps', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserOtps (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Identifier NVARCHAR(200) NOT NULL,
        OtpHash NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIMEOFFSET NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
    PRINT 'Created table dbo.UserOtps';
END
ELSE
BEGIN
    PRINT 'Table dbo.UserOtps already exists';
END
GO

-- ============================================================================
-- STEP 10: INSERT SAMPLE DATA FOR TESTING
-- ============================================================================
PRINT '';
PRINT 'Inserting sample test data...';

-- Insert test users with card authentication
-- PIN for all test users is '1234' (hashed with bcrypt)
DECLARE @HashedPin NVARCHAR(255) = '$2b$12$LQv3c1yMqbOPzoPHVzUNne.2z8HKD7BVKpGoGA/2XQ.nH.1JK8hzO';

IF NOT EXISTS (SELECT 1 FROM Users WHERE ExternalId = 'user-6')
BEGIN
    INSERT INTO Users (ExternalId, FullName, Email, Phone, CardNumber, PIN, CardIssueDate, CardExpiryDate, CardStatus, IsActive)
    VALUES ('user-6', 'Lee Jia Jun', 'lee@example.com', '91234567', '5555444433332222', @HashedPin, DATEADD(YEAR, -1, GETUTCDATE()), DATEADD(YEAR, 4, GETUTCDATE()), 'ACTIVE', 1);
    PRINT 'Inserted user: Lee Jia Jun (Card: 5555444433332222)';
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE ExternalId = 'user-9')
BEGIN
    INSERT INTO Users (ExternalId, FullName, Email, Phone, CardNumber, PIN, CardIssueDate, CardExpiryDate, CardStatus, IsActive)
    VALUES ('user-9', 'Chase Choo', 'chase@example.com', '80504999', '4444333322221111', @HashedPin, DATEADD(YEAR, -1, GETUTCDATE()), DATEADD(YEAR, 4, GETUTCDATE()), 'ACTIVE', 1);
    PRINT 'Inserted user: Chase Choo (Card: 4444333322221111)';
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE ExternalId = 'user-7')
BEGIN
    INSERT INTO Users (ExternalId, FullName, Email, Phone, CardNumber, PIN, CardIssueDate, CardExpiryDate, CardStatus, IsActive)
    VALUES ('user-7', 'Fang Yu Xuan', 'fang@example.com', '98765432', '3333222211110000', @HashedPin, DATEADD(YEAR, -1, GETUTCDATE()), DATEADD(YEAR, 4, GETUTCDATE()), 'ACTIVE', 1);
    PRINT 'Inserted user: Fang Yu Xuan (Card: 3333222211110000)';
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE ExternalId = 'user-8')
BEGIN
    INSERT INTO Users (ExternalId, FullName, Email, Phone, CardNumber, PIN, CardIssueDate, CardExpiryDate, CardStatus, IsActive)
    VALUES ('user-8', 'David Chong', 'david@example.com', '87654321', '2222111100009999', @HashedPin, DATEADD(YEAR, -1, GETUTCDATE()), DATEADD(YEAR, 4, GETUTCDATE()), 'ACTIVE', 1);
    PRINT 'Inserted user: David Chong (Card: 2222111100009999)';
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE ExternalId = 'user-10')
BEGIN
    INSERT INTO Users (ExternalId, FullName, Email, Phone, CardNumber, PIN, CardIssueDate, CardExpiryDate, CardStatus, IsActive)
    VALUES ('user-10', 'Luo Tian Rui', 'luo@example.com', '76543210', '1111000099998888', @HashedPin, DATEADD(YEAR, -1, GETUTCDATE()), DATEADD(YEAR, 4, GETUTCDATE()), 'ACTIVE', 1);
    PRINT 'Inserted user: Luo Tian Rui (Card: 1111000099998888)';
END
GO

-- Create accounts for test users
DECLARE @UserId INT;

-- Account for user-6
SELECT @UserId = Id FROM Users WHERE ExternalId = 'user-6';
IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = @UserId)
BEGIN
    INSERT INTO Accounts (UserId, Balance, Currency, AccountType, Status, AccountNumber)
    VALUES (@UserId, 976.00, 'SGD', 'SAVINGS', 'ACTIVE', 'ACC-' + CAST(@UserId AS NVARCHAR(10)));
    PRINT 'Created account for user-6 with balance 976.00';
END

-- Account for user-9
SELECT @UserId = Id FROM Users WHERE ExternalId = 'user-9';
IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = @UserId)
BEGIN
    INSERT INTO Accounts (UserId, Balance, Currency, AccountType, Status, AccountNumber)
    VALUES (@UserId, 4131.00, 'SGD', 'SAVINGS', 'ACTIVE', 'ACC-' + CAST(@UserId AS NVARCHAR(10)));
    PRINT 'Created account for user-9 with balance 4131.00';
END

-- Account for user-7
SELECT @UserId = Id FROM Users WHERE ExternalId = 'user-7';
IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = @UserId)
BEGIN
    INSERT INTO Accounts (UserId, Balance, Currency, AccountType, Status, AccountNumber)
    VALUES (@UserId, 1500.00, 'SGD', 'SAVINGS', 'ACTIVE', 'ACC-' + CAST(@UserId AS NVARCHAR(10)));
    PRINT 'Created account for user-7 with balance 1500.00';
END

-- Account for user-8
SELECT @UserId = Id FROM Users WHERE ExternalId = 'user-8';
IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = @UserId)
BEGIN
    INSERT INTO Accounts (UserId, Balance, Currency, AccountType, Status, AccountNumber)
    VALUES (@UserId, 2000.00, 'SGD', 'SAVINGS', 'ACTIVE', 'ACC-' + CAST(@UserId AS NVARCHAR(10)));
    PRINT 'Created account for user-8 with balance 2000.00';
END

-- Account for user-10
SELECT @UserId = Id FROM Users WHERE ExternalId = 'user-10';
IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = @UserId)
BEGIN
    INSERT INTO Accounts (UserId, Balance, Currency, AccountType, Status, AccountNumber)
    VALUES (@UserId, 3000.00, 'SGD', 'SAVINGS', 'ACTIVE', 'ACC-' + CAST(@UserId AS NVARCHAR(10)));
    PRINT 'Created account for user-10 with balance 3000.00';
END
GO

-- ============================================================================
-- VERIFICATION: Display all created objects and sample data
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'DATABASE SETUP COMPLETE!';
PRINT '============================================================================';
PRINT '';
PRINT 'Database: FSDP';
PRINT 'Login: myuser / FSDP123';
PRINT '';
PRINT 'Test Cards (All with PIN: 1234):';
PRINT '  - 5555444433332222 (Lee Jia Jun)';
PRINT '  - 4444333322221111 (Chase Choo)';
PRINT '  - 3333222211110000 (Fang Yu Xuan)';
PRINT '  - 2222111100009999 (David Chong)';
PRINT '  - 1111000099998888 (Luo Tian Rui)';
PRINT '';
PRINT '============================================================================';
PRINT '';

-- Display created tables
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Display sample user data
SELECT 
    Id,
    ExternalId,
    FullName,
    CardNumber,
    CardStatus,
    FORMAT(CardExpiryDate, 'yyyy-MM-dd') AS ExpiryDate,
    IsActive
FROM Users
ORDER BY Id;

-- Display sample account data
SELECT 
    a.Id,
    u.ExternalId,
    u.FullName,
    a.Balance,
    a.Currency,
    a.AccountType,
    a.Status
FROM Accounts a
JOIN Users u ON a.UserId = u.Id
ORDER BY a.Id;

PRINT '';
PRINT 'Setup verification complete. You can now connect your Node.js application.';
GO
