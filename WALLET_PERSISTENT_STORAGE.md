# 💰 Persistent Wallet Storage Setup Guide

## Overview
Your wallet-mobile application now has **permanent database storage** for all transactions in Alipay, WeChat, and Touch'n Go wallets. Money transferred will be saved forever in your SQL Server database.

## 🎯 What's New

### ✅ Features Added
1. **Persistent Wallet Balances** - All wallet balances stored in database
2. **Complete Transaction History** - Every transfer saved with full details
3. **Multiple Wallet Support** - Alipay, WeChat, Touch'n Go, GrabPay
4. **Transaction Statistics** - Track total received/sent amounts
5. **API Endpoints** - New endpoints for transaction history

---

## 📦 Files Created/Modified

### New Files
1. **`Sql queries/CREATE_WALLET_TABLES.sql`** - Database schema for wallets
2. **`models/walletModel.js`** - Database operations for wallets
3. **`WALLET_PERSISTENT_STORAGE.md`** - This documentation

### Modified Files
1. **`controllers/walletController.js`** - Updated to use database
2. **`routes/walletRoutes.js`** - Added new API endpoints
3. **`public/wallet-alipay.html`** - Loads transaction history from database

---

## 🚀 Setup Instructions

### Step 1: Create Database Tables
Run the SQL script to create the necessary tables:

```bash
# Open SQL Server Management Studio (SSMS)
# Connect to: 127.0.0.1\SQLEXPRESS
# Open file: Sql queries/CREATE_WALLET_TABLES.sql
# Press F5 to execute
```

Or run from command line:
```powershell
sqlcmd -S 127.0.0.1\SQLEXPRESS -U myuser -P FSDP123 -d FSDP -i "Sql queries\CREATE_WALLET_TABLES.sql"
```

This creates two tables:
- **WalletBalances** - Stores current balance for each wallet
- **WalletTransactions** - Stores complete transaction history

### Step 2: Verify Tables Created
Check that tables exist:
```sql
USE FSDP;
SELECT * FROM WalletBalances;
SELECT * FROM WalletTransactions;
```

### Step 3: Start Your Server
```bash
node server.js
```

### Step 4: Test the Wallet
1. Open http://localhost:3000/wallet-mobile
2. Click on any wallet (Alipay, WeChat, Touch'n Go)
3. Transfer money from ATM
4. **Your balance and transactions are now saved permanently!**

---

## 🔌 New API Endpoints

### 1. Get Wallet Balance
```http
GET /api/wallet/balance/:walletId
```

**Response:**
```json
{
  "walletId": "wallet-12345",
  "balance": 150.50,
  "lastUpdated": "2026-01-30T10:30:00.000Z"
}
```

### 2. Get Transaction History
```http
GET /api/wallet/transactions/:walletId?limit=50&offset=0
```

**Response:**
```json
{
  "walletId": "wallet-12345",
  "transactions": [
    {
      "Id": 1,
      "TransactionType": "received",
      "Amount": 50.00,
      "BalanceBefore": 100.50,
      "BalanceAfter": 150.50,
      "Description": "Transfer from ATM account",
      "SourceType": "ATM",
      "CreatedAt": "2026-01-30T10:30:00.000Z"
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

### 3. Get Wallet Summary
```http
GET /api/wallet/summary/:walletId?type=alipay
```

**Response:**
```json
{
  "wallet": {
    "Id": 1,
    "WalletId": "wallet-12345",
    "WalletType": "alipay",
    "Balance": 150.50,
    "Currency": "SGD"
  },
  "transactions": [...],
  "statistics": {
    "totalTransactions": 10,
    "totalReceived": 500.00,
    "totalSent": 349.50
  }
}
```

---

## 💾 Database Schema

### WalletBalances Table
```sql
CREATE TABLE WalletBalances (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    WalletId NVARCHAR(100) NOT NULL UNIQUE,
    WalletType NVARCHAR(50) NOT NULL,      -- 'alipay', 'wechat', 'touchngo'
    Balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Currency NVARCHAR(10) NOT NULL DEFAULT 'SGD',
    UserId INT NULL,                        -- Optional link to Users
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL
);
```

### WalletTransactions Table
```sql
CREATE TABLE WalletTransactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    WalletBalanceId INT NOT NULL,
    WalletId NVARCHAR(100) NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL,  -- 'received', 'sent', 'refund'
    Amount DECIMAL(18,2) NOT NULL,
    BalanceBefore DECIMAL(18,2) NOT NULL,
    BalanceAfter DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL,
    Description NVARCHAR(500) NULL,
    SourceType NVARCHAR(50) NULL,           -- 'ATM', 'TRANSFER', 'PAYMENT'
    SourceReference NVARCHAR(200) NULL,     -- Link to source transaction
    CreatedAt DATETIME2 NOT NULL,
    FOREIGN KEY (WalletBalanceId) REFERENCES WalletBalances(Id)
);
```

---

## 🧪 Testing

### Test 1: Transfer Money
1. Open wallet: http://localhost:3000/wallet-alipay?walletId=wallet-12345
2. Transfer $50 from ATM
3. Check database:
   ```sql
   SELECT * FROM WalletBalances WHERE WalletId = 'wallet-12345';
   SELECT * FROM WalletTransactions WHERE WalletId = 'wallet-12345';
   ```

### Test 2: Multiple Wallets
Test each wallet type:
- Alipay: `wallet-12345`
- WeChat: `wechat-12345`
- Touch'n Go: `touchngo-12345`

Each wallet maintains its own balance and transaction history.

### Test 3: Transaction History
```bash
# Check transactions via API
curl http://localhost:3000/api/wallet/transactions/wallet-12345
```

### Test 4: Persistence Check
1. Transfer money to wallet
2. **Restart your server** (node server.js)
3. Open wallet again
4. ✅ **Your balance and transactions are still there!**

---

## 🔍 Troubleshooting

### Issue: Tables not created
**Solution:**
```sql
USE FSDP;
-- Check if tables exist
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('WalletBalances', 'WalletTransactions');

-- If not, run CREATE_WALLET_TABLES.sql again
```

### Issue: Balance shows 0 after restart
**Solution:** Check database connection in `.env`:
```env
DB_SERVER=127.0.0.1
DB_INSTANCE=SQLEXPRESS
DB_DATABASE=FSDP
DB_USER=myuser
DB_PASSWORD=FSDP123
```

### Issue: Transactions not appearing
**Solution:** 
1. Check browser console for errors
2. Verify API endpoint: http://localhost:3000/api/wallet/transactions/wallet-12345
3. Check database: `SELECT * FROM WalletTransactions`

---

## 📊 Query Examples

### Check all wallet balances
```sql
SELECT 
    WalletId, 
    WalletType, 
    Balance, 
    Currency,
    CreatedAt
FROM WalletBalances
ORDER BY UpdatedAt DESC;
```

### Get transaction summary for a wallet
```sql
SELECT 
    WalletId,
    COUNT(*) as TotalTransactions,
    SUM(CASE WHEN Amount > 0 THEN Amount ELSE 0 END) as TotalReceived,
    SUM(CASE WHEN Amount < 0 THEN ABS(Amount) ELSE 0 END) as TotalSent,
    MAX(CreatedAt) as LastTransaction
FROM WalletTransactions
WHERE WalletId = 'wallet-12345'
GROUP BY WalletId;
```

### Find recent transactions across all wallets
```sql
SELECT TOP 20
    wt.WalletId,
    wb.WalletType,
    wt.TransactionType,
    wt.Amount,
    wt.Description,
    wt.CreatedAt
FROM WalletTransactions wt
JOIN WalletBalances wb ON wt.WalletBalanceId = wb.Id
ORDER BY wt.CreatedAt DESC;
```

---

## ✅ Benefits

1. **💾 Permanent Storage** - Never lose transaction data
2. **🔄 Server Restarts** - Data persists across restarts
3. **📈 Analytics** - Track spending patterns
4. **🔍 Audit Trail** - Complete transaction history
5. **🎯 Production Ready** - ACID compliant transactions
6. **🔒 Data Integrity** - Foreign key constraints ensure consistency

---

## 🎉 Success!

Your wallet system now has enterprise-grade persistent storage. All transactions are:
- ✅ Saved to SQL Server database
- ✅ Preserved forever (unless manually deleted)
- ✅ Protected by database transactions
- ✅ Queryable via API or SQL
- ✅ Linked to ATM transactions via SourceReference

**Your money is safe and stored permanently!** 💰🎊
