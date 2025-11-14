-- Card-based ATM Authentication Schema
-- Run this to add card authentication to existing database

-- Add card authentication columns to Users table
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
ELSE
BEGIN
    PRINT 'Card authentication columns already exist';
END
GO

-- Create index on CardNumber for fast lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_CardNumber')
BEGIN
    CREATE INDEX IX_Users_CardNumber ON Users(CardNumber);
    PRINT 'Index created on CardNumber';
END
GO

-- Create CardTransactions table for ATM-specific transaction logging
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CardTransactions')
BEGIN
    CREATE TABLE CardTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CardNumber NVARCHAR(16) NOT NULL,
        TransactionType NVARCHAR(50) NOT NULL, -- LOGIN, BALANCE_INQUIRY, WITHDRAWAL, DEPOSIT, TRANSFER
        Amount DECIMAL(18,2) NULL,
        Status NVARCHAR(20) NOT NULL, -- SUCCESS, FAILED, BLOCKED
        ATMLocation NVARCHAR(100) NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
    
    PRINT 'CardTransactions table created';
END
ELSE
BEGIN
    PRINT 'CardTransactions table already exists';
END
GO

-- Sample card data for testing (remove in production)
-- Update existing users with sample card numbers
UPDATE Users 
SET 
    CardNumber = CASE Id 
        WHEN 1 THEN '1234567812345678'
        WHEN 2 THEN '9876543298765432'
        ELSE '1111222233334444'
    END,
    PIN = '$2b$12$LQv3c1yMqbOPzoPHVzUNne.2z8HKD7BVKpGoGA/2XQ.nH.1JK8hzO', -- PIN: 1234 (hashed)
    CardIssueDate = DATEADD(YEAR, -2, GETUTCDATE()),
    CardExpiryDate = DATEADD(YEAR, 3, GETUTCDATE()),
    CardStatus = 'ACTIVE',
    FailedPinAttempts = 0,
    CardBlocked = 0
WHERE CardNumber IS NULL;

PRINT 'Sample card data inserted for testing';
PRINT 'Test card: 1234567812345678, PIN: 1234';
GO

-- Verify the updates
SELECT 
    Id,
    FullName,
    CardNumber,
    CardStatus,
    CardExpiryDate,
    FailedPinAttempts,
    CardBlocked
FROM Users
WHERE CardNumber IS NOT NULL;
GO