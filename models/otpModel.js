// models/otpModel.js
import { poolPromise, mssql } from './db.js';

export async function createOtp(identifier, otpHash, expiresAt) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input('identifier', mssql.NVarChar(200), identifier);
  req.input('otpHash', mssql.NVarChar(255), otpHash);
  req.input('expiresAt', mssql.DateTimeOffset, expiresAt);
  const res = await req.query(`
    INSERT INTO UserOtps (Identifier, OtpHash, ExpiresAt, CreatedAt)
    OUTPUT INSERTED.Id, INSERTED.Identifier, INSERTED.ExpiresAt
    VALUES (@identifier, @otpHash, @expiresAt, SYSDATETIMEOFFSET())
  `);
  return res.recordset[0];
}

export async function findValidOtp(identifier) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input('identifier', mssql.NVarChar(200), identifier);
  const res = await req.query(`
    SELECT TOP(1) Id, Identifier, OtpHash, ExpiresAt, CreatedAt
    FROM UserOtps
    WHERE Identifier = @identifier
    ORDER BY CreatedAt DESC
  `);
  return res.recordset[0] || null;
}

export async function deleteOtpById(id) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input('id', mssql.Int, id);
  await req.query(`DELETE FROM UserOtps WHERE Id = @id`);
}

export async function deleteOtpsByIdentifier(identifier) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input('identifier', mssql.NVarChar(200), identifier);
  await req.query(`DELETE FROM UserOtps WHERE Identifier = @identifier`);
}
