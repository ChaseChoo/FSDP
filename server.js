import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import qrAuthRoutes from "./routes/qrAuthRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import { sessionCount } from "./services/sessionStore.js";
import fakeLogin from "./middleware/fakeLogin.js";

dotenv.config();

const app = express();

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static("public"));

// Apply fakeLogin middleware to /account routes
app.use("/account", fakeLogin, accountRoutes);

// API routes
app.use("/auth", authRoutes);
app.use("/account", accountRoutes); // deposit, withdraw, balance, transactions
app.use("/api", qrAuthRoutes); // QR authentication and login/signup
app.use("/api", loginRoutes); // Login and signup functionality
app.use("/api/card", cardRoutes); // Card-based authentication

// Serve frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/card-login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.resolve("public/card-login.html"));
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