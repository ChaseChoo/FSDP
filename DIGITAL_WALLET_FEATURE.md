# Digital Wallet Transfer Feature

## Overview
This feature allows users to transfer funds from their ATM account to digital wallets (like Alipay, WeChat Pay, GrabPay, PayNow) with instant real-time updates on their mobile wallet app.

## Features
- ✅ Transfer funds from ATM to digital wallets
- ✅ Support for multiple wallet types (Alipay, WeChat Pay, GrabPay, PayNow)
- ✅ Real-time balance updates on mobile wallet app
- ✅ Transaction history tracking
- ✅ Quick amount selection
- ✅ Custom amount input
- ✅ Instant notifications on mobile app

## Files Created

### Backend
1. **controllers/walletController.js** - Handles wallet transfer logic and balance management
2. **routes/walletRoutes.js** - API routes for wallet operations

### Frontend
1. **public/wallet-transfer.html** - ATM interface for transferring to digital wallets
2. **public/wallet-alipay.html** - Mock Alipay mobile app interface

### Updated Files
1. **server.js** - Added wallet routes and page serving
2. **public/home.html** - Added "Digital Wallet" button in Non-Cash Services menu

## How to Use

### Step 1: Start the Server
```bash
npm start
```
The server will start on port 3000 (or the port specified in your .env file).

### Step 2: Access the ATM Interface
1. Open your browser and navigate to `http://localhost:3000`
2. Log in to your account
3. From the main menu, click "Non Cash Services"
4. Click on "Digital Wallet" button

### Step 3: Open the Mobile Wallet App (in a separate window/device)
1. Open a new browser window or tab
2. Navigate to `http://localhost:3000/wallet-alipay`
3. You can also add `?walletId=your-wallet-id` to the URL to set a custom wallet ID
   - Example: `http://localhost:3000/wallet-alipay?walletId=wallet-12345`

### Step 4: Transfer Funds
1. In the ATM interface (wallet-transfer.html):
   - Select a wallet type (Alipay, WeChat Pay, GrabPay, or PayNow)
   - Enter the wallet ID (default: wallet-12345)
   - Select a quick amount or enter a custom amount
   - Click "Transfer Now"

2. Watch the magic happen:
   - ✨ The mobile wallet app will instantly update with the new balance
   - 🎉 A notification will appear showing the received funds
   - 📝 The transaction will be added to the transaction history

### Step 5: View Transaction History
- The mobile wallet app shows all recent transactions
- The ATM interface updates your account balance immediately

## API Endpoints

### POST /api/wallet/transfer
Transfer funds from ATM account to digital wallet.

**Request Body:**
```json
{
  "amount": 50.00,
  "walletId": "wallet-12345",
  "walletType": "alipay"
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "accountBalance": 450.00,
  "walletBalance": 50.00,
  "transaction": {
    "id": "dev-1234567890",
    "Type": "WALLET_TRANSFER",
    "Amount": -50.00,
    "WalletId": "wallet-12345",
    "WalletType": "alipay",
    "CreatedAt": "2026-01-17T...",
    "BalanceAfter": 450.00
  }
}
```

### GET /api/wallet/balance/:walletId
Get current balance for a digital wallet.

**Response:**
```json
{
  "walletId": "wallet-12345",
  "balance": 50.00,
  "lastUpdated": "2026-01-17T..."
}
```

## Real-Time Communication

The feature uses the **BroadcastChannel API** for real-time communication between the ATM interface and the mobile wallet app:

1. When a transfer is made at the ATM, it broadcasts a message on the 'wallet-updates' channel
2. The mobile wallet app listens to this channel
3. When a message is received, the wallet instantly updates the balance and shows a notification

**Fallback:** If BroadcastChannel is not supported, the mobile app polls the server every 2 seconds for balance updates.

## Testing on Multiple Devices

### Same Device (Recommended for Development)
1. Open the ATM interface in one browser window
2. Open the wallet app in another browser window
3. Transfers will update instantly via BroadcastChannel

### Different Devices (Same Network)
1. Find your computer's local IP address
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. On the ATM device: Navigate to `http://YOUR_IP:3000`
3. On the mobile device: Navigate to `http://YOUR_IP:3000/wallet-alipay`
4. The wallet app will poll the server for updates (2-second interval)

## Supported Wallet Types
- 🅰️ **Alipay** - Chinese payment platform
- 💬 **WeChat Pay** - Chinese payment platform
- 🚗 **GrabPay** - Southeast Asian e-wallet
- 💰 **PayNow** - Singapore's instant payment system

## Architecture

```
┌─────────────────┐         ┌──────────────┐
│   ATM Interface │         │ Mobile Wallet│
│ (wallet-transfer)│         │  (Alipay)   │
└────────┬────────┘         └──────┬───────┘
         │                         │
         │   Transfer Request      │
         │─────────────────────────▶
         │                         │
         │  BroadcastChannel       │
         │  'wallet-updates'       │
         │◀────────────────────────│
         │                         │
         │    Instant Update!      │
         │─────────────────────────▶
         │                         │
```

## Security Considerations
- In production, add proper authentication for wallet transfers
- Implement rate limiting to prevent abuse
- Add transaction confirmation steps
- Use HTTPS for all communications
- Validate wallet IDs against a registry
- Implement transaction limits and daily caps

## Future Enhancements
- [ ] Add QR code scanning for wallet ID input
- [ ] Support for cryptocurrency wallets
- [ ] Two-factor authentication for large transfers
- [ ] Transaction receipts via email/SMS
- [ ] Multi-currency support
- [ ] Transfer scheduling
- [ ] Recurring transfers
- [ ] WebSocket support for true real-time updates across devices

## Troubleshooting

### Balance not updating on mobile wallet
1. Check that both pages are using the same wallet ID
2. Ensure BroadcastChannel is working (same browser, same origin)
3. Wait 2 seconds for the polling fallback to trigger
4. Check browser console for errors

### Transfer fails
1. Verify you have sufficient balance
2. Check that the server is running
3. Ensure you're logged in to the ATM
4. Check browser console and server logs for errors

### Mobile wallet not loading
1. Clear browser cache
2. Check that the server is serving static files correctly
3. Verify the URL is correct

## Demo Video Script
1. Show the ATM main menu
2. Navigate to "Non Cash Services" → "Digital Wallet"
3. Open mobile wallet app in another window
4. Select Alipay wallet type
5. Enter wallet ID: wallet-12345
6. Select S$50 quick amount
7. Click "Transfer Now"
8. Watch the mobile wallet instantly update with notification and new balance
9. Show transaction history on mobile wallet

Enjoy your instant digital wallet transfers! 🚀💰
