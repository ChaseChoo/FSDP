// routes/authRoutes.js
import express from "express";
import { receiveToken } from "../controllers/authController.js";
const router = express.Router();

router.post("/receive-token", receiveToken);

export default router;
