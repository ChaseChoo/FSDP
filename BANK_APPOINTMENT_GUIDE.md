# Bank Appointment Booking Feature - Setup Guide

## 🎯 Features Overview

1. **Bank Appointment Booking Page** (`/bank-appointment.html`)
   - Search nearby OCBC banks by location
   - Select a bank from the list
   - Choose appointment date
   - Select time slot (30-minute intervals)
   - Real-time summary display
   - Responsive design for mobile

2. **Appointment Confirmation Page** (`/appointment-confirmation.html`)
   - Email-like design with appointment details
   - Location and bank information
   - Booking reference number
   - Pre-visit instructions
   - Add to calendar functionality
   - Share via WhatsApp

3. **Database Integration**
   - MSSQL database storage
   - User appointment history
   - Appointment management (create, read, update, cancel)

4. **Mobile Sync via ngrok**
   - Access your local app from anywhere
   - Dynamic IP handling
   - Mobile-responsive interface

---

## 📱 Accessing on Mobile with ngrok

### Option 1: Using ngrok with Dynamic IP (Recommended)

#### Step 1: Install ngrok
1. Download ngrok from: https://ngrok.com/download
2. Extract it to a folder (e.g., `C:\ngrok`)
3. Sign up for free account at https://ngrok.com/signup

#### Step 2: Authenticate ngrok
```powershell
# Get your authtoken from https://dashboard.ngrok.com/auth
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE

# Example:
ngrok config add-authtoken 2p8Zm4q1wX5vN8bK3mP7jL9oU
```

#### Step 3: Start your Express server
```powershell
# From your project directory
npm start
# Or if using node directly:
node controllers/server.js
```

#### Step 4: Start ngrok in a new PowerShell window
```powershell
# Navigate to ngrok folder and expose port 3000
cd C:\ngrok
./ngrok http 3000
```

#### Step 5: Access from Mobile
- ngrok will generate a public URL like: `https://abc123def456.ngrok.io`
- Open this URL on your phone's browser
- Start with: `https://abc123def456.ngrok.io/bank-appointment`

---

### Option 2: Using static Domain (ngrok Pro feature)

If you have ngrok Pro:
```powershell
./ngrok http 3000 --domain=your-custom-domain.ngrok.io
```

---

### Option 3: Using Windows PowerShell Alias (Optional)

Create a quick launcher script:

```powershell
# Create file: C:\ngrok\start-tunnel.ps1
param([int]$port = 3000)
.\ngrok http $port
```

Then run:
```powershell
powershell -File C:\ngrok\start-tunnel.ps1 3000
```

---

## 🚀 Quick Start Guide

### 1. **Desktop Access**
```
http://localhost:3000/bank-appointment
```

### 2. **Mobile Access (Local Network)**
Find your computer's IP:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

Then on mobile: `http://192.168.1.100:3000/bank-appointment`

### 3. **Mobile Access (Remote/ngrok)**
```
https://your-ngrok-url.ngrok.io/bank-appointment
```

---

## 🔧 Testing the Feature

### Test Booking Flow:
1. Go to bank appointment page
2. Enter location (try: "Bukit Timah", "Orchard", "Marina")
3. Select a bank
4. Pick a date
5. Choose time slot
6. Click "Book Appointment"
7. Should redirect to confirmation page with booking details

### Test API Endpoints:

```powershell
# Book appointment (from PowerShell)
$body = @{
    bankId = "ocbc_bt_001"
    bankName = "OCBC Bukit Timah Branch"
    bankAddress = "1 Jalan Anak Bukit, #01-01, Singapore 588996"
    appointmentDate = "2026-02-01"
    appointmentTime = "14:00"
    userId = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/book" -Method Post -Body $body -ContentType "application/json"

# Get appointment details
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/1" -Method Get

# Get available time slots
Invoke-RestMethod -Uri "http://localhost:3000/api/time-slots?date=2026-02-01" -Method Get

# Get user appointments
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/user/1" -Method Get

# Cancel appointment
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/1/cancel" -Method Put
```

---

## 🌐 Network Access Scenarios

### Scenario A: Same Network (Fastest)
**When:** Phone and Computer on same WiFi
```
PC IP: 192.168.1.100
URL: http://192.168.1.100:3000/bank-appointment
```

### Scenario B: Different Network (ngrok)
**When:** Phone on different WiFi/Mobile data
```
URL: https://your-ngrok-url.ngrok.io/bank-appointment
```

### Scenario C: Behind Router/Firewall
**Use ngrok** - it tunnels through firewalls

---

## 📊 Database Schema

### Appointments Table
```sql
CREATE TABLE appointments (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT,
  bankId VARCHAR(100),
  bankName VARCHAR(255),
  bankAddress VARCHAR(500),
  appointmentDate DATE,
  appointmentTime VARCHAR(10),
  status VARCHAR(50) DEFAULT 'confirmed',
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE(),
  notes VARCHAR(MAX),
  FOREIGN KEY (userId) REFERENCES users(id)
)
```

---

## 🎨 Customization Guide

### Add More Banks:
Edit `public/bank-appointment.html`, update the `ocbcBanks` object:

```javascript
'your-location': [
    {
        id: 'ocbc_location_001',
        name: 'OCBC Location Branch',
        address: 'Address here',
        coordinates: { lat: 1.3521, lng: 103.8198 },
        distance: 0.5,
        hours: '10:00 AM - 3:00 PM'
    }
]
```

### Change Colors:
Update gradient colors in the HTML files:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Change to your preferred colors */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### Modify Time Slots:
In `appointmentController.js`, update the `getAvailableTimeSlots` function:
```javascript
for (let hour = 9; hour < 17; hour++) {  // Change hours
    for (let min = 0; min < 60; min += 30) {  // Change interval (30 = 30 mins)
```

---

## 🐛 Troubleshooting

### Issue: ngrok URL not working
**Solution:** 
- Check if ngrok is running
- Make sure your local server is running
- Check firewall settings
- Verify the port number (default: 3000)

### Issue: "Cannot GET /bank-appointment"
**Solution:**
- Make sure server.js has been updated with appointment routes
- Restart the server
- Clear browser cache

### Issue: Database errors
**Solution:**
- Check if MSSQL server is running
- Verify database connection in `.env` file
- Run: `npm install mssql` if missing

### Issue: Mobile can't access desktop version
**Solution (Local Network):**
- Ensure both devices on same WiFi
- Disable phone's mobile data
- Check Windows Firewall isn't blocking port 3000

**Solution (ngrok):**
- Make sure ngrok has internet connection
- Check ngrok auth token is valid
- Try restarting ngrok

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments/book` | Book new appointment |
| GET | `/api/appointments/:id` | Get appointment details |
| GET | `/api/appointments/user/:userId` | Get user's appointments |
| PUT | `/api/appointments/:id` | Update appointment |
| PUT | `/api/appointments/:id/cancel` | Cancel appointment |
| GET | `/api/time-slots` | Get available time slots |
| GET | `/api/appointments/range` | Get appointments by date range |

---

## 🔐 Security Considerations

- Currently, appointments don't require authentication
- Add `requireSession` middleware to restrict access:

```javascript
// In appointmentRoutes.js
import requireSession from "../middleware/requireSession.js";

router.post("/appointments/book", requireSession, bookAppointment);
router.get("/appointments/user/:userId", requireSession, getUserAppointmentsList);
```

---

## 🚀 Production Deployment

For production, consider:
1. Use a real domain name (instead of ngrok)
2. Add authentication/authorization
3. Implement rate limiting
4. Add email notifications
5. Set up SSL/HTTPS
6. Add appointment reminder notifications

---

## 📞 Need Help?

1. Check if server is running: `http://localhost:3000/health`
2. Check ngrok status: ngrok dashboard at https://dashboard.ngrok.com
3. Check browser console for errors (F12)
4. Check server console for backend errors

---

## 🎉 You're all set!

Your bank appointment booking system is ready. Access it via:
- **Desktop:** `http://localhost:3000/bank-appointment`
- **Mobile (Local):** `http://YOUR_PC_IP:3000/bank-appointment`
- **Mobile (Remote):** `https://your-ngrok-url.ngrok.io/bank-appointment`
