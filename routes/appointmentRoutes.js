// routes/appointmentRoutes.js
import express from "express";
import requireSession from "../middleware/requireSession.js";
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

// Hardcoded OCBC bank locations
const OCBC_BANKS = [
  { id: 1, name: "OCBC Bukit Timah", address: "314 Jalan Bukit Merah, Singapore 149733", lat: 1.2869, lng: 103.8246, openHours: "09:00-18:00" },
  { id: 2, name: "OCBC Marina Bay", address: "70 Shenton Way, Singapore 079118", lat: 1.2757, lng: 103.8502, openHours: "09:00-18:00" },
  { id: 3, name: "OCBC Raffles Place", address: "6 Raffles Quay, Singapore 048580", lat: 1.2833, lng: 103.8512, openHours: "09:00-18:00" },
  { id: 4, name: "OCBC Orchard", address: "350 Orchard Road, Singapore 238859", lat: 1.3047, lng: 103.8350, openHours: "10:00-20:00" },
  { id: 5, name: "OCBC Tampines", address: "200 Tampines Ave 8, Singapore 529115", lat: 1.3521, lng: 103.9450, openHours: "09:00-18:00" },
  { id: 6, name: "OCBC Jurong", address: "1 Science Park Road, Singapore 117528", lat: 1.3345, lng: 103.7880, openHours: "09:00-18:00" }
];

// Get all banks
router.get("/banks", (req, res) => {
  res.json({ banks: OCBC_BANKS });
});

// Get nearby banks
router.get("/nearby", (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: "latitude and longitude required" });
  }

  const userLat = parseFloat(latitude);
  const userLng = parseFloat(longitude);
  const radiusKm = parseFloat(radius);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const nearby = OCBC_BANKS
    .map(bank => ({
      ...bank,
      distance: getDistance(userLat, userLng, bank.lat, bank.lng)
    }))
    .filter(bank => bank.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  res.json({ banks: nearby });
});

// Aliases for /api/appointments/* to avoid route collisions
router.get("/appointments/banks", (req, res) => {
  res.json({ banks: OCBC_BANKS });
});

router.get("/appointments/nearby", (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "latitude and longitude required" });
  }

  const userLat = parseFloat(latitude);
  const userLng = parseFloat(longitude);
  const radiusKm = parseFloat(radius);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const nearby = OCBC_BANKS
    .map(bank => ({
      ...bank,
      distance: getDistance(userLat, userLng, bank.lat, bank.lng)
    }))
    .filter(bank => bank.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  res.json({ banks: nearby });
});

// Book a new appointment
router.post("/book", bookAppointment);
router.post("/appointments/book", bookAppointment);  // Alternative route

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
