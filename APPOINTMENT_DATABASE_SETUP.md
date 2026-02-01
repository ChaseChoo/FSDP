### Backend Architecture

#### 1. **Database Layer** (`models/appointmentModel.js`)
- `createAppointmentTable()` - Creates table on server startup
- `bookAppointment(userId, data)` - Inserts new appointment
- `getAppointmentById(id)` - Retrieves specific appointment
- `getUserAppointments(userId)` - Gets all user's appointments
- `cancelAppointment(id)` - Cancels an appointment
- `updateAppointment(id, data)` - Updates appointment details

#### 2. **Controller Layer** (`controllers/appointmentController.js`)
Handles HTTP requests and business logic:
- Validates input data
- Authenticates users
- Calls database functions
- Returns JSON responses

#### 3. **Routes** (`routes/appointmentRoutes.js`)
Defines API endpoints:
- `GET /api/banks` - List all available banks
- `GET /api/nearby` - Find nearby banks
- `POST /api/appointments/book` - Book new appointment
- `GET /api/appointments/:appointmentId` - Get appointment details
- `GET /api/appointments/user/:userId` - Get user's appointments
- `DELETE /api/appointments/:appointmentId` - Cancel appointment
- `PUT /api/appointments/:appointmentId` - Update appointment

## API Usage Examples

### Book an Appointment
```javascript
POST /api/appointments/book
Content-Type: application/json

{
  "bankId": "1",
  "bankName": "OCBC Bukit Timah",
  "bankAddress": "314 Jalan Bukit Merah, Singapore 149733",
  "appointmentDate": "2026-02-15",
  "appointmentTime": "14:00",
  "serviceType": "Account Opening"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointmentId": 5,
  "appointment": {
    "id": 5,
    "userId": 1,
    "bankId": "1",
    "bankName": "OCBC Bukit Timah",
    "appointmentDate": "2026-02-15",
    "appointmentTime": "14:00",
    "status": "confirmed"
  }
}
```

### Get User's Appointments
```javascript
GET /api/appointments/user/1
```

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": 5,
      "bankName": "OCBC Bukit Timah",
      "bankAddress": "314 Jalan Bukit Merah, Singapore 149733",
      "appointmentDate": "2026-02-15T00:00:00.000Z",
      "appointmentTime": "14:00",
      "status": "confirmed",
      "createdAt": "2026-01-31T10:30:00.000Z"
    }
  ]
}
```

### Cancel an Appointment
```javascript
DELETE /api/appointments/5
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

## Frontend Integration

The frontend files that use these APIs:
- `public/bank-appointment.html` - Main booking page
- `public/appointment-confirmation.html` - Confirmation page
- `public/app.js` - Contains booking logic

## Database Queries You Can Run

### View all appointments:
```sql
SELECT 
  a.Id,
  u.FullName,
  a.BankName,
  a.AppointmentDate,
  a.AppointmentTime,
  a.Status,
  a.CreatedAt
FROM Appointments a
JOIN Users u ON a.UserId = u.Id
ORDER BY a.AppointmentDate DESC;
```

### Count appointments by status:
```sql
SELECT Status, COUNT(*) as Count
FROM Appointments
GROUP BY Status;
```

### Find upcoming appointments:
```sql
SELECT *
FROM Appointments
WHERE AppointmentDate >= CAST(GETDATE() AS DATE)
  AND Status = 'confirmed'
ORDER BY AppointmentDate, AppointmentTime;
```

## Features Included

✅ **Database Persistence** - All appointments stored in SQL Server  
✅ **User Association** - Appointments linked to user accounts  
✅ **CRUD Operations** - Create, Read, Update, Delete appointments  
✅ **Status Tracking** - Monitor appointment status (confirmed/cancelled/completed)  
✅ **Date/Time Management** - Proper handling of appointment scheduling  
✅ **Foreign Key Constraints** - Data integrity maintained  
✅ **Automatic Table Creation** - Table created on server startup  
✅ **Indexes** - Optimized queries for UserId and AppointmentDate  

## Troubleshooting

### Issue: "Database connection not available"
**Solution:**
1. Ensure SQL Server is running
2. Check `.env` file has correct credentials:
   ```
   DB_SERVER=127.0.0.1\SQLEXPRESS
   DB_DATABASE=FSDP
   DB_USER=myuser
   DB_PASSWORD=FSDP123
   ```
3. Test connection with: `node simple-test.js`

### Issue: "Table does not exist"
**Solution:**
1. Run `COMPLETE_DATABASE_SETUP.sql` in SSMS
2. Or let the server create it automatically on startup

### Issue: "User not authenticated"
**Solution:**
- Ensure user is logged in before booking
- Session must contain `userId` or `externalId`

## Next Steps

1. **Test the feature**: Book an appointment through the UI
2. **Verify in database**: Check SSMS to see the booking
3. **Add features**: 
   - Email confirmations
   - SMS reminders
   - Calendar integration
   - Waitlist management

## Related Files

- `COMPLETE_DATABASE_SETUP.sql` - Database schema setup
- `models/appointmentModel.js` - Database operations
- `controllers/appointmentController.js` - Business logic
- `routes/appointmentRoutes.js` - API endpoints
- `test-appointment-db.js` - Integration test script
- `BANK_APPOINTMENT_MASTER.md` - Feature documentation

---

**Status**: ✅ Fully integrated with database  
**Last Updated**: January 31, 2026
