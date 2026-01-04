-- Schema for UserOtps table (T-SQL compatible)
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
