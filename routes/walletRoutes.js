import express from "express";
import { 
  transferToWallet, 
  getWalletBalanceAPI,
  getWalletTransactionsAPI,
  getWalletSummaryAPI
} from "../controllers/walletController.js";

const router = express.Router();

// Transfer funds to digital wallet
router.post("/transfer", transferToWallet);

// Get wallet balance
router.get("/balance/:walletId", getWalletBalanceAPI);

// Get wallet transaction history
router.get("/transactions/:walletId", getWalletTransactionsAPI);

// Get wallet summary (balance + recent transactions + statistics)
router.get("/summary/:walletId", getWalletSummaryAPI);

export default router;
