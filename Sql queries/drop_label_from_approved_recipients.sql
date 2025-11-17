-- Migration: drop Label column from ApprovedRecipients (only run when you're sure no code needs Label)
IF EXISTS(SELECT * FROM sys.columns WHERE Name = N'Label' AND Object_ID = Object_ID(N'dbo.ApprovedRecipients'))
BEGIN
  ALTER TABLE ApprovedRecipients DROP COLUMN Label;
END

-- Optional: cleanup any null/empty labels rows (not necessary if column removed)
-- UPDATE ApprovedRecipients SET Label = NULL WHERE Label = '';
