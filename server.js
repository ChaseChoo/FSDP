import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import { sessionCount } from "./services/sessionStore.js";
import fakeLogin from "./middleware/fakeLogin.js";
dotenv.config();

// TianRui's Section
const app = express();
app.use(bodyParser.json());

app.use("/account", fakeLogin, accountRoutes);

// Serve static files from 'public' folder
app.use(express.static("public"));

// API routes
app.use("/auth", authRoutes);
app.use("/account", accountRoutes); // deposit, withdraw, balance, transactions

// Serve pages
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

