# 📱 Mobile Testing Guide - Bank Appointment Feature

## Quick Setup (3 Steps)

### Step 1: Start Your Local Server
```powershell
# In your FSDP project directory
npm start
# Or: node controllers/server.js
```

### Step 2: Start ngrok
```powershell
# PowerShell (recommended)
.\start-ngrok.ps1

# Or manually:
cd C:\ngrok
.\ngrok http 3000
```

### Step 3: Open on Mobile
Copy the ngrok URL from the terminal and open in your phone's browser:
```
https://abc123def456.ngrok.io/bank-appointment
```

---

## Testing Scenarios

### Test 1: Basic Booking Flow (5 minutes)
1. Open bank-appointment page
2. Search location: "bukit timah"
3. Select first bank
4. Pick today's date
5. Choose "14:00" time slot
6. Click "Book Appointment"
7. ✓ Should redirect to confirmation page

**Expected Result:** 
- See confirmation with booking details
- Reference number displayed
- Bank address and time shown

### Test 2: Location Search (3 minutes)
Try these locations:
- "bukit timah" → 2 banks
- "orchard" → 1 bank
- "marina" → 1 bank
- "invalid" → "No banks found" message

**Expected Result:**
- Correct banks display for each location
- Search is case-insensitive

### Test 3: Date Selection (2 minutes)
1. Open bank-appointment
2. Click date picker
3. Try past date → Should be disabled
4. Try today → Should be enabled
5. Try future date → Should be enabled

**Expected Result:**
- Past dates are grayed out
- Can only select today or future

### Test 4: Time Slot Selection (2 minutes)
1. Select a date
2. Time slots should appear (9:00, 9:30, 10:00, etc.)
3. Click different time slots
4. Selected slot should highlight in purple

**Expected Result:**
- 16 time slots appear (9 AM to 5 PM)
- Each is 30 minutes apart
- Can select/deselect slots

### Test 5: Responsive Design (3 minutes)
**Desktop:**
1. Open in browser (Full screen)
2. Check layout looks professional
3. Colors and fonts should be clear

**Mobile:**
1. Open same page on phone
2. Check text is readable
3. Buttons should be easy to tap
4. No horizontal scrolling needed

### Test 6: Confirmation Email Page (3 minutes)
After booking:
1. Check all details match what you selected
2. Click "Add to Calendar" button
3. Click "Share via WhatsApp" button
4. ✓ Should show instructions/open WhatsApp

**Expected Result:**
- Reference number format: `OCBC-APT-00001`
- WhatsApp message has appointment details
- Calendar instructions are clear

### Test 7: Form Reset (2 minutes)
1. Fill in all fields
2. Click "Reset" button
3. All fields should clear
4. "Book Appointment" button should be disabled

**Expected Result:**
- Location input is empty
- Date reverts to today
- Time slots not shown
- Summary section hidden

---

## Network Testing

### Test 1: Local Network Access
**Setup:**
1. Phone and PC on same WiFi
2. Get PC's IP: `ipconfig` in PowerShell → Look for "IPv4 Address"
3. Example: `192.168.1.100`

**Test:**
Open on phone: `http://192.168.1.100:3000/bank-appointment`

**Expected:**
- Page loads within 1-2 seconds
- Fully functional (same as desktop)

**Troubleshooting:**
- If doesn't work, check Windows Firewall:
  - Windows Defender Firewall → Inbound Rules
  - Allow Port 3000 for Node.js

### Test 2: ngrok Remote Access
**Setup:**
1. Start ngrok (see Quick Setup above)
2. Copy the HTTPS URL from ngrok terminal
3. Example: `https://abc123def456.ngrok.io`

**Test:**
Open on phone: `https://abc123def456.ngrok.io/bank-appointment`

**Expected:**
- Page loads (may take 2-3 seconds first time)
- "Your URL is powered by ngrok" banner appears
- All features work normally

**Troubleshooting:**
- If "ERR_NGROK_114": ngrok restarted, get new URL
- If timeout: Check if local server is running
- If "Cannot GET": Make sure server.js has appointment routes

### Test 3: Different Networks
**Test from:**
- Different WiFi network
- Mobile data (4G/5G)
- Another device on same WiFi

**Expected:**
All should work with ngrok URL

---

## API Testing

### Test with Postman or PowerShell

#### 1. Book Appointment
```powershell
$body = @{
    bankId = "ocbc_bt_001"
    bankName = "OCBC Bukit Timah Branch"
    bankAddress = "1 Jalan Anak Bukit, Singapore 588996"
    appointmentDate = "2026-02-01"
    appointmentTime = "14:00"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/book" -Method Post -Body $body -ContentType "application/json" -Verbose
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointmentId": 1,
  "appointment": { ... }
}
```

#### 2. Get Appointment Details
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/1" -Method Get
```

**Expected Response:**
```json
{
  "success": true,
  "appointment": {
    "id": 1,
    "bankName": "OCBC Bukit Timah Branch",
    "appointmentDate": "2026-02-01",
    "appointmentTime": "14:00",
    "status": "confirmed"
  }
}
```

#### 3. Get Available Time Slots
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/time-slots?date=2026-02-01" -Method Get
```

**Expected Response:**
- Array of 16 time slots
- Format: "09:00", "09:30", "10:00", etc.

#### 4. Cancel Appointment
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/1/cancel" -Method Put
```

**Expected Response:**
- Status changed to "cancelled"

---

## Browser Console Testing (F12)

Open Developer Tools (F12) on any page:

### Check for Errors
- Go to Console tab
- Look for red errors
- All should be green or yellow warnings

### Test Location Search
1. Go to bank-appointment
2. Open Console
3. Type: `locationInput.value = 'bukit timah'; searchBanks();`
4. Should show matching banks

### Test Bank Selection
1. In Console, type: `selectBank('ocbc_bt_001', 0)`
2. Should update the bank selection

---

## Performance Testing

### Load Time Test
Use ngrok on mobile:
1. Open DevTools (Browser Settings → Developer Options)
2. Open Network Tab
3. Load `/bank-appointment`
4. Check "DOMContentLoaded" time
   - Should be < 2 seconds (local)
   - Should be < 3 seconds (ngrok)

### Response Time Test
Check API response times:
1. Open Network tab
2. Book appointment
3. Check `/api/appointments/book` request
4. Response should be < 200ms

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Mobile can't reach localhost:3000 | Use ngrok instead or get PC IP |
| ngrok URL not working | Restart ngrok, make sure server is running |
| Page times out on mobile | Check internet connection, restart ngrok |
| Time slots not appearing | Select a date first |
| Cannot book appointment | Check browser console for errors |
| Confirmation page blank | Appointment ID missing from URL |
| Database errors | Check .env DB configuration |

---

## Automated Testing Script

```powershell
# Run this to test multiple bookings
function Test-MultipleBookings {
    param([int]$count = 5)
    
    $baseUrl = "http://localhost:3000/api/appointments/book"
    
    for ($i = 0; $i -lt $count; $i++) {
        $date = (Get-Date).AddDays($i).ToString('yyyy-MM-dd')
        $time = "14:00"
        
        $body = @{
            bankId = "ocbc_bt_001"
            bankName = "OCBC Bukit Timah Branch"
            bankAddress = "1 Jalan Anak Bukit, Singapore 588996"
            appointmentDate = $date
            appointmentTime = $time
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $body -ContentType "application/json"
        Write-Host "Booking $($i+1): Appointment ID = $($response.appointmentId)" -ForegroundColor Green
    }
}

# Run it
Test-MultipleBookings -count 5
```

---

## Checklist Before Going Live

- [ ] Bank appointment page loads on desktop
- [ ] Bank appointment page loads on mobile
- [ ] Can search locations
- [ ] Can select bank
- [ ] Can select date and time
- [ ] Can book appointment
- [ ] Confirmation page displays correctly
- [ ] WhatsApp share works
- [ ] Add to calendar gives instructions
- [ ] Reset button works
- [ ] API endpoints return correct data
- [ ] Database stores appointments
- [ ] Mobile network access works (ngrok)
- [ ] Local network access works (IP)
- [ ] No console errors
- [ ] No database errors

---

## Getting Help

If something doesn't work:

1. **Check Server Console**: Look for error messages
2. **Check Browser Console** (F12): Look for JavaScript errors
3. **Check ngrok Terminal**: Look for connection errors
4. **Restart Everything**: Stop server, stop ngrok, restart both
5. **Check Network**: Make sure internet is working
6. **Check Ports**: Port 3000 should be available

---

## Next Steps

- Add email notifications when appointment is booked
- Add SMS reminders
- Add appointment editing
- Add admin dashboard to manage bookings
- Add real bank locations from API
- Add Google Calendar integration

