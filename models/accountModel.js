import { poolPromise, mssql } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

export async function findAccountByUserId(userId) {
  // DEV shortcut: return a fake account for the injected dev user
  if (process.env.DEV_ALLOW_ALL === "true") {
    console.log("accountModel: DEV_ALLOW_ALL active, returning fake account for userId", userId);
    return {
      Id: 1,
      UserId: userId,
      Balance: 0.00, // start at 0
      Currency: "USD"
    };
  }

  const pool = await poolPromise;
  const req = pool.request();
  req.input("userId", mssql.Int, userId);
  const q = `SELECT Id, UserId, Balance, Currency FROM Accounts WHERE UserId = @userId`;
  const res = await req.query(q);
  return res.recordset[0] || null;
}

export async function createAccountForUser(userId, initialBalance = 0.0, currency = "USD") {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("userId", mssql.Int, userId);
  req.input("balance", mssql.Decimal(18,2), initialBalance);
  req.input("currency", mssql.NVarChar(10), currency);
  const q = `
    INSERT INTO Accounts (UserId, Balance, Currency)
    OUTPUT INSERTED.Id, INSERTED.UserId, INSERTED.Balance, INSERTED.Currency
    VALUES (@userId, @balance, @currency)
  `;
  const res = await req.query(q);
  return res.recordset[0];
}