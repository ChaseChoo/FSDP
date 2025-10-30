// routes/accountRoutes.js
import express from "express";
import requireSession from "../middleware/requireSession.js";
import { deposit, withdraw } from "../controllers/accountController.js";
import { getTransactionHistory } from "../controllers/transactionController.js";

const router = express.Router();

// Protected endpoints
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);

// Transaction history
router.get("/transactions", getTransactionHistory);

export default router;
