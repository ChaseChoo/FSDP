-- Schema for ApprovedRecipients table used by approvedRecipientModel.js
-- Columns expected: Id, ExternalId, Label, Value, CreatedAt, UpdatedAt
-- Value is normalized digits-only; enforce with a CHECK constraint.

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

-- Helpful indexes for lookups by ExternalId and Value
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_ApprovedRecipients_ExternalId'
)
BEGIN
  CREATE INDEX IX_ApprovedRecipients_ExternalId ON dbo.ApprovedRecipients(ExternalId);
  PRINT 'Created index IX_ApprovedRecipients_ExternalId';
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_ApprovedRecipients_Value'
)
BEGIN
  CREATE INDEX IX_ApprovedRecipients_Value ON dbo.ApprovedRecipients(Value);
  PRINT 'Created index IX_ApprovedRecipients_Value';
END
GO

-- Example CRUD queries (parameterized)
-- Select all:
-- SELECT id, value, created_at FROM approved_recipients ORDER BY id;

-- Insert:
-- INSERT INTO approved_recipients (value, created_at) VALUES (@value, GETDATE());

-- Delete:
-- DELETE FROM approved_recipients WHERE id = @id;
