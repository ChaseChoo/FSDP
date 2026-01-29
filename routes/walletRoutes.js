import express from "express";
import { transferToWallet, getWalletBalanceAPI } from "../controllers/walletController.js";

const router = express.Router();

// Transfer funds to digital wallet
router.post("/wallet/transfer", transferToWallet);

// Get wallet balance
router.get("/wallet/balance/:walletId", getWalletBalanceAPI);

export default router;
