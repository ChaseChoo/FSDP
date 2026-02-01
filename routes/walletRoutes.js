import express from "express";
import { 
  transferToWallet, 
  getWalletBalanceAPI,
  getWalletTransactionsAPI,
  getWalletSummaryAPI
} from "../controllers/walletController.js";

const router = express.Router();

// Transfer funds to digital wallet
router.post("/wallet/transfer", transferToWallet);

// Get wallet balance
router.get("/wallet/balance/:walletId", getWalletBalanceAPI);

// Get wallet transaction history
router.get("/wallet/transactions/:walletId", getWalletTransactionsAPI);

// Get wallet summary (balance + recent transactions + statistics)
router.get("/wallet/summary/:walletId", getWalletSummaryAPI);

export default router;
