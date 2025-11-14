import dotenv from "dotenv";
dotenv.config();

import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";
import { findAccountByUserId } from "../models/accountModel.js";
import { findUserByExternalId } from "../models/userModel.js";
import fs from "fs";
import path from "path";

// In-memory dev store for balances when DEV_ALLOW_ALL is enabled
const DEV_BALANCE_FILE = path.resolve("dev-balances.json");
const DEV_TRANSACTIONS_FILE = path.resolve("dev-transactions.json");

const devBalances = new Map();
const devTransactions = new Map();

// Load balances and transactions from file on startup
if (process.env.DEV_ALLOW_ALL === "true") {
  if (fs.existsSync(DEV_BALANCE_FILE)) {
    const data = JSON.parse(fs.readFileSync(DEV_BALANCE_FILE, "utf-8"));
    Object.entries(data).forEach(([k, v]) => devBalances.set(k, v));
    console.log("Loaded dev balances from file:", data);
  }
  if (fs.existsSync(DEV_TRANSACTIONS_FILE)) {
    const data = JSON.parse(fs.readFileSync(DEV_TRANSACTIONS_FILE, "utf-8"));
    Object.entries(data).forEach(([k, v]) => devTransactions.set(k, v));
    console.log("Loaded dev transactions from file");
  }
}

// helper to get/set dev balance
function getDevBalance(externalId) {
  if (!devBalances.has(externalId)) {
    devBalances.set(externalId, 0.00);
  }
  return devBalances.get(externalId);
}

function setDevBalance(externalId, val) {
  devBalances.set(externalId, parseFloat(val));
  // persist to file
  if (process.env.DEV_ALLOW_ALL === "true") {
    const data = Object.fromEntries(devBalances);
    fs.writeFileSync(DEV_BALANCE_FILE, JSON.stringify(data, null, 2));
  }
}

function addDevTransaction(externalId, type, amount, balanceAfter, description = null) {
  if (!devTransactions.has(externalId)) {
    devTransactions.set(externalId, []);
  }
  const txs = devTransactions.get(externalId);
  txs.unshift({
    Id: `dev-${Date.now()}-${Math.random()}`,
    AccountId: `dev-${externalId}`,
    Type: type,
    Amount: amount,
    BalanceAfter: balanceAfter,
    Description: description,
    CreatedAt: new Date().toISOString()
  });
  devTransactions.set(externalId, txs);
  // persist to file
  if (process.env.DEV_ALLOW_ALL === "true") {
    const data = Object.fromEntries(devTransactions);
    fs.writeFileSync(DEV_TRANSACTIONS_FILE, JSON.stringify(data, null, 2));
  }
}

export function getDevTransactions(externalId, limit = 50, offset = 0) {
  if (!devTransactions.has(externalId)) {
    return [];
  }
  const all = devTransactions.get(externalId);
  return all.slice(offset, offset + limit);
}

/**
 * POST /account/deposit
 */
export async function deposit(req, res) {
  const amount = Number(req.body.amount);
  const description = req.body.description || null;
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be positive number" });

  const externalId = req.user.externalId;

  // DEV shortcut: don't touch DB
  if (process.env.DEV_ALLOW_ALL === "true") {
    const old = getDevBalance(externalId);
    const newBalance = old + amount;
    setDevBalance(externalId, newBalance);
    addDevTransaction(externalId, "DEPOSIT", amount, newBalance, description);
    const transaction = { id: `dev-${Date.now()}`, Type: "DEPOSIT", Amount: amount, CreatedAt: new Date(), BalanceAfter: newBalance };
    return res.json({ message: "Deposit successful (dev)", newBalance, transaction });
  }

  // production DB flow (unchanged)
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

  // DEV shortcut
  if (process.env.DEV_ALLOW_ALL === "true") {
    const current = getDevBalance(externalId);
    if (current < amount) return res.status(400).json({ error: "Insufficient funds (dev)" });
    const newBalance = current - amount;
    setDevBalance(externalId, newBalance);
    addDevTransaction(externalId, "WITHDRAW", amount, newBalance, description);
    const transaction = { id: `dev-${Date.now()}`, Type: "WITHDRAW", Amount: amount, CreatedAt: new Date(), BalanceAfter: newBalance };
    return res.json({ message: "Withdrawal successful (dev)", newBalance, transaction });
  }

  // production DB flow (unchanged)
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

  // DEV shortcut
  if (process.env.DEV_ALLOW_ALL === "true") {
    const balance = getDevBalance(externalId);
    return res.json({ balance, currency: "USD" });
  }

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