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

// DEV: if you want the app to always behave as "logged in" for testing,
// set DEV_ALLOW_ALL=true in your .env. This middleware sets a dev user
// on every request before static files / routes are handled.
if (process.env.DEV_ALLOW_ALL) {
  app.use((req, res, next) => {
    req.user = { externalId: "FAKE_USER", id: "dev-user", username: "dev" };
    // optional debug:
    console.log("DEV_ALLOW_ALL active - req.user injected for", req.method, req.path);
    next();
  });
}

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
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});