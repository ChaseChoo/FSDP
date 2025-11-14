import { poolPromise, mssql } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

export async function findUserByExternalId(externalId) {
  // DEV shortcut: return a fake user record so controllers can work without DB access
  if (process.env.DEV_ALLOW_ALL === "true") {
    console.log("userModel: DEV_ALLOW_ALL active, returning fake user for", externalId);
    return {
      Id: 1,
      ExternalId: externalId,
      FullName: "Dev User",
      Email: "dev@example.com"
    };
  }

  const pool = await poolPromise;
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  const q = `SELECT Id, ExternalId, FullName, Email FROM Users WHERE ExternalId = @externalId`;
  const res = await req.query(q);
  return res.recordset[0] || null;
}

export async function createUser(externalId, fullName, email) {
  // DEV shortcut: return a fake created user
  if (process.env.DEV_ALLOW_ALL === "true") {
    console.log("userModel: DEV_ALLOW_ALL active, fake-creating user for", externalId);
    return {
      Id: 1,
      ExternalId: externalId,
      FullName: fullName || "Dev User",
      Email: email || "dev@example.com"
    };
  }

  const pool = await poolPromise;
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  req.input("fullName", mssql.NVarChar(200), fullName || null);
  req.input("email", mssql.NVarChar(200), email || null);
  const q = `
    INSERT INTO Users (ExternalId, FullName, Email)
    OUTPUT INSERTED.Id, INSERTED.ExternalId, INSERTED.FullName, INSERTED.Email
    VALUES (@externalId, @fullName, @email)
  `;
  const res = await req.query(q);
  return res.recordset[0];
}