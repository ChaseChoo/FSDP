import { poolPromise, mssql } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

// Model for ApprovedRecipients table. Column design:
// Id INT IDENTITY PRIMARY KEY
// ExternalId NVARCHAR(200) NOT NULL -- links to user (token sub/email)
// Label NVARCHAR(200)
// Value NVARCHAR(200) NOT NULL -- normalized value (digits only where applicable)
// CreatedAt DATETIME2, UpdatedAt DATETIME2

export async function getApprovedRecipientsByExternalId(externalId) {
  if (process.env.DEV_ALLOW_ALL === "true") {
    // dev sample
    return [ { Id: 1, ExternalId: externalId, Label: 'Self', Value: '91234567' } ];
  }
  const pool = await poolPromise;
  if (!pool) return [];
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  const q = `SELECT Id, ExternalId, Label, Value, CreatedAt, UpdatedAt FROM ApprovedRecipients WHERE ExternalId = @externalId ORDER BY Id DESC`;
  const res = await req.query(q);
  return res.recordset || [];
}

export async function getApprovedRecipientById(id) {
  const pool = await poolPromise;
  if (!pool) return null;
  const req = pool.request();
  req.input("id", mssql.Int, id);
  const q = `SELECT Id, ExternalId, Label, Value, CreatedAt, UpdatedAt FROM ApprovedRecipients WHERE Id = @id`;
  const res = await req.query(q);
  return res.recordset[0] || null;
}

export async function createApprovedRecipient(externalId, label, value) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB pool not available');
  const now = new Date();
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  req.input("label", mssql.NVarChar(200), label || "");
  req.input("value", mssql.NVarChar(200), value || "");
  req.input("createdAt", mssql.DateTime2, now);
  req.input("updatedAt", mssql.DateTime2, now);
  const q = `
    INSERT INTO ApprovedRecipients (ExternalId, Label, Value, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.Id, INSERTED.ExternalId, INSERTED.Label, INSERTED.Value, INSERTED.CreatedAt, INSERTED.UpdatedAt
    VALUES (@externalId, @label, @value, @createdAt, @updatedAt)
  `;
  const res = await req.query(q);
  return res.recordset[0];
}

export async function updateApprovedRecipient(id, label, value) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB pool not available');
  const now = new Date();
  const req = pool.request();
  req.input("id", mssql.Int, id);
  req.input("label", mssql.NVarChar(200), label || "");
  req.input("value", mssql.NVarChar(200), value || "");
  req.input("updatedAt", mssql.DateTime2, now);
  const q = `
    UPDATE ApprovedRecipients
    SET Label = @label, Value = @value, UpdatedAt = @updatedAt
    OUTPUT INSERTED.Id, INSERTED.ExternalId, INSERTED.Label, INSERTED.Value, INSERTED.CreatedAt, INSERTED.UpdatedAt
    WHERE Id = @id
  `;
  const res = await req.query(q);
  return res.recordset[0] || null;
}

export async function deleteApprovedRecipient(id) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB pool not available');
  const req = pool.request();
  req.input("id", mssql.Int, id);
  const q = `DELETE FROM ApprovedRecipients WHERE Id = @id`;
  const res = await req.query(q);
  return res.rowsAffected && res.rowsAffected[0] > 0;
}
