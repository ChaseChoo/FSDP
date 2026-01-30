// models/walletModel.js
import { poolPromise, mssql } from "./db.js";

/**
 * Get or create a wallet balance record
 * @param {string} walletId - The wallet identifier
 * @param {string} walletType - Type of wallet (alipay, wechat, touchngo, grabpay)
 * @param {number} userId - Optional user ID to link the wallet to
 * @returns {Promise<Object>} Wallet balance record
 */
export async function getOrCreateWallet(walletId, walletType, userId = null) {
  const pool = await poolPromise;
  
  // Check if wallet exists
  let request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  
  let result = await request.query(`
    SELECT Id, WalletId, WalletType, Balance, Currency, UserId, IsActive, CreatedAt, UpdatedAt
    FROM WalletBalances
    WHERE WalletId = @walletId
  `);
  
  if (result.recordset.length > 0) {
    return result.recordset[0];
  }
  
  // Create new wallet if it doesn't exist
  request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  request.input("walletType", mssql.NVarChar(50), walletType);
  request.input("balance", mssql.Decimal(18, 2), 0.00);
  request.input("currency", mssql.NVarChar(10), "SGD");
  
  if (userId) {
    request.input("userId", mssql.Int, userId);
  }
  
  result = await request.query(`
    INSERT INTO WalletBalances (WalletId, WalletType, Balance, Currency, UserId)
    OUTPUT INSERTED.*
    VALUES (@walletId, @walletType, @balance, @currency, ${userId ? '@userId' : 'NULL'})
  `);
  
  return result.recordset[0];
}

/**
 * Get wallet balance by wallet ID
 * @param {string} walletId - The wallet identifier
 * @returns {Promise<number>} Current balance
 */
export async function getWalletBalance(walletId) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  
  const result = await request.query(`
    SELECT Balance FROM WalletBalances WHERE WalletId = @walletId
  `);
  
  if (result.recordset.length === 0) {
    return 0.00;
  }
  
  return parseFloat(result.recordset[0].Balance);
}

/**
 * Update wallet balance (in a transaction)
 * @param {string} walletId - The wallet identifier
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {string} transactionType - Type of transaction ('received', 'sent', 'refund')
 * @param {string} description - Transaction description
 * @param {string} sourceType - Source type ('ATM', 'TRANSFER', 'PAYMENT', 'REFUND')
 * @param {string} sourceReference - Reference to source transaction
 * @param {Object} transaction - Optional existing SQL transaction
 * @returns {Promise<Object>} Transaction record
 */
export async function updateWalletBalance(
  walletId, 
  amount, 
  transactionType, 
  description, 
  sourceType = null,
  sourceReference = null,
  transaction = null
) {
  const pool = await poolPromise;
  const trx = transaction || new mssql.Transaction(pool);
  const shouldCommit = !transaction; // Only commit if we created the transaction
  
  try {
    if (shouldCommit) {
      await trx.begin();
    }
    
    // Get current wallet balance (with row lock)
    let request = trx.request();
    request.input("walletId", mssql.NVarChar(100), walletId);
    
    let result = await request.query(`
      SELECT Id, Balance, WalletType FROM WalletBalances WITH (UPDLOCK, ROWLOCK)
      WHERE WalletId = @walletId
    `);
    
    if (result.recordset.length === 0) {
      throw new Error(`Wallet not found: ${walletId}`);
    }
    
    const wallet = result.recordset[0];
    const balanceBefore = parseFloat(wallet.Balance);
    const balanceAfter = balanceBefore + amount;
    
    // Check for negative balance
    if (balanceAfter < 0) {
      throw new Error(`Insufficient wallet balance. Current: ${balanceBefore}, Requested: ${amount}`);
    }
    
    // Update wallet balance
    request = trx.request();
    request.input("walletId", mssql.NVarChar(100), walletId);
    request.input("newBalance", mssql.Decimal(18, 2), balanceAfter);
    
    await request.query(`
      UPDATE WalletBalances 
      SET Balance = @newBalance, UpdatedAt = SYSUTCDATETIME()
      WHERE WalletId = @walletId
    `);
    
    // Insert transaction record
    request = trx.request();
    request.input("walletBalanceId", mssql.Int, wallet.Id);
    request.input("walletId", mssql.NVarChar(100), walletId);
    request.input("transactionType", mssql.NVarChar(50), transactionType);
    request.input("amount", mssql.Decimal(18, 2), amount);
    request.input("balanceBefore", mssql.Decimal(18, 2), balanceBefore);
    request.input("balanceAfter", mssql.Decimal(18, 2), balanceAfter);
    request.input("description", mssql.NVarChar(500), description);
    
    if (sourceType) {
      request.input("sourceType", mssql.NVarChar(50), sourceType);
    }
    if (sourceReference) {
      request.input("sourceReference", mssql.NVarChar(200), sourceReference);
    }
    
    result = await request.query(`
      INSERT INTO WalletTransactions 
        (WalletBalanceId, WalletId, TransactionType, Amount, BalanceBefore, BalanceAfter, 
         Description, SourceType, SourceReference)
      OUTPUT INSERTED.*
      VALUES 
        (@walletBalanceId, @walletId, @transactionType, @amount, @balanceBefore, @balanceAfter,
         @description, ${sourceType ? '@sourceType' : 'NULL'}, ${sourceReference ? '@sourceReference' : 'NULL'})
    `);
    
    if (shouldCommit) {
      await trx.commit();
    }
    
    return {
      ...result.recordset[0],
      WalletType: wallet.WalletType
    };
  } catch (error) {
    if (shouldCommit) {
      await trx.rollback();
    }
    throw error;
  }
}

/**
 * Get wallet transaction history
 * @param {string} walletId - The wallet identifier
 * @param {number} limit - Maximum number of transactions to return
 * @param {number} offset - Number of transactions to skip
 * @returns {Promise<Array>} Array of transaction records
 */
export async function getWalletTransactions(walletId, limit = 50, offset = 0) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  request.input("limit", mssql.Int, limit);
  request.input("offset", mssql.Int, offset);
  
  const result = await request.query(`
    SELECT 
      Id, WalletId, TransactionType, Amount, BalanceBefore, BalanceAfter,
      Currency, Description, SourceType, SourceReference, CreatedAt
    FROM WalletTransactions
    WHERE WalletId = @walletId
    ORDER BY CreatedAt DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);
  
  return result.recordset;
}

/**
 * Get wallet summary with recent transactions
 * @param {string} walletId - The wallet identifier
 * @returns {Promise<Object>} Wallet summary with balance and recent transactions
 */
export async function getWalletSummary(walletId) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  
  // Get wallet balance
  const balanceResult = await request.query(`
    SELECT Id, WalletId, WalletType, Balance, Currency, CreatedAt, UpdatedAt
    FROM WalletBalances
    WHERE WalletId = @walletId
  `);
  
  if (balanceResult.recordset.length === 0) {
    return null;
  }
  
  const wallet = balanceResult.recordset[0];
  
  // Get recent transactions (last 10)
  const transactions = await getWalletTransactions(walletId, 10, 0);
  
  // Get transaction statistics
  const statsRequest = pool.request();
  statsRequest.input("walletId", mssql.NVarChar(100), walletId);
  
  const statsResult = await statsRequest.query(`
    SELECT 
      COUNT(*) as TotalTransactions,
      SUM(CASE WHEN Amount > 0 THEN Amount ELSE 0 END) as TotalReceived,
      SUM(CASE WHEN Amount < 0 THEN ABS(Amount) ELSE 0 END) as TotalSent
    FROM WalletTransactions
    WHERE WalletId = @walletId
  `);
  
  const stats = statsResult.recordset[0];
  
  return {
    wallet,
    transactions,
    statistics: {
      totalTransactions: parseInt(stats.TotalTransactions) || 0,
      totalReceived: parseFloat(stats.TotalReceived) || 0.00,
      totalSent: parseFloat(stats.TotalSent) || 0.00
    }
  };
}

/**
 * Get all wallets for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} Array of wallet records
 */
export async function getUserWallets(userId) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("userId", mssql.Int, userId);
  
  const result = await request.query(`
    SELECT Id, WalletId, WalletType, Balance, Currency, IsActive, CreatedAt, UpdatedAt
    FROM WalletBalances
    WHERE UserId = @userId AND IsActive = 1
    ORDER BY CreatedAt DESC
  `);
  
  return result.recordset;
}

/**
 * Deactivate a wallet
 * @param {string} walletId - The wallet identifier
 * @returns {Promise<boolean>} Success status
 */
export async function deactivateWallet(walletId) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("walletId", mssql.NVarChar(100), walletId);
  
  const result = await request.query(`
    UPDATE WalletBalances 
    SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
    WHERE WalletId = @walletId
  `);
  
  return result.rowsAffected[0] > 0;
}
