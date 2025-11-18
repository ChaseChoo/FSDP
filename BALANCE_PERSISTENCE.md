# Account Balance Persistence Implementation

## Summary
Successfully implemented live balance tracking that persists in the FSDP database. Account balances now update and save correctly when users make deposits, withdrawals, or transfers.

## Changes Made

### 1. **API Endpoint for Live Balances**
**File:** `controllers/cardController.js`
- Added `getDemoBalances()` function that queries the `Accounts` table
- Fetches current balances for both demo cards (5555444433332222 and 4444333322221111)
- Returns real-time balance data from the database

**File:** `routes/cardRoutes.js`
- Exposed `GET /api/card/demo-balances` as a public endpoint

### 2. **Dynamic Balance Display**
**File:** `public/card-login.html`
- Replaced hardcoded balance values ($1,000 and $7,500) with dynamic `<span>` elements
- Added JavaScript to fetch and display live balances on page load
- Includes currency formatting and fallback values if API fails
- Balances update automatically when the login page is loaded/refreshed

### 3. **Database Persistence Functions**
**File:** `models/accountModel.js`
- Added `findAccountByAccountNumber()` - finds account by account number
- Added `transferBetweenAccounts()` - handles atomic transfers between accounts
  - Updates both sender and recipient balances
  - Records TRANSFER_OUT and TRANSFER_IN transactions
  - Uses database transactions for atomicity
  - Includes balance validation and error handling

**File:** `controllers/accountController.js`
- Updated imports to include new transfer functions
- Transfer endpoint now fully functional with DB persistence

## Existing Functionality Verified
- ✅ `deposit()` - Already updates Accounts.Balance and records transaction
- ✅ `withdraw()` - Already updates Accounts.Balance and records transaction
- ✅ `transfer()` - Now fully wired with DB transaction support

## Database Schema Used
- **Accounts table**: Stores `Balance`, `Currency`, `AccountNumber`, `Status`
- **Transactions table**: Records all transactions with `TransactionType`, `Amount`, `BalanceBefore`, `BalanceAfter`
- **Users table**: Links accounts via `UserId`

## How It Works

### On Login Page Load:
1. Browser calls `GET /api/card/demo-balances`
2. Server queries database for current balances
3. Balances display dynamically on account selection buttons

### On Deposit/Withdraw:
1. User performs transaction via authenticated endpoint
2. Server updates `Accounts.Balance` in database
3. Transaction recorded in `Transactions` table
4. Response includes new balance

### On Transfer:
1. User initiates transfer with recipient account number
2. Server validates both accounts exist
3. Atomic transaction updates both balances
4. Two transaction records created (TRANSFER_OUT and TRANSFER_IN)
5. Returns updated balances for both accounts

## Testing Steps

1. **Start the server:**
   ```powershell
   node server.js
   ```

2. **View login page:**
   - Navigate to http://localhost:3000/card-login
   - Verify balances display correctly from database

3. **Test deposit:**
   - Login with a card
   - Make a deposit
   - Logout and return to login page
   - Verify balance increased

4. **Test transfer:**
   - Login with Account 1
   - Transfer money to Account 2's account number
   - Logout and login with Account 2
   - Verify both balances updated correctly

## Account Numbers
To find the actual account numbers in your database:
```sql
SELECT 
    u.FullName,
    u.CardNumber,
    a.AccountNumber,
    a.Balance,
    a.Currency
FROM Users u
INNER JOIN Accounts a ON u.Id = a.UserId
WHERE u.CardNumber IN ('5555444433332222', '4444333322221111')
```

## API Endpoints

### Get Demo Balances
```
GET /api/card/demo-balances
Response: {
  success: true,
  accounts: [
    {
      fullName: "Test User ATM",
      cardNumber: "5555444433332222",
      accountNumber: "ACC1001",
      balance: 5000.00,
      currency: "SGD"
    },
    ...
  ]
}
```

### Transfer Between Accounts
```
POST /account/transfer
Headers: Authorization: Bearer {token}
Body: {
  toAccountNumber: "ACC2002",
  amount: 100.00,
  description: "Payment"
}
```

## Notes
- All monetary transactions use database transactions for ACID compliance
- DEV_ALLOW_ALL mode bypasses database (uses in-memory storage)
- Production mode persists all changes to SQL Server
- Balance updates are atomic - both accounts update or neither does
