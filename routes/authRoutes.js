// routes/authRoutes.js
import express from "express";
import { receiveToken, requestOtp, verifyOtp, changePassword } from "../controllers/authController.js";
const router = express.Router();

router.post("/receive-token", receiveToken);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changePassword);

export default router;
