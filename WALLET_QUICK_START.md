# 🚀 Quick Start Guide - Digital Wallet Transfer Feature

## Installation & Setup

### 1. No Additional Dependencies Needed
This feature uses only existing dependencies. Just make sure your project is set up:

```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

## 🎯 Quick Demo (Easiest Way)

### Option 1: Side-by-Side Demo View
Open your browser and go to:
```
http://localhost:3000/wallet-demo
```

This shows both the ATM interface and mobile wallet side-by-side. Perfect for demonstrations!

### Option 2: Manual Setup (Two Windows)

**Window 1 - ATM Interface:**
```
http://localhost:3000/wallet-transfer
```

**Window 2 - Mobile Wallet (Alipay):**
```
http://localhost:3000/wallet-alipay?walletId=wallet-12345
```

## 📱 How to Test

1. **Open the demo page**: `http://localhost:3000/wallet-demo`

2. **Look at both interfaces**:
   - Left side: ATM interface showing your account balance
   - Right side: Mobile wallet (Alipay) showing wallet balance

3. **Make a transfer**:
   - On the ATM side (left):
     - Select a wallet type (Alipay is default)
     - Make sure Wallet ID is "wallet-12345"
     - Click a quick amount (e.g., S$50)
     - Click "Transfer Now"

4. **Watch the magic** ✨:
   - ATM balance decreases instantly
   - Mobile wallet balance increases instantly
   - Green notification appears on mobile wallet
   - Transaction appears in mobile wallet history

## 🔗 Access from ATM Main Menu

1. Start the server and login to the ATM
2. Click "Non Cash Services" from the main menu
3. Click "Digital Wallet" button
4. You'll be taken to the wallet transfer page

## 📊 Available Pages

| Page | URL | Description |
|------|-----|-------------|
| Demo View | `/wallet-demo` | Side-by-side view of ATM and mobile wallet |
| ATM Transfer | `/wallet-transfer` | ATM interface for transferring funds |
| Alipay Wallet | `/wallet-alipay` | Mock Alipay mobile app |
| Home (ATM) | `/account` | Main ATM interface |

## 🎨 Supported Wallets

- 🅰️ **Alipay** - Chinese payment platform
- 💬 **WeChat Pay** - Chinese payment platform  
- 🚗 **GrabPay** - Southeast Asian e-wallet
- 💰 **PayNow** - Singapore instant payment

## 💡 Tips

1. **Use the demo view** for presentations - it shows everything in one screen
2. **Use the same wallet ID** on both ATM and mobile wallet (default: wallet-12345)
3. **Transfers are instant** via BroadcastChannel API (same browser)
4. **Mobile wallet polls** every 2 seconds as a fallback
5. **Check your balance** before transferring to avoid insufficient funds error

## 🐛 Troubleshooting

### Balance not updating?
- Make sure both pages use the same wallet ID
- Check browser console for errors
- Wait 2 seconds for polling to trigger

### Transfer failed?
- Ensure you're logged in to the ATM
- Check that you have sufficient balance
- Verify server is running

### Can't access pages?
- Confirm server is running on port 3000
- Check for any startup errors in terminal
- Try clearing browser cache

## 🎬 Demo Script

Perfect for showing to others:

1. Open `http://localhost:3000/wallet-demo`
2. Point out the two interfaces side-by-side
3. Show the current balances on both sides
4. Select S$50 quick amount on ATM side
5. Click "Transfer Now"
6. Watch both balances update in real-time
7. Point out the notification and transaction history on mobile wallet
8. Repeat with different amounts to show consistency

## 📱 Testing on Phone

To test on your actual phone:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Make sure your phone is on the same WiFi network

3. On your phone, open:
   ```
   http://YOUR_IP_ADDRESS:3000/wallet-alipay?walletId=wallet-12345
   ```

4. On your computer, open:
   ```
   http://localhost:3000/wallet-transfer
   ```

5. Make a transfer and watch your phone update!

## 🔥 Cool Features to Highlight

- ⚡ **Instant Updates** - See money move in real-time
- 💳 **Multiple Wallets** - Support for 4 different wallet types
- 🎯 **Quick Amounts** - One-click selection of common amounts
- 📝 **Transaction History** - All transfers are logged
- 🔔 **Notifications** - Get alerted when money arrives
- 📱 **Mobile Optimized** - Looks great on phones
- 🎨 **Modern UI** - Beautiful gradient design

Enjoy your new digital wallet transfer feature! 🚀
