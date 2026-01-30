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
import walletRoutes from "./routes/walletRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import { sessionCount } from "./services/sessionStore.js";
import fakeLogin from "./middleware/fakeLogin.js";
import requireSession from "./middleware/requireSession.js";
import { getTransactionHistory } from "./controllers/transactionController.js";
import { createAppointmentTable } from "./models/appointmentModel.js";

dotenv.config();

// Debug: confirm .env value
console.log("ENV DEV_ALLOW_ALL =", process.env.DEV_ALLOW_ALL);

// Initialize database tables
await createAppointmentTable();

const app = express();

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logger (add immediately after body-parser)
app.use((req, res, next) => {
  console.log("========================================");
  console.log("REQ", req.method, req.path, req.url);
  console.log("Headers:", req.headers);
  console.log("========================================");
  next();
});

// Serve static files from 'public' folder
app.use(express.static("public", {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Serve atm videos folder at /atm-videos (so files in `atm videos/` are web-accessible)
app.use('/atm-videos', express.static(path.resolve('atm videos')));

// Return list of mp4 files in the atm videos folder for client-side discovery
app.get('/atm-videos/list', async (req, res) => {
  try {
    const dir = path.resolve('atm videos');
    const files = await fs.readdir(dir);
    const mp4s = files.filter(f => f.toLowerCase().endsWith('.mp4'));
    res.json(mp4s);
  } catch (err) {
    console.error('Failed to read atm videos folder', err);
    res.status(500).json({ error: 'Failed to list atm videos' });
  }
});

// Apply fakeLogin middleware to /account routes (mount once)
app.use("/account", fakeLogin, accountRoutes);

// API routes
app.use("/auth", authRoutes);
app.use("/api", qrAuthRoutes); // QR authentication and login/signup
app.use("/api", loginRoutes); // Login and signup functionality
console.log('Mounting card routes at /api/card...');
app.use("/api/card", cardRoutes); // Card-based authentication
console.log('Card routes mounted successfully');
app.use("/support", supportRoutes); // Support live agent demo
// Approved recipients API (list/create/update/delete)
app.use("/api", approvedRecipientRoutes);
// Guardian QR code API (assisted transactions)
app.use("/api/guardian", fakeLogin, guardianQRRoutes);
// Digital wallet transfer API
app.use("/api", fakeLogin, requireSession, walletRoutes);
// Bank appointment booking API
app.use("/api", appointmentRoutes);

// Transaction history API endpoint (JSON)
app.get("/api/transactions", fakeLogin, requireSession, getTransactionHistory);

// Serve frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.resolve("public/login.html"));
});

app.get("/card-login", (req, res) => {
  res.sendFile(path.resolve("public/card-login.html"));
});

app.get("/mobile-auth", (req, res) => {
  res.sendFile(path.resolve("public/mobile-auth.html"));
});

app.get("/account", (req, res) => {
  res.sendFile(path.resolve("public/account.html"));
});

app.get("/transactions", (req, res) => {
  res.sendFile(path.resolve("public/transactions.html"));
});

app.get("/wallet-transfer", (req, res) => {
  res.sendFile(path.resolve("public/wallet-transfer.html"));
});

app.get("/wallet-alipay", (req, res) => {
  res.sendFile(path.resolve("public/wallet-alipay.html"));
});

app.get("/wallet-demo", (req, res) => {
  res.sendFile(path.resolve("public/wallet-demo.html"));
});

app.get("/wallet-mobile", (req, res) => {
  res.sendFile(path.resolve("public/wallet-mobile.html"));
});

app.get("/wallet-showcase", (req, res) => {
  res.sendFile(path.resolve("public/wallet-showcase.html"));
});

app.get("/bank-appointment", (req, res) => {
  res.sendFile(path.resolve("public/bank-appointment.html"));
});

app.get("/appointment-confirmation", (req, res) => {
  res.sendFile(path.resolve("public/appointment-confirmation.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, sessions: sessionCount() });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.18.83:${PORT}`);
});