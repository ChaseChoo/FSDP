// controllers/accountController.js
import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";
import { findAccountByUserId } from "../models/accountModel.js";
import { findUserByExternalId } from "../models/userModel.js";

/**
 * POST /account/deposit
 * Body: { amount: number, description?: string }
 */
export async function deposit(req, res) {
  const amount = Number(req.body.amount);
  const description = req.body.description || null;
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be positive number" });

  const externalId = req.user.externalId;

  try {
    const user = await findUserByExternalId(externalId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pool = await poolPromise;
    const trx = new mssql.Transaction(pool);
    await trx.begin();
    try {
      // get account
      const accReq = trx.request();
      accReq.input("userId", mssql.Int, user.Id);
      const accRes = await accReq.query("SELECT Id, Balance FROM Accounts WHERE UserId = @userId");
      if (accRes.recordset.length === 0) throw new Error("Account not found");
      const account = accRes.recordset[0];
      const newBalance = parseFloat(account.Balance) + parseFloat(amount);

      // update account
      const updReq = trx.request();
      updReq.input("accountId", mssql.Int, account.Id);
      updReq.input("newBalance", mssql.Decimal(18,2), newBalance);
      await updReq.query("UPDATE Accounts SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME() WHERE Id = @accountId");

      // insert transaction
      const inserted = await insertTransaction({
        accountId: account.Id,
        type: "DEPOSIT",
        amount,
        balanceAfter: newBalance,
        description
      }, trx);

      await trx.commit();
      return res.json({ message: "Deposit successful", newBalance, transaction: inserted });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error during deposit" });
  }
}

/**
 * POST /account/withdraw
 * Body: { amount: number, description?: string }
 */
export async function withdraw(req, res) {
  const amount = Number(req.body.amount);
  const description = req.body.description || null;
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be positive number" });

  const externalId = req.user.externalId;

  try {
    const user = await findUserByExternalId(externalId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pool = await poolPromise;
    const trx = new mssql.Transaction(pool);
    await trx.begin();
    try {
      // get account row for update
      // SELECT ... WITH (UPDLOCK, ROWLOCK) could be used if needed; mssql handles transactions
      const accReq = trx.request();
      accReq.input("userId", mssql.Int, user.Id);
      const accRes = await accReq.query("SELECT Id, Balance FROM Accounts WHERE UserId = @userId");
      if (accRes.recordset.length === 0) throw new Error("Account not found");
      const account = accRes.recordset[0];
      const currentBalance = parseFloat(account.Balance);
      if (currentBalance < amount) {
        await trx.rollback();
        return res.status(400).json({ error: "Insufficient funds" });
      }
      const newBalance = currentBalance - parseFloat(amount);

      // update account
      const updReq = trx.request();
      updReq.input("accountId", mssql.Int, account.Id);
      updReq.input("newBalance", mssql.Decimal(18,2), newBalance);
      await updReq.query("UPDATE Accounts SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME() WHERE Id = @accountId");

      // insert transaction
      const inserted = await insertTransaction({
        accountId: account.Id,
        type: "WITHDRAW",
        amount,
        balanceAfter: newBalance,
        description
      }, trx);

      await trx.commit();
      return res.json({ message: "Withdrawal successful", newBalance, transaction: inserted });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error during withdrawal" });
  }
}
