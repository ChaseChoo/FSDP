# Guardian QR Code Feature - Assisted Transactions

## Overview
This feature allows a guardian (e.g., a son) to pre-configure banking transactions and generate QR codes that can be scanned at an ATM to automatically execute those transactions. This is particularly useful for helping elderly users or anyone who has difficulty operating ATMs.

## How It Works

### For Guardians (Creating QR Codes)

1. **Login to Your Account**
   - Navigate to `/login.html` and login with your account
   - Or use QR login via mobile authentication

2. **Create Guardian QR Code**
   - Navigate to `/guardian-qr-create.html`
   - Select the action type:
     - **Withdraw Money**: Pre-configure a withdrawal amount
     - **Deposit Money**: Pre-configure a deposit amount  
     - **Check Balance**: Allow viewing account balance
   
3. **Configure the Action**
   - Enter the amount (for withdrawals/deposits/transfers)
   - For transfers: Enter recipient account number or phone
   - Add an optional description
   - Set maximum uses (1, 3, 5, or 10 times)
   - Set expiry period (1, 3, 7, 14, or 30 days)
   - **Fraud Protection**: Transfers over $300 trigger fraud detection warning

4. **Generate QR Code**
   - Click "Generate QR Code"
   - The system creates a unique pre-configured action
   - QR code is displayed with action summary
   - You can:
     - Print the QR code
     - Save it as an image
     - Show it directly on your phone

### For Users (Using QR Codes at ATM)

1. **Access ATM Interface**
   - Navigate to `/assisted-qr-login.html`
   - This simulates the ATM interface

2. **Scan QR Code**
   - Click "Start Scanning"
   - Point camera at the guardian QR code
   - The system automatically validates the QR code

3. **Review Transaction**
   - See the pre-configured action details:
     - Guardian name
     - Action type
     - Amount (if applicable)
     - Description
   
4. **Confirm Transaction**
   - Click "Confirm" to execute the transaction
   - The system automatically:
     - Logs in to the guardian's account
     - Executes the pre-configured action
     - Updates the balance
     - Records the transaction

5. **View Results**
   - Success screen shows:
     - Confirmation message
     - New account balance
     - Transaction details

## API Endpoints

### Create Pre-configured Action
```
POST /api/guardian/create-action-qr
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionType": "WITHDRAW",
  "amount": 100,
  "description": "Weekly allowance",
  "maxUses": 1,
  "expiryDays": 7
}
```

### Validate Action
```
GET /api/guardian/validate-action/:actionId
```

### Execute Pre-configured Action
```
POST /api/guardian/execute-action
Content-Type: application/json

{
  "actionId": "<action-id-from-qr>"
}
```

### Get Guardian's Actions
```
GET /api/guardian/my-actions
Authorization: Bearer <token>
```

### Delete Action
```
DELETE /api/guardian/action/:actionId
Authorization: Bearer <token>
```

## QR Code Format

The QR code contains a JSON payload:
```json
{
  "type": "ASSISTED_TRANSACTION",
  "actionId": "<unique-action-id>",
  "version": "1.0"
}
```

## Security Features

1. **Action Expiry**: QR codes automatically expire after the set period
2. **Usage Limits**: Can set maximum number of uses (prevents unlimited use)
3. **Action Validation**: Each scan validates the QR code before execution
4. **Guardian Verification**: Actions are linked to guardian's account
5. **Short-lived Sessions**: ATM sessions are limited to 1 hour
6. **Fraud Detection**: Transfers over $300 are flagged and logged for security monitoring
7. **Real-time Alerts**: Fraud warnings shown to both guardian (during creation) and user (during execution)

## Use Cases

### Example 1: Weekly Allowance
- Guardian creates QR code for $100 withdrawal
- Sets it to expire in 7 days
- Allows single use
- Parent gives QR to elderly parent
- Parent scans at ATM and gets $100 automatically

### Example 2: Regular Deposits
- Guardian creates QR code for $50 deposit
- Allows up to 10 uses
- Expires in 30 days
- Can be used multiple times for regular deposits

### Example 3: Safe Transfer with Fraud Detection
- Guardian creates transfer QR code for $350
- System warns: "Transfers over $300 trigger fraud detection"
- Guardian confirms and generates QR
- When scanned at ATM, shows fraud alert
- Transaction executes but is logged for security review
- Both guardian and security team are notified

## Files Created

### Backend
- `models/preConfiguredActionModel.js` - Data model for pre-configured actions
- `controllers/guardianQRController.js` - Controller for guardian QR operations
- `routes/guardianQRRoutes.js` - API routes
- Updated `server.js` - Registered new routes
- Updated `controllers/accountController.js` - Exported helper functions

### Frontend
- `public/guardian-qr-create.html` - Guardian interface to create QR codes
- `public/assisted-qr-login.html` - ATM interface to scan and execute

## Testing the Feature

### Setup
1. Ensure the server is running: `npm start`
2. Make sure `DEV_ALLOW_ALL=true` in your `.env` file

### Test Flow
1. Login at `/qr-login.html` using card number `5555444433332222`
2. Navigate to `/guardian-qr-create.html`
3. Create a withdrawal for $50
4. Open `/assisted-qr-login.html` in a new window/tab
5. Use your phone or another device to scan the generated QR code
6. Confirm the transaction
7. Verify the balance update

## Future Enhancements

Potential improvements:
- Add transfer functionality to pre-approved recipients
- Push notifications when QR code is used
- Usage history and analytics
- Multiple language support
- Voice guidance for accessibility
- Biometric confirmation at ATM
- SMS alerts for each transaction
- Scheduled QR codes (active only during certain times)
