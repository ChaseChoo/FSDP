import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import qrAuthRoutes from "./routes/qrAuthRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import approvedRecipientRoutes from "./routes/approvedRecipientRoutes.js";
import guardianQRRoutes from "./routes/guardianQRRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

import fakeLogin from "./middleware/fakeLogin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use(express.static("public"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/qr-auth", qrAuthRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/card", cardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/approved-recipients", approvedRecipientRoutes);
app.use("/api/guardian", fakeLogin, guardianQRRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/wallet", walletRoutes);

// HTML Routes
app.get("/home", (req, res) => {
  res.sendFile(path.resolve("public/home.html"));
});

app.get("/bank-appointment", (req, res) => {
  res.sendFile(path.resolve("public/bank-appointment.html"));
});

app.get("/appointment-confirmation", (req, res) => {
  res.sendFile(path.resolve("public/appointment-confirmation.html"));
});

app.get("/my-bookings-mobile", (req, res) => {
  res.sendFile(path.resolve("public/my-bookings-mobile.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Favicon
app.get("/favicon.ico", (req, res) => {
  res.status(204).send();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Export for Vercel serverless
export default app;

// Also handle direct execution (for local development)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
  });
}
