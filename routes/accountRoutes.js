// routes/accountRoutes.js
import express from "express";
import requireSession from "../middleware/requireSession.js";
import { deposit, withdraw, getBalance } from "../controllers/accountController.js";
import { getTransactionHistory } from "../controllers/transactionController.js";

const router = express.Router();

// Protected endpoints
router.get("/balance", requireSession, getBalance);
router.post("/deposit", requireSession, deposit);
router.post("/withdraw", requireSession, withdraw);

// Transaction history
router.get("/transactions", requireSession, getTransactionHistory);

export default router;
