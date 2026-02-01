import dotenv from "dotenv";
dotenv.config();

import { getDevBalance, setDevBalance, addDevTransaction } from "./accountController.js";
import { findUserByExternalId } from "../models/userModel.js";
import { poolPromise, mssql } from "../models/db.js";
import { insertTransaction } from "../models/transactionModel.js";
import { 
  getOrCreateWallet, 
  getWalletBalance as getWalletBalanceDB, 
  updateWalletBalance as updateWalletBalanceDB,
  getWalletTransactions,
  getWalletSummary
} from "../models/walletModel.js";

// In-memory wallet storage for demo purposes (fallback only)
const walletBalances = new Map();

/**
 * Get wallet balance for a wallet ID
 * Now uses database for persistent storage
 */
export async function getWalletBalance(walletId) {
  try {
    // Try to get from database first
    const balance = await getWalletBalanceDB(walletId);
    return balance;
  } catch (error) {
    console.error("Error fetching wallet balance from DB:", error);
    // Fallback to in-memory storage
    if (!walletBalances.has(walletId)) {
      walletBalances.set(walletId, 0.00);
    }
    return walletBalances.get(walletId);
  }
}

/**
 * Update wallet balance
 * Now uses database for persistent storage
 */
export async function updateWalletBalance(walletId, amount, walletType, description) {
  try {
    // Update in database
    const transaction = await updateWalletBalanceDB(
      walletId,
      amount,
      amount > 0 ? 'received' : 'sent',
      description,
      'ATM',
      null
    );
    return parseFloat(transaction.BalanceAfter);
  } catch (error) {
    console.error("Error updating wallet balance in DB:", error);
    // Fallback to in-memory storage
    const currentBalance = walletBalances.get(walletId) || 0.00;
    const newBalance = currentBalance + amount;
    walletBalances.set(walletId, newBalance);
    return newBalance;
  }
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
    // Ensure wallet exists in database
    await getOrCreateWallet(walletId, walletType, userId);

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

      // Add to wallet (now persisted to database)
      const newWalletBalance = await updateWalletBalance(
        walletId, 
        transferAmount, 
        walletType,
        `Transfer from ATM account ${externalId}`
      );

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

      // Add to wallet using the same transaction (now persisted to database)
      const walletTransaction = await updateWalletBalanceDB(
        walletId,
        transferAmount,
        'received',
        `Transfer from ATM account (User ID: ${user.Id})`,
        'ATM',
        inserted.Id ? inserted.Id.toString() : null,
        trx // Pass the transaction for atomic operation
      );

      await trx.commit();

      return res.json({
        message: "Transfer successful",
        accountBalance: newAccountBalance,
        walletBalance: parseFloat(walletTransaction.BalanceAfter),
        transaction: inserted,
        walletTransaction: {
          id: walletTransaction.Id,
          walletId: walletTransaction.WalletId,
          amount: parseFloat(walletTransaction.Amount),
          balanceAfter: parseFloat(walletTransaction.BalanceAfter),
          createdAt: walletTransaction.CreatedAt
        }
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

  try {
    const balance = await getWalletBalance(walletId);
    
    return res.json({
      walletId,
      balance,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({ error: "Server error fetching wallet balance" });
  }
}

/**
 * GET /api/wallet/transactions/:walletId
 * Get transaction history for a digital wallet
 */
export async function getWalletTransactionsAPI(req, res) {
  const { walletId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  if (!walletId) {
    return res.status(400).json({ error: "walletId is required" });
  }

  try {
    const transactions = await getWalletTransactions(walletId, limit, offset);
    
    return res.json({
      walletId,
      transactions,
      count: transactions.length,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return res.status(500).json({ error: "Server error fetching transactions" });
  }
}

/**
 * GET /api/wallet/summary/:walletId
 * Get wallet summary with balance and recent transactions
 */
export async function getWalletSummaryAPI(req, res) {
  const { walletId } = req.params;
  
  if (!walletId) {
    return res.status(400).json({ error: "walletId is required" });
  }

  try {
    // Ensure wallet exists
    const walletType = req.query.type || 'alipay';
    await getOrCreateWallet(walletId, walletType);
    
    const summary = await getWalletSummary(walletId);
    
    if (!summary) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    return res.json(summary);
  } catch (error) {
    console.error("Error fetching wallet summary:", error);
    return res.status(500).json({ error: "Server error fetching wallet summary" });
  }
}
