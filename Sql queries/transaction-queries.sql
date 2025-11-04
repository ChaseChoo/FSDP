CREATE TABLE Transactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    Method NVARCHAR(50),
    Recipient NVARCHAR(100),
    Amount DECIMAL(10,2),
    Purpose NVARCHAR(255),
    RiskLevel NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

