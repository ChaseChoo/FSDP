import dotenv from "dotenv";
dotenv.config();

import { getDevBalance, setDevBalance, addDevTransaction } from "./accountController.js";
import { findUserByExternalId } from "../models/userModel.js";
import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";

// In-memory wallet storage for demo purposes
const walletBalances = new Map();

/**
 * Get wallet balance for a wallet ID
 */
export function getWalletBalance(walletId) {
  if (!walletBalances.has(walletId)) {
    walletBalances.set(walletId, 0.00);
  }
  return walletBalances.get(walletId);
}

/**
 * Update wallet balance
 */
export function updateWalletBalance(walletId, amount) {
  const currentBalance = getWalletBalance(walletId);
  const newBalance = currentBalance + amount;
  walletBalances.set(walletId, newBalance);
  return newBalance;
}

/**
 * POST /api/wallet/transfer
 * Transfer funds from ATM account to digital wallet
 */
export async function transferToWallet(req, res) {
  const { amount, walletId, walletType } = req.body;
  
  if (!amount || !walletId || !walletType) {
    return res.status(400).json({ error: "Amount, walletId, and walletType are required" });
  }

  const transferAmount = Number(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  const externalId = req.user.externalId;
  const userId = req.user.userId;

  try {
    // DEV shortcut
    if (process.env.DEV_ALLOW_ALL === "true") {
      const key = userId ? `user-${userId}` : externalId;
      const currentBalance = getDevBalance(key);
      
      if (currentBalance < transferAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct from account
      const newAccountBalance = currentBalance - transferAmount;
      setDevBalance(key, newAccountBalance);
      addDevTransaction(key, "WALLET_TRANSFER", -transferAmount, newAccountBalance, `Transfer to ${walletType} wallet ${walletId}`);

      // Add to wallet
      const newWalletBalance = updateWalletBalance(walletId, transferAmount);

      return res.json({
        message: "Transfer successful",
        accountBalance: newAccountBalance,
        walletBalance: newWalletBalance,
        transaction: {
          id: `dev-${Date.now()}`,
          Type: "WALLET_TRANSFER",
          Amount: -transferAmount,
          WalletId: walletId,
          WalletType: walletType,
          CreatedAt: new Date(),
          BalanceAfter: newAccountBalance
        }
      });
    }

    // Production DB flow
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

      if (currentBalance < transferAmount) {
        await trx.rollback();
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newAccountBalance = currentBalance - transferAmount;

      const updReq = trx.request();
      updReq.input("accountId", mssql.Int, account.Id);
      updReq.input("newBalance", mssql.Decimal(18, 2), newAccountBalance);
      await updReq.query("UPDATE Accounts SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME() WHERE Id = @accountId");

      const inserted = await insertTransaction({
        accountId: account.Id,
        type: "WALLET_TRANSFER",
        amount: -transferAmount,
        balanceAfter: newAccountBalance,
        description: `Transfer to ${walletType} wallet ${walletId}`
      }, trx);

      await trx.commit();

      // Add to wallet
      const newWalletBalance = updateWalletBalance(walletId, transferAmount);

      return res.json({
        message: "Transfer successful",
        accountBalance: newAccountBalance,
        walletBalance: newWalletBalance,
        transaction: inserted
      });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (err) {
    console.error("transferToWallet error:", err);
    return res.status(500).json({ error: "Server error during wallet transfer" });
  }
}

/**
 * GET /api/wallet/balance/:walletId
 * Get current balance for a digital wallet
 */
export async function getWalletBalanceAPI(req, res) {
  const { walletId } = req.params;
  
  if (!walletId) {
    return res.status(400).json({ error: "walletId is required" });
  }

  const balance = getWalletBalance(walletId);
  
  return res.json({
    walletId,
    balance,
    lastUpdated: new Date().toISOString()
  });
}
