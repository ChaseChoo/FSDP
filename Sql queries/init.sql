-- ...existing code...
CREATE TABLE IF NOT EXISTS approved_recipients (
  id INT IDENTITY(1,1) PRIMARY KEY,
  label NVARCHAR(200) NULL,
  value NVARCHAR(50) NOT NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_approved_recipients_value ON approved_recipients(value);