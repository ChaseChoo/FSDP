# 🎨 Impersonation Guard - Visual User Guide

## Feature Overview

**Impersonation Guard™** is your ATM's built-in protection against phone scams. When someone tries to trick you during a transaction, the system detects suspicious phrases and locks the transaction for your safety.

---

## 🖥️ What You'll See

### 1. PayNow Transfer Page (Before Enabling)

```
┌──────────────────────────────────────────────────────────────────┐
│  EasyATM — PayNow                                    [← Back]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PayNow Method: [Mobile Number ▼]                               │
│  Recipient: [_________________]  (e.g., 91234567)               │
│  Amount (SGD): [_________________]                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎤 Monitoring Inactive              [Enable Protection] │   │
│  │ Impersonation Guard™ protects you from phone scams      │   │
│  │ 🛡️ Listens for scam keywords like "urgent", "police"   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Clear]  [Continue]                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Status**: Feature available but not active

---

### 2. After Clicking "Enable Protection"

```
┌──────────────────────────────────────────────────────────────────┐
│  🔔 Browser popup:                                               │
│  "localhost wants to use your microphone"                        │
│  [Block]  [Allow] ← Click "Allow"                               │
└──────────────────────────────────────────────────────────────────┘
```

**Status**: Requesting microphone permission

---

### 3. PayNow Page (Protection Active)

```
┌──────────────────────────────────────────────────────────────────┐
│  EasyATM — PayNow                                    [← Back]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PayNow Method: [Mobile Number ▼]                               │
│  Recipient: [91234567________]                                   │
│  Amount (SGD): [100__________]                                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎤 Active - Listening for Scams   [Disable Protection] │   │
│  │ Impersonation Guard™ protects you from phone scams      │   │
│  │ 🛡️ Listens for scam keywords like "urgent", "police"   │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↑ GREEN BACKGROUND                                           │
│                                                                   │
│  [Clear]  [Continue]                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Status**: ✅ System is now protecting you!

---

### 4. When Scam Detected (Alert Modal)

```
┌════════════════════════════════════════════════════════════════════┐
║                                                                    ║
║                            🚨                                      ║
║                                                                    ║
║                    ⚠️ SECURITY ALERT                              ║
║                                                                    ║
║            Suspicious conversation detected!                       ║
║      We heard phrases commonly used in scams:                      ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ 🔴 "this is your bank"                                   │    ║
║  │ 🔴 "do this immediately"                                 │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ ⚠️ Important Security Reminders:                         │    ║
║  │ • Banks NEVER ask for transfers via phone calls          │    ║
║  │ • Police DON'T collect fines through ATMs                │    ║
║  │ • Government agencies DON'T demand immediate payments    │    ║
║  │ • NOBODY should pressure you to transfer money urgently  │    ║
║  │ • If you're on a call with someone claiming to be        │    ║
║  │   official, HANG UP and call the organization directly   │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                    ║
║  To proceed with this transaction, you must verify your           ║
║  identity by entering your 6-digit card PIN.                      ║
║                                                                    ║
║               Enter 6-digit PIN:                                   ║
║              [● ● ● ● ● ●]                                        ║
║                                                                    ║
║  ┌───────────────────────┐  ┌──────────────────────┐            ║
║  │ Verify PIN & Continue │  │ Cancel Transaction   │            ║
║  │      (GREEN)          │  │      (RED)           │            ║
║  └───────────────────────┘  └──────────────────────┘            ║
║                                                                    ║
║  Need help? Contact bank security: 1800-BANK-HELP                 ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**Status**: 🚨 Transaction LOCKED - Awaiting PIN verification

---

### 5. After Entering Correct PIN

```
┌──────────────────────────────────────────────────────────────────┐
│  ✅ Modal closes automatically                                   │
│                                                                   │
│  You're returned to the PayNow page:                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎤 Active - Listening for Scams   [Disable Protection] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Transaction unlocked - You can continue                         │
└──────────────────────────────────────────────────────────────────┘
```

**Status**: ✅ Unlocked - Transaction can proceed

---

### 6. After Entering Wrong PIN

```
┌════════════════════════════════════════════════════════════════════┐
║                    ⚠️ SECURITY ALERT                              ║
║                                                                    ║
║              [Previous content...]                                 ║
║                                                                    ║
║               Enter 6-digit PIN:                                   ║
║              [______]                                              ║
║              ❌ Incorrect PIN. Please try again.                  ║
║                 ↑ RED ERROR MESSAGE                                ║
║                                                                    ║
║  [Verify PIN & Continue]  [Cancel Transaction]                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**Status**: ❌ Invalid PIN - Try again or cancel

---

### 7. After Clicking "Cancel Transaction"

```
┌──────────────────────────────────────────────────────────────────┐
│  JavaScript Alert:                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Transaction cancelled for your safety. If you believe   │ │
│  │    this is a scam, please report it to your bank           │ │
│  │    immediately.                                             │ │
│  │                                                             │ │
│  │                          [OK]                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  → Redirects back to PayNow page (form cleared)                 │
└──────────────────────────────────────────────────────────────────┘
```

**Status**: ❌ Transaction cancelled for safety

---

## 🎬 Step-by-Step User Journey

### Normal Transaction Flow (No Scam):

```
1. Open PayNow page
   ↓
2. Click "Enable Protection"
   ↓
3. Allow microphone access
   ↓
4. Fill in recipient & amount
   ↓
5. Click "Continue"
   ↓
6. Complete transaction normally
```

**Time**: ~30 seconds  
**Outcome**: ✅ Transaction successful

---

### Scam Detected Flow:

```
1. Open PayNow page
   ↓
2. Enable Protection (microphone listening)
   ↓
3. Start filling transaction details
   ↓
4. Someone on phone says: "This is your bank"
   ↓
5. 🚨 ALERT! System detects scam phrase
   ↓
6. Transaction LOCKED
   ↓
7. Security modal appears
   ↓
8. User has 2 choices:
   ├─ A) Enter PIN → Unlock → Continue
   └─ B) Cancel → Safe exit
```

**Time**: Alert triggers in <1 second  
**Outcome**: 🛡️ User protected from scam

---

## 🎯 Common Scenarios

### Scenario 1: "Tech Support" Scam
```
📞 Scammer: "This is your bank's technical support. 
             Your account will be locked. Transfer 
             money immediately to secure it."

🎤 System hears: "this is your bank" + "account will be locked" 
                 + "immediately"

🚨 System triggers: SECURITY ALERT
                    Transaction LOCKED
                    PIN required

✅ User protected: Reads warning, realizes it's a scam, cancels
```

---

### Scenario 2: "Police Officer" Scam
```
📞 Scammer: "I'm calling from the police. You have 
             unpaid fines. Pay $500 through ATM 
             right now or you'll be arrested."

🎤 System hears: "police" + "pay" + "right now" + "arrested"

🚨 System triggers: SECURITY ALERT
                    Shows: "Police DON'T collect fines via ATM"

✅ User protected: Realizes police don't work this way, hangs up
```

---

### Scenario 3: False Alarm (Legitimate Use)
```
📞 Friend: "Hey, can you transfer me $50? I'll pay 
            you back next week."

🎤 System hears: (normal conversation, no scam keywords)

✅ System: No alert triggered
           Transaction proceeds normally

✅ Outcome: No interference with legitimate transfers
```

---

## 🎨 Color Coding Guide

### Status Indicators:

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 **Green** | Active | System protecting you |
| ⚪ **Gray** | Inactive | Protection not enabled |
| 🔴 **Red** | Locked | Transaction blocked |
| 🟡 **Yellow** | Permission | Requesting access |

### Buttons:

| Color | Button | Action |
|-------|--------|--------|
| 🟢 **Green** | "Enable Protection" | Turn on monitoring |
| 🟢 **Green** | "Verify PIN & Continue" | Unlock transaction |
| 🔴 **Red** | "Disable Protection" | Turn off monitoring |
| 🔴 **Red** | "Cancel Transaction" | Exit safely |
| ⚪ **White** | "Clear" | Reset form |
| 🔵 **Blue** | "Continue" | Proceed to confirmation |

---

## 🔊 Audio Cues

### Alert Sound:
```
BEEP (800 Hz, 0.3s)
pause (0.1s)
BEEP (800 Hz, 0.3s)
```
**Trigger**: When scam keyword detected  
**Volume**: Medium (30%)  
**Purpose**: Immediate attention to security alert

---

## 📱 Mobile/Touch Support

Works on:
- ✅ Touch screens
- ✅ Mobile browsers (Chrome/Safari)
- ✅ Tablets
- ✅ Desktop ATM touch interfaces

**Note**: Requires device with microphone

---

## 🌍 Accessibility

### For Visually Impaired:
- 🔊 Alert sound notification
- 📢 Screen reader compatible
- 🎯 High contrast colors
- 📝 Clear text labels

### For Hearing Impaired:
- 👀 Visual alert modal
- 🚨 Flashing indicators
- 📄 Written security warnings

### For Elderly Users:
- 📏 Large text (16-28px)
- 🎨 Clear color coding
- 📝 Simple language
- 🕐 No time pressure

---

## 💡 Tips for Users

### ✅ DO:
- Enable protection when making transfers
- Read security warnings carefully
- Hang up suspicious calls
- Contact bank directly if unsure
- Report scam attempts

### ❌ DON'T:
- Ignore security alerts
- Share your PIN on phone
- Rush through warnings
- Disable protection during calls
- Proceed if feeling pressured

---

## 🏆 Why This Feature Matters

### Real Statistics:
- 💰 $13M lost to phone scams in 2025 (Singapore)
- 📈 35% increase in ATM-related fraud
- 👥 Elderly users most vulnerable
- 🎭 Scammers getting more sophisticated

### How This Helps:
- 🛡️ Real-time protection at transaction point
- 📚 Educates users about scam tactics
- 🔒 Prevents unauthorized transactions
- 📊 Builds user confidence
- 🏦 Reduces bank fraud losses

---

## 📞 Need Help?

### During Transaction:
- Click "Cancel Transaction" (red button)
- Call bank hotline: **1800-BANK-HELP**
- Report to nearby bank staff

### After Transaction:
- Check transaction history
- Contact customer support
- File police report if scammed
- Request transaction reversal

---

## ✨ Remember

**Impersonation Guard is YOUR security assistant.**

- 🎤 It listens for danger
- 🚨 It alerts you instantly
- 🔒 It protects your money
- 📚 It teaches you safety
- 🛡️ It's always on your side

**Stay safe, stay protected!** ✅

---

**Quick Reference Card**:
```
┌─────────────────────────────────────┐
│ IMPERSONATION GUARD™                │
│ Quick Reference                     │
├─────────────────────────────────────┤
│ Enable: Click green button          │
│ Status: Check color indicator       │
│ Alert: Read warnings carefully      │
│ Unlock: Enter your 6-digit PIN      │
│ Cancel: Click red button            │
│ Help: Call 1800-BANK-HELP          │
└─────────────────────────────────────┘
```
