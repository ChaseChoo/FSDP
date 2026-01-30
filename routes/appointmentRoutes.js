// routes/appointmentRoutes.js
import express from "express";
import {
  bookAppointment,
  getAppointment,
  getUserAppointmentsList,
  cancelAppointment,
  updateAppointment,
  getAvailableTimeSlots,
  getAppointmentsByRange,
} from "../controllers/appointmentController.js";

const router = express.Router();

// Book a new appointment
router.post("/appointments/book", bookAppointment);

// Get a specific appointment
router.get("/appointments/:appointmentId", getAppointment);

// Get all appointments for a user
router.get("/appointments/user/:userId", getUserAppointmentsList);

// Cancel an appointment
router.put("/appointments/:appointmentId/cancel", cancelAppointment);

// Update an appointment
router.put("/appointments/:appointmentId", updateAppointment);

// Get available time slots
router.get("/time-slots", getAvailableTimeSlots);

// Get appointments by date range (for dashboard)
router.get("/appointments/range", getAppointmentsByRange);

export default router;
