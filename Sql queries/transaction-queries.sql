-- Schema for Transactions table used by transactionModel.js and accountModel.js
IF OBJECT_ID(N'dbo.Transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Transactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AccountId INT NOT NULL,
        TransactionType NVARCHAR(50) NULL,
        Type NVARCHAR(50) NULL, -- legacy field used by transactionModel.js
        Amount DECIMAL(18,2) NOT NULL,
        BalanceBefore DECIMAL(18,2) NULL,
        BalanceAfter DECIMAL(18,2) NULL,
        Description NVARCHAR(255) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        Method NVARCHAR(50) NULL,   -- optional for PayNow logging
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

