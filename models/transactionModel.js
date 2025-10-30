// models/transactionModel.js
import { poolPromise, mssql } from "./db.js";

export async function insertTransaction(transaction, trx) {
  // transaction: { accountId, type, amount, balanceAfter, description }
  const request = (trx || await poolPromise).request();
  request.input("accountId", mssql.Int, transaction.accountId);
  request.input("type", mssql.NVarChar(20), transaction.type);
  request.input("amount", mssql.Decimal(18,2), transaction.amount);
  request.input("balanceAfter", mssql.Decimal(18,2), transaction.balanceAfter);
  request.input("description", mssql.NVarChar(500), transaction.description);
  const q = `INSERT INTO Transactions (AccountId, Type, Amount, BalanceAfter, Description) 
             OUTPUT INSERTED.Id, INSERTED.CreatedAt 
             VALUES (@accountId, @type, @amount, @balanceAfter, @description)`;
  const res = await request.query(q);
  return res.recordset[0];
}

export async function getTransactionsForAccount(accountId, limit = 50, offset = 0) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("accountId", mssql.Int, accountId);
  req.input("limit", mssql.Int, limit);
  req.input("offset", mssql.Int, offset);
  const q = `SELECT Id, AccountId, Type, Amount, BalanceAfter, Description, CreatedAt
             FROM Transactions WHERE AccountId = @accountId
             ORDER BY CreatedAt DESC
             OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
  const res = await req.query(q);
  return res.recordset;
}
