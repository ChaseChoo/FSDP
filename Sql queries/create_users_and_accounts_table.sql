-- Create Users table if missing
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
END
GO

-- Create Accounts table if missing
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
END
