// models/accountModel.js
import { poolPromise, mssql } from "./db.js";

export async function findAccountByUserId(userId) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("userId", mssql.Int, userId);
  const res = await req.query("SELECT Id, UserId, Balance, Currency FROM Accounts WHERE UserId = @userId");
  return res.recordset[0] || null;
}

export async function createAccountForUser(userId, initialBalance = 0.0, currency = "USD") {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("userId", mssql.Int, userId);
  req.input("initialBalance", mssql.Decimal(18,2), initialBalance);
  req.input("currency", mssql.NVarChar(10), currency);
  const res = await req.query("INSERT INTO Accounts (UserId, Balance, Currency) OUTPUT INSERTED.Id, INSERTED.Balance, INSERTED.Currency VALUES (@userId, @initialBalance, @currency)");
  return res.recordset[0];
}