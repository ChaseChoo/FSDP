-- Create table for storing user-approved recipients (MSSQL)
-- Adjusted for ATM use: no label column, values must be numeric digits only
CREATE TABLE approved_recipients (
  id INT IDENTITY(1,1) PRIMARY KEY,
  value NVARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT GETDATE()
);

-- Enforce that 'value' contains digits only (no letters/symbols)
ALTER TABLE approved_recipients
ADD CONSTRAINT CHK_approved_recipients_value_digits_only CHECK (value NOT LIKE '%[^0-9]%');

-- Example CRUD queries (parameterized)
-- Select all:
-- SELECT id, value, created_at FROM approved_recipients ORDER BY id;

-- Insert:
-- INSERT INTO approved_recipients (value, created_at) VALUES (@value, GETDATE());

-- Delete:
-- DELETE FROM approved_recipients WHERE id = @id;
