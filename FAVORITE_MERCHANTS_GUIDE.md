# Smart Favorite Merchants Feature - User Guide

## 🎯 What It Does

The **Smart Favorite Merchants** system allows elderly users to quickly access frequently paid bills without typing merchant names. It shows historical payment data and warns if amounts are unusual.

## ✨ Key Features

### 1. **Quick Access to Frequent Bills**
- Favorite merchants appear on ATM home screen
- One-click to open scanner with merchant pre-loaded
- Shows last 3 payment amounts + average

### 2. **Smart Amount Validation**
- Compares scanned amount to your payment history
- Warns if bill is 50%+ higher/lower than usual
- Helps prevent overpayment fraud

### 3. **Automatic Merchant Detection**
- Bills auto-categorized with appropriate icons
- Electricity (⚡), Water (💧), Telco (📱), Shopping (🛒)

### 4. **Easy Management**
- Select up to 6 favorite merchants
- Based on your actual payment frequency
- One-click to add/remove favorites

---

## 🚀 How to Use

### **Step 1: Build Payment History**
1. Pay a few bills using the bill scanner
2. System automatically tracks: merchant name, amount, date
3. Need at least 1 payment per merchant to add as favorite

### **Step 2: Add Favorites**
1. Go to ATM home screen
2. Click "Manage" button (appears after you have payment history)
3. Select frequently paid merchants (max 6)
4. Click "Save Favorites"

### **Step 3: Use Quick Access**
1. On home screen, see "Your Favorite Bills" section
2. Each card shows:
   - Merchant name with icon
   - Last payment amount
   - Average payment amount
   - Document type (Bill/Receipt)
3. Click any favorite → Opens scanner with context loaded

### **Step 4: Scan with Context**
1. Scanner shows blue banner with your payment history
2. Displays last 3 amounts + usual average
3. Scan your current bill as normal
4. If amount is very different (50%+ deviation):
   - ⚠️ **Warning displayed**: "UNUSUAL AMOUNT DETECTED"
   - Shows: Scanned vs Average
   - Asks you to verify before proceeding

---

## 📊 Example Usage Flow

```
User: *Opens ATM home screen*
Screen: Shows "Your Favorite Bills" with:
  ┌─────────────────────────┐
  │ ⚡ SP Services          │
  │ Last: S$66.20           │
  │ Avg: S$65.57            │
  │ Electricity Bill        │
  └─────────────────────────┘

User: *Clicks "SP Services"*
Scanner: Opens with banner:
  "Paying SP Services
   Last 3 payments: S$66.20 | S$58.40 | S$72.10
   Usual Amount: S$65.57"

User: *Scans bill showing S$180.00*
Scanner: 🚨 WARNING!
  "UNUSUAL AMOUNT DETECTED!
   This SP Services bill is HIGHER than usual.
   Scanned: S$180.00 | Your Average: S$65.57
   Please verify this is correct before proceeding."

User: *Checks physical bill, realizes mistake*
User: *Clicks "Rescan" to try again*
```

---

## 🧪 Testing the Feature

### **Quick Test Setup:**
1. Open: `http://localhost:3000/test-favorite-merchants.html`
2. Click "Seed Receipt History" (creates 8 sample payments)
3. Click "Go to ATM Home"
4. On home screen, click "Manage" → Select merchants → Save
5. Favorite cards now appear!
6. Click any favorite → Opens scanner with history

### **What Gets Seeded:**
- 3× SP Services bills ($66.20, $58.40, $72.10)
- 2× StarHub bills ($89.90, $92.50)
- 2× NTUC receipts ($42.50, $38.20)
- 1× PUB Water bill ($28.60)

---

## 🔧 Technical Implementation

### **Storage:**
- `localStorage.favoriteMerchants`: Array of {name, docType, addedAt}
- `localStorage.receiptHistory`: Payment history (last 20)
- `sessionStorage.favoriteMerchantContext`: Current favorite context

### **Files Modified:**
1. **home.html** - Added favorite bills section
2. **home.js** - Favorite management logic (275 lines)
3. **bill-scanner.html** - Context banner + deviation check (130 lines)

### **Key Functions:**
- `loadFavoriteMerchants()` - Display favorites on home
- `showManageFavoritesDialog()` - Modal to select merchants
- `getMerchantHistory()` - Calculate last 3 + average
- `checkFavoriteMerchantDeviation()` - Validate scanned amount

---

## 💡 Benefits for Elderly Users

✅ **Less Typing** - No need to manually enter merchant names  
✅ **Confidence** - See typical amounts before paying  
✅ **Fraud Protection** - Warns if bill looks suspicious  
✅ **Big, Clear UI** - Large cards with icons and colors  
✅ **Learning System** - More payments = better accuracy  

---

## 📝 Example Scenarios

### Scenario 1: Regular Bill Payment
- User pays SP Services every month (~$65)
- Adds SP Services as favorite
- Next month: Clicks favorite → Scans $68.50 → No warning (normal range)

### Scenario 2: Unusual Amount
- User typically pays StarHub $90/month
- Scans bill showing $450
- System warns: "Unusually high! Your avg: $90"
- User realizes it's a mistake/fraud attempt

### Scenario 3: First-Time Favorite
- User adds NTUC as favorite (paid twice: $42, $38)
- Clicks NTUC favorite
- Scanner shows: "Last: $42.50 | Avg: $40.35"
- Helps user know what to expect

---

## 🎨 UI Elements

### Home Screen:
```
┌─────────────────────────────────────┐
│ ⭐ Your Favorite Bills              │
│                            [Manage] │
├─────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐ │
│ │⚡ SP   │  │📱StarHub│  │🛒 NTUC │ │
│ │Services│  │        │  │FairPrice│ │
│ │Last:$66│  │Last:$90│  │Last:$42│ │
│ │Avg:$65 │  │Avg:$91 │  │Avg:$40 │ │
│ └────────┘  └────────┘  └────────┘ │
└─────────────────────────────────────┘
```

### Scanner Context Banner:
```
┌──────────────────────────────────────────┐
│ ⚡ Paying SP Services                    │
│ Your typical payment history:            │
│ ┌──────┐  ┌──────┐  ┌──────┐           │
│ │ Last │  │2nd   │  │3rd   │           │
│ │$66.20│  │$58.40│  │$72.10│           │
│ └──────┘  └──────┘  └──────┘           │
│ ┌────────────────────────────┐          │
│ │ Usual Amount: S$65.57      │          │
│ └────────────────────────────┘          │
│ ⚠️ If scanned amount differs greatly,   │
│    we'll warn you!                      │
└──────────────────────────────────────────┘
```

---

## 🔒 Privacy & Data

- All data stored locally (localStorage)
- No server transmission of favorite merchants
- User can clear all data anytime
- Automatically maintains last 50 scans

---

## ⚙️ Configuration

### Deviation Threshold:
Currently set to **50%** difference triggers warning.
To adjust, modify in `bill-scanner.html`:
```javascript
if (deviationPercent > 50) {  // Change this value
  // Show warning
}
```

### Max Favorites:
Currently **6 favorites** maximum.
To adjust, modify in `home.js`:
```javascript
if (selected.length > 6) {  // Change this value
  alert('Please select a maximum of 6 favorites');
}
```

---

## 🐛 Troubleshooting

**Q: Favorite section not showing?**
- A: Need at least 1 payment in history first. Pay a bill, then return to home.

**Q: "Manage" button missing?**
- A: Button only appears after favorites section is visible (after adding first favorite).

**Q: Deviation warning not showing?**
- A: Need 3+ payments to same merchant for reliable average. Or amount isn't 50%+ different.

**Q: Wrong merchant matched?**
- A: Provider detection is fuzzy. System matches if provider name contains favorite name.

---

## 🎓 For Developers

### Adding New Provider Icons:
Edit `getProviderIcon()` in `home.js`:
```javascript
if (name.includes('your_merchant')) return 'your_icon';
```

### Changing History Display Count:
Modify `getMerchantHistory()`:
```javascript
.slice(0, 3)  // Change to show more/fewer amounts
```

### Custom Deviation Messages:
Edit `checkFavoriteMerchantDeviation()` in `bill-scanner.html`:
```javascript
let message = `Your custom message here`;
```

---

**Feature Status:** ✅ Fully Implemented & Tested  
**Files:** 4 modified, 2 created  
**Lines of Code:** ~500 total  
**Compatibility:** Works with existing ATM system, no breaking changes
