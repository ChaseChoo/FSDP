# 🚀 QUICK START - Bank Appointment Feature (5 Minutes)

## Step 1️⃣ Start the Server (30 seconds)
Open PowerShell and run:
```powershell
cd "c:\Users\fangy\OneDrive - Ngee Ann Polytechnic\Desktop\materials\y2 sem2\FSDP\FSDP"
npm start
```
✅ Server should say: `Server listening on port 3000`

---

## Step 2️⃣ Start ngrok for Mobile (30 seconds)
Open a **NEW** PowerShell window and run:
```powershell
cd "c:\Users\fangy\OneDrive - Ngee Ann Polytechnic\Desktop\materials\y2 sem2\FSDP\FSDP"
ngrok http 3000
```

✅ You'll see something like:
```
https://abc123def456.ngrok.io
```
💾 **Copy this URL** (you'll need it for mobile)

---

## Step 3️⃣ Test on Desktop (1 minute)
Open your browser and visit:
```
http://localhost:3000/bank-appointment
```

**Do this:**
1. Type "bukit timah" in the location box
2. Click on a bank
3. Pick today's date
4. Select a time slot (e.g., 2:00 PM)
5. Click "Book Appointment"

✅ Should show a confirmation page!

---

## Step 4️⃣ Test on Mobile (2 minutes)

### Option A: Same WiFi (Fastest)
Get your PC's IP:
```powershell
ipconfig
```
Find "IPv4 Address" (example: `192.168.1.100`)

On your phone, open:
```
http://192.168.1.100:3000/bank-appointment
```

### Option B: Different Network (Using ngrok)
From Step 2, use the ngrok URL:
```
https://abc123def456.ngrok.io/bank-appointment
```

---

## 🎉 That's It!

Your bank appointment booking system is now working on:
- ✅ Desktop
- ✅ Mobile (Local WiFi)
- ✅ Mobile (Remote via ngrok)

---

## 📱 Mobile Testing Checklist

- [ ] Page loads
- [ ] Can search "bukit timah"
- [ ] Can select a bank
- [ ] Can pick a date
- [ ] Can choose time slot
- [ ] Can click "Book Appointment"
- [ ] Confirmation page appears
- [ ] Can click "Share via WhatsApp"

---

## 🎯 Available Test Locations

Try these in the location search:
- **bukit timah** (2 branches)
- **orchard** (1 branch)
- **marina** (1 branch)

---

## 🆘 If Something Doesn't Work

1. **Server not starting?**
   - Make sure you're in the FSDP folder
   - Try: `node controllers/server.js`

2. **ngrok not working?**
   - Restart ngrok
   - Get new URL

3. **Can't access on mobile?**
   - Try the ngrok URL instead
   - Make sure both on same WiFi for IP method

4. **Confirmation page blank?**
   - Refresh the page
   - Check browser console (F12)

---

## 📚 Need More Help?

- **Setup Guide:** `BANK_APPOINTMENT_GUIDE.md`
- **Testing Guide:** `MOBILE_TESTING_GUIDE.md`
- **Quick Reference:** `BANK_APPOINTMENT_QUICK_REFERENCE.md`
- **Full Summary:** `IMPLEMENTATION_SUMMARY.md`

---

## 🎨 What You're Testing

### Booking Page Features:
- 🔍 Search by location
- 🏦 Select from multiple banks
- 📅 Date picker
- ⏰ Time slots
- 📝 Live summary
- 💾 Save to database

### Confirmation Page Features:
- ✓ Show all booking details
- 📍 Bank location info
- 📌 Booking reference number
- 📤 Share on WhatsApp
- 📅 Add to calendar link
- 🎨 Email-style design

---

## 🔧 API Endpoints You Can Test

```powershell
# Book appointment
$body = @{
    bankId = "ocbc_bt_001"
    bankName = "OCBC Bukit Timah Branch"
    bankAddress = "1 Jalan Anak Bukit, Singapore"
    appointmentDate = "2026-02-05"
    appointmentTime = "14:00"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/book" `
  -Method Post -Body $body -ContentType "application/json"
```

---

## 💡 Pro Tips

- **First time ngrok setup?** 
  - Go to https://ngrok.com/signup
  - Get auth token
  - Run: `ngrok config add-authtoken YOUR_TOKEN`

- **Want to change bank locations?**
  - Edit `public/bank-appointment.html`
  - Find the `ocbcBanks` object

- **Want to change time slots?**
  - Edit `appointmentController.js`
  - Modify the time loop

- **Keeping ngrok URL same?**
  - Upgrade to ngrok Pro
  - Use static domain feature

---

## ✨ Success Indicators

You'll know it's working when you see:

✅ Booking page loads with beautiful purple gradient
✅ Search works and shows banks
✅ Confirmation page appears after booking
✅ Bank details display correctly
✅ Mobile version is responsive (no horizontal scroll)
✅ Can access from different devices/networks

---

## 🎯 Next Time You Open This Project

Just run these 2 commands:

**Terminal 1:**
```powershell
npm start
```

**Terminal 2:**
```powershell
ngrok http 3000
```

Then:
- Desktop: `http://localhost:3000/bank-appointment`
- Mobile: Use ngrok URL from Terminal 2

---

## 📞 Quick Support

| Issue | Quick Fix |
|-------|-----------|
| 404 error | Restart server |
| Server won't start | Check Node.js: `node --version` |
| ngrok URL invalid | Restart ngrok, get new URL |
| Can't reach from phone | Use ngrok instead of IP |
| Database error | Check .env file settings |

---

**You're all set! Enjoy your bank appointment booking system! 🚀**

