-- Idempotent script to create database FSDP if it doesn't exist
-- Run this with a login that has CREATE DATABASE permission (e.g., sa or another admin role)

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'FSDP')
BEGIN
    PRINT 'Creating database FSDP...';
    CREATE DATABASE [FSDP];
    -- You can add additional database-level options here if needed, for example:
    -- ALTER DATABASE [FSDP] SET RECOVERY SIMPLE;
    -- ALTER DATABASE [FSDP] SET COMPATIBILITY_LEVEL = 150; -- SQL Server 2019
    PRINT 'Database FSDP created.';
END
ELSE
BEGIN
    PRINT 'Database FSDP already exists. No action taken.';
END
GO

-- Quick verification: return the row if created/existing
SELECT name, state_desc FROM sys.databases WHERE name = N'FSDP';
GO
