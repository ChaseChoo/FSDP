import dotenv from "dotenv";
dotenv.config();

import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";
import { getUserAppointments } from "../models/appointmentModel.js";
import { findAccountByUserId, findAccountByAccountNumber, transferBetweenAccounts } from "../models/accountModel.js";
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
export function getDevBalance(externalId) {
  if (!devBalances.has(externalId)) {
    devBalances.set(externalId, 0.00);
  }
  return devBalances.get(externalId);
}

export function setDevBalance(externalId, val) {
  devBalances.set(externalId, parseFloat(val));
  // persist to file
  if (process.env.DEV_ALLOW_ALL === "true") {
    const data = Object.fromEntries(devBalances);
    fs.writeFileSync(DEV_BALANCE_FILE, JSON.stringify(data, null, 2));
  }
}

export function addDevTransaction(externalId, type, amount, balanceAfter, description = null) {
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
  const userId = req.user.userId; // For card-based auth

  // DEV shortcut: don't touch DB
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Use userId as key for card sessions, otherwise externalId
    const key = userId ? `user-${userId}` : externalId;
    const old = getDevBalance(key);
    const newBalance = old + amount;
    setDevBalance(key, newBalance);
    addDevTransaction(key, "DEPOSIT", amount, newBalance, description);
    const transaction = { id: `dev-${Date.now()}`, Type: "DEPOSIT", Amount: amount, CreatedAt: new Date(), BalanceAfter: newBalance };
    return res.json({ message: "Deposit successful (dev)", newBalance, transaction });
  }

  // production DB flow
  try {
    // Use userId directly for card-based auth, otherwise lookup by externalId
    let user;
    if (userId) {
      user = { Id: userId };
    } else {
      user = await findUserByExternalId(externalId);
      if (!user) return res.status(404).json({ error: "User not found" });
    }

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
  const userId = req.user.userId; // For card-based auth

  // DEV shortcut
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Use userId as key for card sessions, otherwise externalId
    const key = userId ? `user-${userId}` : externalId;
    const current = getDevBalance(key);
    if (current < amount) return res.status(400).json({ error: "Insufficient funds (dev)" });
    const newBalance = current - amount;
    setDevBalance(key, newBalance);
    addDevTransaction(key, "WITHDRAW", amount, newBalance, description);
    const transaction = { id: `dev-${Date.now()}`, Type: "WITHDRAW", Amount: amount, CreatedAt: new Date(), BalanceAfter: newBalance };
    return res.json({ message: "Withdrawal successful (dev)", newBalance, transaction });
  }

  // production DB flow
  try {
    // Use userId directly for card-based auth, otherwise lookup by externalId
    let user;
    if (userId) {
      user = { Id: userId };
    } else {
      user = await findUserByExternalId(externalId);
      if (!user) return res.status(404).json({ error: "User not found" });
    }

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
  const userId = req.user.userId; // For card-based auth

  // DEV shortcut
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Use userId as key for card sessions, otherwise externalId
    const key = userId ? `user-${userId}` : externalId;
    const balance = getDevBalance(key);
    return res.json({ balance, currency: "USD" });
  }

  try {
    // Use userId directly for card-based auth, otherwise lookup by externalId
    let user;
    if (userId) {
      user = { Id: userId };
    } else {
      user = await findUserByExternalId(externalId);
      if (!user) return res.status(404).json({ error: "User not found" });
    }

    const account = await findAccountByUserId(user.Id);
    if (!account) return res.status(404).json({ error: "Account not found" });

    return res.json({ balance: account.Balance, currency: account.Currency });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error fetching balance" });
  }
}

/**
 * POST /account/transfer
 */
export async function transfer(req, res) {
  const amount = Number(req.body.amount);
  const toAccountNumber = req.body.toAccountNumber;
  const description = req.body.description || null;

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be positive number" });
  }

  if (!toAccountNumber) {
    return res.status(400).json({ error: "Recipient account number is required" });
  }

  const externalId = req.user.externalId;
  const userId = req.user.userId; // For card-based auth

  // DEV shortcut: simulate transfer between dev accounts
  if (process.env.DEV_ALLOW_ALL === "true") {
    // Use userId as key for card sessions, otherwise externalId
    const key = userId ? `user-${userId}` : externalId;
    const fromBalance = getDevBalance(key);
    
    if (fromBalance < amount) {
      return res.status(400).json({ error: "Insufficient funds (dev)" });
    }

    // For dev mode, we'll use a simple map to track balances by account number
    // The recipient account number becomes the key
    const newFromBalance = fromBalance - amount;
    setDevBalance(key, newFromBalance);
    addDevTransaction(key, "TRANSFER_OUT", amount, newFromBalance, 
      description || `Transfer to ${toAccountNumber}`);

    // Update recipient balance (if they're also in dev mode)
    const recipientBalance = getDevBalance(toAccountNumber);
    const newRecipientBalance = recipientBalance + amount;
    setDevBalance(toAccountNumber, newRecipientBalance);
    addDevTransaction(toAccountNumber, "TRANSFER_IN", amount, newRecipientBalance, 
      description || `Transfer from ${key}`);

    return res.json({ 
      message: "Transfer successful (dev)", 
      newBalance: newFromBalance,
      recipientAccount: toAccountNumber,
      amount 
    });
  }

  // Production DB flow
  try {
    // Use userId directly for card-based auth, otherwise lookup by externalId
    let user;
    if (userId) {
      user = { Id: userId };
    } else {
      user = await findUserByExternalId(externalId);
      if (!user) return res.status(404).json({ error: "User not found" });
    }

    // Get sender's account
    const senderAccount = await findAccountByUserId(user.Id);
    if (!senderAccount) {
      return res.status(404).json({ error: "Your account not found" });
    }

    // Verify recipient account exists
    const recipientAccount = await findAccountByAccountNumber(toAccountNumber);
    if (!recipientAccount) {
      return res.status(404).json({ error: "Recipient account not found" });
    }

    // Prevent self-transfer
    if (senderAccount.Id === recipientAccount.AccountId) {
      return res.status(400).json({ error: "Cannot transfer to your own account" });
    }

    // Perform the transfer
    const result = await transferBetweenAccounts(
      senderAccount.AccountNumber,
      toAccountNumber,
      amount,
      description
    );

    return res.json({ 
      message: "Transfer successful", 
      fromAccount: result.fromAccount,
      toAccount: result.toAccount,
      amount: result.amount
    });

  } catch (err) {
    console.error("Transfer error:", err);
    
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err.message === 'One or both accounts not found') {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Server error during transfer" });
  }
}

/**
 * GET /account/appointments
 */
export async function getAppointments(req, res) {
  try {
    const externalId = req.user?.externalId;
    const userId = req.user?.userId;

    if (req.user?.readonly || externalId === "ANON") {
      return res.json({
        success: true,
        appointments: [],
        count: 0,
        readonly: true,
      });
    }

    let user;
    if (userId) {
      user = { Id: userId };
    } else if (externalId) {
      user = await findUserByExternalId(externalId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const appointments = await getUserAppointments(user.Id);
    const normalized = appointments.map((apt) => {
      const statusRaw = (apt.status || "confirmed").toString();
      const statusLabel = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase();
      return {
        ...apt,
        timeSlot: apt.timeSlot || apt.appointmentTime,
        serviceType: apt.serviceType || apt.notes || "General Inquiry",
        status: statusLabel,
      };
    });

    return res.json({
      success: true,
      appointments: normalized,
      count: normalized.length,
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    if (err?.message === "Database connection not available") {
      return res.json({
        success: true,
        appointments: [],
        count: 0,
        warning: "Database connection not available",
      });
    }
    return res.status(500).json({ error: "Server error fetching appointments" });
  }
}