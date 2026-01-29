import { poolPromise, mssql } from "./db.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

// Dev mode in-memory storage
const DEV_APPROVED_FILE = path.resolve("dev-approved-recipients.json");
const devApprovedRecipients = new Map();

// Load from file on startup
if (process.env.DEV_ALLOW_ALL === "true") {
  if (fs.existsSync(DEV_APPROVED_FILE)) {
    const data = JSON.parse(fs.readFileSync(DEV_APPROVED_FILE, "utf-8"));
    Object.entries(data).forEach(([k, v]) => devApprovedRecipients.set(k, v));
    console.log("Loaded dev approved recipients from file");
  }
}

function saveDevApprovedRecipients() {
  if (process.env.DEV_ALLOW_ALL === "true") {
    const data = Object.fromEntries(devApprovedRecipients);
    fs.writeFileSync(DEV_APPROVED_FILE, JSON.stringify(data, null, 2));
  }
}

// Model for ApprovedRecipients table. Column design:
// Id INT IDENTITY PRIMARY KEY
// ExternalId NVARCHAR(200) NOT NULL -- links to user (token sub/email)
// Label NVARCHAR(200)
// Value NVARCHAR(200) NOT NULL -- normalized value (digits only where applicable)
// CreatedAt DATETIME2, UpdatedAt DATETIME2

export async function getApprovedRecipientsByExternalId(externalId) {
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Return dev stored recipients for this user
    if (!devApprovedRecipients.has(externalId)) {
      return [];
    }
    return devApprovedRecipients.get(externalId);
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
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Search through all dev recipients
    for (const [externalId, recipients] of devApprovedRecipients.entries()) {
      const found = recipients.find(r => r.Id === id);
      if (found) return found;
    }
    return null;
  }
  const pool = await poolPromise;
  if (!pool) return null;
  const req = pool.request();
  req.input("id", mssql.Int, id);
  const q = `SELECT Id, ExternalId, Label, Value, CreatedAt, UpdatedAt FROM ApprovedRecipients WHERE Id = @id`;
  const res = await req.query(q);
  return res.recordset[0] || null;
}

export async function createApprovedRecipient(externalId, label, value) {
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Dev mode storage
    if (!devApprovedRecipients.has(externalId)) {
      devApprovedRecipients.set(externalId, []);
    }
    const recipients = devApprovedRecipients.get(externalId);
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const newRecipient = {
      Id: newId,
      ExternalId: externalId,
      Label: label || "",
      Value: value || "",
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };
    recipients.push(newRecipient);
    devApprovedRecipients.set(externalId, recipients);
    saveDevApprovedRecipients();
    return newRecipient;
  }
  
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
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Find and update in dev storage
    for (const [externalId, recipients] of devApprovedRecipients.entries()) {
      const index = recipients.findIndex(r => r.Id === id);
      if (index !== -1) {
        recipients[index].Label = label || "";
        recipients[index].Value = value || "";
        recipients[index].UpdatedAt = new Date().toISOString();
        devApprovedRecipients.set(externalId, recipients);
        saveDevApprovedRecipients();
        return recipients[index];
      }
    }
    return null;
  }
  
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
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Find and delete from dev storage
    for (const [externalId, recipients] of devApprovedRecipients.entries()) {
      const index = recipients.findIndex(r => r.Id === id);
      if (index !== -1) {
        recipients.splice(index, 1);
        devApprovedRecipients.set(externalId, recipients);
        saveDevApprovedRecipients();
        return true;
      }
    }
    return false;
  }
  
  const pool = await poolPromise;
  if (!pool) throw new Error('DB pool not available');
  const req = pool.request();
  req.input("id", mssql.Int, id);
  const q = `DELETE FROM ApprovedRecipients WHERE Id = @id`;
  const res = await req.query(q);
  return res.rowsAffected && res.rowsAffected[0] > 0;
}
