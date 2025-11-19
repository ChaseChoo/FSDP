import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import qrAuthRoutes from "./routes/qrAuthRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import approvedRecipientRoutes from "./routes/approvedRecipientRoutes.js";
import { sessionCount } from "./services/sessionStore.js";
import fakeLogin from "./middleware/fakeLogin.js";
import requireSession from "./middleware/requireSession.js";
import { getTransactionHistory } from "./controllers/transactionController.js";

dotenv.config();

// Debug: confirm .env value
console.log("ENV DEV_ALLOW_ALL =", process.env.DEV_ALLOW_ALL);

const app = express();

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logger (add immediately after body-parser)
app.use((req, res, next) => {
  console.log("REQ", req.method, req.path, "headers:", {
    authorization: !!req.headers.authorization,
    cookie: !!req.headers.cookie
  });
  next();
});

// Serve static files from 'public' folder
app.use(express.static("public"));

// Apply fakeLogin middleware to /account routes (mount once)
app.use("/account", fakeLogin, accountRoutes);

// API routes
app.use("/auth", authRoutes);
app.use("/api", qrAuthRoutes); // QR authentication and login/signup
app.use("/api", loginRoutes); // Login and signup functionality
app.use("/api/card", cardRoutes); // Card-based authentication
app.use("/support", supportRoutes); // Support live agent demo
// Approved recipients API (list/create/update/delete)
app.use("/api", approvedRecipientRoutes);

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
  console.log(`Network: http://172.20.10.7:${PORT}`);
});