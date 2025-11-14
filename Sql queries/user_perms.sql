-- !grant perms to database user(myuser)
USE [FSDP];

-- Grant minimal permissions for the app to function
GRANT SELECT ON OBJECT::dbo.Users TO [myuser];
GRANT SELECT, UPDATE ON OBJECT::dbo.Accounts TO [myuser];
GRANT INSERT, SELECT ON OBJECT::dbo.Transactions TO [myuser];

-- !check if myuser exists and is mapped correctly
USE [FSDP];

-- Check DB user to server login mapping
SELECT dp.name AS db_user, dp.sid, sp.name AS server_login
FROM sys.database_principals dp
LEFT JOIN sys.server_principals sp ON dp.sid = sp.sid
WHERE dp.type_desc IN ('SQL_USER','WINDOWS_USER','WINDOWS_GROUP')
  AND dp.name = 'myuser';

-- !create/map myuser if missing or orphaned
USE [FSDP];

-- Create user for login (if missing)
CREATE USER [myuser] FOR LOGIN [myuser];

-- Or map an existing orphaned user to the login
ALTER USER [myuser] WITH LOGIN = [myuser];

-- !check for deny perms or deny role membership
USE [FSDP];

-- List explicit permissions on Users table (shows GRANT/DENY)
SELECT dp.name AS principal,
       perm.state_desc,
       perm.permission_name
FROM sys.database_permissions perm
JOIN sys.database_principals dp ON perm.grantee_principal_id = dp.principal_id
WHERE perm.major_id = OBJECT_ID('dbo.Users');

-- Check if user is in db_denydatareader role
SELECT r.name AS role, m.name AS member
FROM sys.database_role_members drm
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON drm.member_principal_id = m.principal_id
WHERE m.name = 'myuser';

-- !remove user from deny role if needed
USE [FSDP];

ALTER ROLE db_denydatareader DROP MEMBER [myuser];

-- !enable sa acc if needed for admin tasks
ALTER LOGIN [sa] WITH PASSWORD = 'Your$trongP@ssw0rd!';
ALTER LOGIN [sa] ENABLE;

-- !schema-level grant (alternative if u want broader perms)
USE [FSDP];

-- Grant all basic operations on entire dbo schema
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [myuser];

-- !powershell cmds to test perms
# Test SELECT permission as myuser
sqlcmd -S "Zaria\SQLEXPRESS" -U myuser -P "FSDP123" -Q "USE FSDP; SELECT TOP 1 * FROM dbo.Users;"

# Run grants as Windows admin
sqlcmd -S "Zaria\SQLEXPRESS" -E -Q "USE FSDP; GRANT SELECT ON OBJECT::dbo.Users TO [myuser];"