// models/userModel.js
import { poolPromise, mssql } from "./db.js";

export async function findUserByExternalId(externalId) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  const res = await req.query("SELECT Id, ExternalId, FullName, Email FROM Users WHERE ExternalId = @externalId");
  return res.recordset[0] || null;
}

export async function createUser(externalId, fullName = null, email = null) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("externalId", mssql.NVarChar(200), externalId);
  req.input("fullName", mssql.NVarChar(200), fullName);
  req.input("email", mssql.NVarChar(200), email);
  const res = await req.query(`INSERT INTO Users (ExternalId, FullName, Email) OUTPUT INSERTED.Id VALUES (@externalId, @fullName, @email)`);
  return res.recordset[0];
}
