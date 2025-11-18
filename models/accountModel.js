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
  const q = `SELECT Id, UserId, AccountNumber, Balance, Currency FROM Accounts WHERE UserId = @userId`;
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

/**
 * Update account balance and record transaction
 * @param {number} accountId - Account ID
 * @param {number} amount - Transaction amount
 * @param {string} transactionType - DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT
 * @param {string} description - Transaction description
 * @returns {Promise<object>} - Updated balance information
 */
export async function updateAccountBalance(accountId, amount, transactionType, description = null) {
  const pool = await poolPromise;
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    // Get current balance
    const getBalanceReq = transaction.request();
    getBalanceReq.input("accountId", mssql.Int, accountId);
    const balanceRes = await getBalanceReq.query(`SELECT Balance FROM Accounts WHERE Id = @accountId`);
    
    if (!balanceRes.recordset[0]) {
      throw new Error('Account not found');
    }
    
    const currentBalance = parseFloat(balanceRes.recordset[0].Balance);
    let newBalance;
    
    // Calculate new balance based on transaction type
    if (transactionType === 'DEPOSIT' || transactionType === 'TRANSFER_IN') {
      newBalance = currentBalance + amount;
    } else if (transactionType === 'WITHDRAWAL' || transactionType === 'TRANSFER_OUT') {
      newBalance = currentBalance - amount;
      
      // Check for sufficient funds
      if (newBalance < 0) {
        throw new Error('Insufficient funds');
      }
    } else {
      throw new Error('Invalid transaction type');
    }
    
    // Update account balance
    const updateReq = transaction.request();
    updateReq.input("accountId", mssql.Int, accountId);
    updateReq.input("newBalance", mssql.Decimal(18,2), newBalance);
    await updateReq.query(`
      UPDATE Accounts 
      SET Balance = @newBalance, UpdatedAt = GETUTCDATE() 
      WHERE Id = @accountId
    `);
    
    // Record transaction
    const transactionReq = transaction.request();
    transactionReq.input("accountId", mssql.Int, accountId);
    transactionReq.input("transactionType", mssql.NVarChar(50), transactionType);
    transactionReq.input("amount", mssql.Decimal(18,2), amount);
    transactionReq.input("balanceBefore", mssql.Decimal(18,2), currentBalance);
    transactionReq.input("balanceAfter", mssql.Decimal(18,2), newBalance);
    transactionReq.input("description", mssql.NVarChar(255), description);
    
    await transactionReq.query(`
      INSERT INTO Transactions (AccountId, TransactionType, Amount, BalanceBefore, BalanceAfter, Description, Status)
      VALUES (@accountId, @transactionType, @amount, @balanceBefore, @balanceAfter, @description, 'COMPLETED')
    `);
    
    await transaction.commit();
    
    return {
      success: true,
      currentBalance: newBalance,
      previousBalance: currentBalance,
      transactionType,
      amount
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating account balance:', error);
    throw error;
  }
}

/**
 * Get account balance with details
 * @param {number} userId - User ID
 * @returns {Promise<object>} - Account details
 */
export async function getAccountDetails(userId) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("userId", mssql.Int, userId);
  
  const query = `
    SELECT 
      a.Id AS AccountId,
      a.AccountNumber,
      a.Balance,
      a.Currency,
      a.AccountType,
      a.Status,
      u.FullName,
      u.CardNumber
    FROM Accounts a
    INNER JOIN Users u ON a.UserId = u.Id
    WHERE a.UserId = @userId AND a.Status = 'ACTIVE'
  `;
  
  const res = await req.query(query);
  return res.recordset[0] || null;
}

/**
 * Get transaction history
 * @param {number} accountId - Account ID
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<array>} - Transaction history
 */
export async function getTransactionHistory(accountId, limit = 10) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("accountId", mssql.Int, accountId);
  req.input("limit", mssql.Int, limit);
  
  const query = `
    SELECT TOP (@limit)
      Id,
      TransactionType,
      Amount,
      BalanceBefore,
      BalanceAfter,
      Description,
      Status,
      CreatedAt
    FROM Transactions
    WHERE AccountId = @accountId
    ORDER BY CreatedAt DESC
  `;
  
  const res = await req.query(query);
  return res.recordset;
}

/**
 * Find account by account number
 * @param {string} accountNumber - Account number to search for
 * @returns {Promise<object>} - Account details
 */
export async function findAccountByAccountNumber(accountNumber) {
  const pool = await poolPromise;
  const req = pool.request();
  req.input("accountNumber", mssql.NVarChar(20), accountNumber);
  
  const query = `
    SELECT 
      a.Id AS AccountId,
      a.UserId,
      a.AccountNumber,
      a.Balance,
      a.Currency,
      a.AccountType,
      a.Status,
      u.FullName
    FROM Accounts a
    INNER JOIN Users u ON a.UserId = u.Id
    WHERE a.AccountNumber = @accountNumber AND a.Status = 'ACTIVE'
  `;
  
  const res = await req.query(query);
  return res.recordset[0] || null;
}

/**
 * Transfer money between two accounts
 * @param {string} fromAccountNumber - Source account number
 * @param {string} toAccountNumber - Destination account number
 * @param {number} amount - Amount to transfer
 * @param {string} description - Transfer description
 * @returns {Promise<object>} - Transfer result
 */
export async function transferBetweenAccounts(fromAccountNumber, toAccountNumber, amount, description = null) {
  const pool = await poolPromise;
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    // Get both accounts with lock
    const getAccountsReq = transaction.request();
    getAccountsReq.input("fromAccount", mssql.NVarChar(20), fromAccountNumber);
    getAccountsReq.input("toAccount", mssql.NVarChar(20), toAccountNumber);
    
    const accountsRes = await getAccountsReq.query(`
      SELECT 
        a.Id AS AccountId,
        a.AccountNumber,
        a.Balance,
        a.UserId,
        u.FullName
      FROM Accounts a
      INNER JOIN Users u ON a.UserId = u.Id
      WHERE a.AccountNumber IN (@fromAccount, @toAccount) AND a.Status = 'ACTIVE'
    `);
    
    if (accountsRes.recordset.length !== 2) {
      throw new Error('One or both accounts not found');
    }
    
    const fromAccount = accountsRes.recordset.find(acc => acc.AccountNumber === fromAccountNumber);
    const toAccount = accountsRes.recordset.find(acc => acc.AccountNumber === toAccountNumber);
    
    if (!fromAccount || !toAccount) {
      throw new Error('Invalid account configuration');
    }
    
    const fromBalance = parseFloat(fromAccount.Balance);
    const toBalance = parseFloat(toAccount.Balance);
    
    // Check sufficient funds
    if (fromBalance < amount) {
      throw new Error('Insufficient funds');
    }
    
    const newFromBalance = fromBalance - amount;
    const newToBalance = toBalance + amount;
    
    // Update sender account
    const updateFromReq = transaction.request();
    updateFromReq.input("accountId", mssql.Int, fromAccount.AccountId);
    updateFromReq.input("newBalance", mssql.Decimal(18,2), newFromBalance);
    await updateFromReq.query(`
      UPDATE Accounts 
      SET Balance = @newBalance, UpdatedAt = GETUTCDATE() 
      WHERE Id = @accountId
    `);
    
    // Update recipient account
    const updateToReq = transaction.request();
    updateToReq.input("accountId", mssql.Int, toAccount.AccountId);
    updateToReq.input("newBalance", mssql.Decimal(18,2), newToBalance);
    await updateToReq.query(`
      UPDATE Accounts 
      SET Balance = @newBalance, UpdatedAt = GETUTCDATE() 
      WHERE Id = @accountId
    `);
    
    // Record outgoing transaction
    const transactionOutReq = transaction.request();
    transactionOutReq.input("accountId", mssql.Int, fromAccount.AccountId);
    transactionOutReq.input("transactionType", mssql.NVarChar(50), 'TRANSFER_OUT');
    transactionOutReq.input("amount", mssql.Decimal(18,2), amount);
    transactionOutReq.input("balanceBefore", mssql.Decimal(18,2), fromBalance);
    transactionOutReq.input("balanceAfter", mssql.Decimal(18,2), newFromBalance);
    transactionOutReq.input("description", mssql.NVarChar(255), 
      description || `Transfer to ${toAccount.FullName} (${toAccountNumber})`);
    
    await transactionOutReq.query(`
      INSERT INTO Transactions (AccountId, TransactionType, Amount, BalanceBefore, BalanceAfter, Description, Status)
      VALUES (@accountId, @transactionType, @amount, @balanceBefore, @balanceAfter, @description, 'COMPLETED')
    `);
    
    // Record incoming transaction
    const transactionInReq = transaction.request();
    transactionInReq.input("accountId", mssql.Int, toAccount.AccountId);
    transactionInReq.input("transactionType", mssql.NVarChar(50), 'TRANSFER_IN');
    transactionInReq.input("amount", mssql.Decimal(18,2), amount);
    transactionInReq.input("balanceBefore", mssql.Decimal(18,2), toBalance);
    transactionInReq.input("balanceAfter", mssql.Decimal(18,2), newToBalance);
    transactionInReq.input("description", mssql.NVarChar(255), 
      description || `Transfer from ${fromAccount.FullName} (${fromAccountNumber})`);
    
    await transactionInReq.query(`
      INSERT INTO Transactions (AccountId, TransactionType, Amount, BalanceBefore, BalanceAfter, Description, Status)
      VALUES (@accountId, @transactionType, @amount, @balanceBefore, @balanceAfter, @description, 'COMPLETED')
    `);
    
    await transaction.commit();
    
    return {
      success: true,
      fromAccount: {
        accountNumber: fromAccountNumber,
        previousBalance: fromBalance,
        newBalance: newFromBalance
      },
      toAccount: {
        accountNumber: toAccountNumber,
        recipientName: toAccount.FullName,
        previousBalance: toBalance,
        newBalance: newToBalance
      },
      amount
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error transferring between accounts:', error);
    throw error;
  }
}