# 🧪 Impersonation Guard - Testing Guide

## Quick Start Testing

### Prerequisites
1. Server running (`node server.js`)
2. Browser: Chrome, Edge, or Safari
3. Microphone available
4. DEV_ALLOW_ALL=true in .env file

---

## Test Case 1: Basic Feature Activation

### Steps:
1. Navigate to `http://localhost:3000/card-login.html`
2. Login with demo card:
   - Card: `5555444433332222`
   - PIN: Any 6 digits (e.g., `123456`)
3. Click "PayNow Transfer"
4. Look for green "Impersonation Guard™" panel above the form
5. Click **"Enable Protection"** button
6. Allow microphone access when prompted
7. Verify status changes to "🎤 Active - Listening for Scams" (green background)

**Expected Result**: ✅ Status indicator shows active monitoring

---

## Test Case 2: Suspicious Phrase Detection - Bank Impersonation

### Steps:
1. Enable Impersonation Guard (as above)
2. Speak clearly into microphone: **"This is your bank"**
3. Wait 1-2 seconds

**Expected Result**: 
- 🚨 Alert sound plays (beep beep)
- Full-screen security modal appears
- Modal shows detected phrase: "this is your bank"
- Security warnings displayed
- PIN input field visible
- "Verify PIN & Continue" and "Cancel Transaction" buttons present

---

## Test Case 3: PIN Verification - Success

### Steps:
1. Trigger security alert (Test Case 2)
2. In PIN input field, enter: **123456**
3. Click **"Verify PIN & Continue"**

**Expected Result**:
- ✅ "Verifying..." shown briefly
- Modal closes automatically
- Transaction unlocked
- Can proceed with transaction normally
- Console shows: `[ImpersonationGuard] ✅ Transaction unlocked via PIN verification`

---

## Test Case 4: PIN Verification - Invalid PIN

### Steps:
1. Trigger security alert
2. Enter invalid PIN (e.g., only 4 digits): **1234**
3. Click "Verify PIN & Continue"

**Expected Result**:
- ❌ Error message: "PIN must be exactly 6 digits"
- PIN field clears
- Focus returns to PIN input
- Modal remains open

---

## Test Case 5: Transaction Cancellation

### Steps:
1. Trigger security alert
2. Click **"Cancel Transaction"** button (red button)

**Expected Result**:
- Alert shows: "Transaction cancelled for your safety..."
- Modal closes
- Redirects back to paynow.html
- Form data cleared
- Status: "🎤 Monitoring Inactive"

---

## Test Case 6: Multiple Keyword Detection

### Test Phrases:
Speak each phrase and verify detection:

| Phrase | Should Trigger? | Category |
|--------|----------------|----------|
| "Do this immediately" | ✅ Yes | Urgency |
| "Your account will be locked" | ✅ Yes | Threat |
| "I'm from the police" | ✅ Yes | Impersonation |
| "Give me your pin" | ✅ Yes | Credential Request |
| "Transfer the money" | ✅ Yes | Payment Demand |
| "You will be arrested" | ✅ Yes | Intimidation |
| "Tax refund" | ✅ Yes | Common Scam |
| "Hello how are you" | ❌ No | Normal Speech |
| "I need to pay my bills" | ❌ No | Legitimate Use |

---

## Test Case 7: Continuous Monitoring

### Steps:
1. Enable Impersonation Guard
2. Speak normal phrases for 30 seconds
3. Then speak: **"Don't tell anyone"**
4. Verify alert triggers

**Expected Result**: System continues monitoring throughout session

---

## Test Case 8: Disable Protection

### Steps:
1. Enable Impersonation Guard
2. Click **"Disable Protection"** button (now red)
3. Speak suspicious phrase: "This is your bank"

**Expected Result**:
- Status shows "🎤 Monitoring Inactive"
- No alert triggered
- Button text: "Enable Protection" (green)

---

## Test Case 9: Transaction Lock State

### Steps:
1. Enable Impersonation Guard
2. Fill in transaction details:
   - Recipient: `91234567`
   - Amount: `100`
3. Speak: **"This is the police"**
4. Close the PIN modal (without verifying)
5. Try to click "Continue" on the form

**Expected Result**:
- Alert: "⚠️ Transaction is locked due to suspicious activity..."
- Form submission blocked
- Cannot proceed without PIN verification

---

## Test Case 10: Browser Compatibility

### Test on each browser:
- ✅ **Chrome**: Should work fully
- ✅ **Edge**: Should work fully
- ✅ **Safari**: Should work fully (iOS 14.1+)
- ❌ **Firefox**: Should show error message

**Expected Firefox Behavior**: Alert saying "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."

---

## Test Case 11: Microphone Permission Denial

### Steps:
1. Block microphone in browser settings
2. Click "Enable Protection"

**Expected Result**:
- Status shows "🎤 Permission Denied" (red)
- Alert: "Microphone permission denied. Impersonation Guard requires microphone access..."
- Instructions to enable in browser settings

---

## Test Case 12: Backend PIN Verification (Production Mode)

### Setup:
1. Set `DEV_ALLOW_ALL=false` in .env
2. Restart server
3. Login with real card/PIN from database

### Steps:
1. Enable Impersonation Guard
2. Trigger alert
3. Enter actual card PIN
4. Click "Verify PIN & Continue"

**Expected Result**:
- Backend validates against database
- Correct PIN: Unlocks transaction
- Incorrect PIN: Shows error "Incorrect PIN"
- Transaction logged in CardTransactions table

---

## Console Debug Commands

Open browser console and try:

```javascript
// Check if module loaded
window.ImpersonationGuard

// Get current status
window.ImpersonationGuard.getStatus()

// Check if transaction locked
window.ImpersonationGuard.isLocked()

// Manual start monitoring
window.ImpersonationGuard.startMonitoring()

// Manual stop monitoring
window.ImpersonationGuard.stopMonitoring()
```

---

## Common Issues & Solutions

### Issue: No detection happening
**Solutions**:
- Check microphone is unmuted
- Speak louder and clearer
- Check browser console for errors
- Verify microphone input in OS settings

### Issue: Too many false positives
**Solutions**:
- Review keyword list in impersonation-guard.js
- Remove overly common phrases
- Add more context to keyword matching

### Issue: "Authentication required" error during PIN verify
**Solutions**:
- Ensure you're logged in via card-login
- Check JWT token in localStorage
- Verify req.user in backend logs

---

## Performance Testing

### Test Metrics:
- **Detection Speed**: Say phrase → Alert should appear in <1 second
- **PIN Verification**: Click verify → Response in <2 seconds
- **Memory Usage**: Check browser task manager, should be <50MB
- **Audio Latency**: No noticeable lag in detection

---

## Security Testing

### Test Attack Scenarios:

1. **Scenario: Phone scam while at ATM**
   - Play audio recording of scammer through speaker
   - System should detect and lock

2. **Scenario: In-person coercion**
   - Have someone stand nearby saying suspicious phrases
   - System should detect ambient speech

3. **Scenario: Bypassing PIN verification**
   - Try to submit form while locked
   - Try to manipulate localStorage
   - Try invalid API requests
   - All should be blocked

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Existing fraud detection still works
- [ ] Safe Mode functionality intact
- [ ] PayNow form submission works normally
- [ ] Transaction history displays correctly
- [ ] Card login flow unaffected
- [ ] QR/Face login still functional
- [ ] No JavaScript console errors
- [ ] Mobile responsive design maintained

---

## Test Data

### Valid Test Inputs:
- Card Numbers: `5555444433332222`, `4444333322221111`
- PIN (dev mode): Any 6 digits
- Recipient: `91234567`, `98765432`
- Amount: `10`, `100`, `1000`

### Suspicious Phrases (Full List):
```
"don't tell anyone"
"do this immediately"
"your account will be locked"
"this is your bank"
"give me your pin"
"transfer the money"
"you will be arrested"
"tax refund"
"urgent"
"police officer"
```

---

## Automated Testing (Future)

Consider implementing:
- Selenium/Puppeteer for UI testing
- Mock audio input for keyword testing
- API endpoint testing with Jest/Mocha
- Load testing for PIN verification endpoint

---

**Testing Status**: Ready for QA ✅
**Last Updated**: January 7, 2026
