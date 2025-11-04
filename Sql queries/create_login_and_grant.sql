-- Idempotent script to create SQL login 'myuser' and grant db_owner on database FSDP
-- Run as a server admin (sa) or a Windows account that is sysadmin. You can run with -E if your Windows account has the rights.

-- Create server-level login if it does not exist
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

-- Create database user in FSDP and grant db_owner
IF DB_ID(N'FSDP') IS NULL
BEGIN
    PRINT 'Database FSDP does not exist. Please create the database first.';
    RETURN;
END
GO

USE [FSDP];
GO

-- Create user for login if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'myuser')
BEGIN
    PRINT 'Creating database user [myuser] in [FSDP]...';
    CREATE USER [myuser] FOR LOGIN [myuser];
    PRINT 'Database user [myuser] created.';
END
ELSE
BEGIN
    PRINT 'Database user [myuser] already exists in [FSDP].';
END
GO

-- Add user to db_owner if not already a member
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

-- Final verification
SELECT
    sp.name AS server_principal,
    dp.name AS database_principal,
    CASE WHEN EXISTS(
        SELECT 1 FROM sys.database_role_members drm
        JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
        JOIN sys.database_principals m ON drm.member_principal_id = m.principal_id
        WHERE r.name = N'db_owner' AND m.name = dp.name
    ) THEN N'MEMBER' ELSE N'NOT MEMBER' END AS db_owner_membership
FROM sys.server_principals sp
LEFT JOIN sys.database_principals dp ON dp.name = sp.name
WHERE sp.name = N'myuser';
GO
