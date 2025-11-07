import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";
import { findAccountByUserId } from "../models/accountModel.js";
import { findUserByExternalId } from "../models/userModel.js";

/**
 * POST /account/deposit
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
      const accReq = trx.request();
      accReq.input("userId", mssql.Int, user.Id);
      const accRes = await accReq.query("SELECT Id, Balance FROM Accounts WHERE UserId = @userId");
      if (accRes.recordset.length === 0) throw new Error("Account not found");
      const account = accRes.recordset[0];
      const newBalance = parseFloat(account.Balance) + parseFloat(amount);

      const updReq = trx.request();
      updReq.input("accountId", mssql.Int, account.Id);
      updReq.input("newBalance", mssql.Decimal(18,2), newBalance);
      await updReq.query("UPDATE Accounts SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME() WHERE Id = @accountId");

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

      const updReq = trx.request();
      updReq.input("accountId", mssql.Int, account.Id);
      updReq.input("newBalance", mssql.Decimal(18,2), newBalance);
      await updReq.query("UPDATE Accounts SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME() WHERE Id = @accountId");

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

/**
 * GET /account/balance
 */
export async function getBalance(req, res) {
  const externalId = req.user.externalId;
  try {
    const user = await findUserByExternalId(externalId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const account = await findAccountByUserId(user.Id);
    if (!account) return res.status(404).json({ error: "Account not found" });

    return res.json({ balance: account.Balance, currency: account.Currency });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error fetching balance" });
  }
}
