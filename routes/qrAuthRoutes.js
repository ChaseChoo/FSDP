// routes/qrAuthRoutes.js
import express from "express";
import {
  getQRAuthStatus,
  verifyQRSession,
  approveQRAuth,
  manualLogin,
  signup
} from "../controllers/qrAuthController.js";

const router = express.Router();

// QR Authentication endpoints
router.get("/qr-auth-status/:sessionId", getQRAuthStatus);
router.post("/verify-qr-session", verifyQRSession);
router.post("/approve-qr-auth", approveQRAuth);

// Manual authentication endpoints
router.post("/login", manualLogin);
router.post("/signup", signup);

export default router;