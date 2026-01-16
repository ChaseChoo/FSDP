// routes/guardianQRRoutes.js
import express from "express";
import {
  createActionQR,
  validateActionQR,
  executePreConfiguredAction,
  getMyActions,
  deleteAction
} from "../controllers/guardianQRController.js";
import requireSession from "../middleware/requireSession.js";

const router = express.Router();

// Create a new pre-configured action QR code (requires authentication)
router.post("/create-action-qr", requireSession, createActionQR);

// Validate a pre-configured action QR code (public - for ATM to check)
router.get("/validate-action/:actionId", validateActionQR);

// Execute a pre-configured action (public - for ATM to execute)
router.post("/execute-action", executePreConfiguredAction);

// Get all actions for authenticated guardian
router.get("/my-actions", requireSession, getMyActions);

// Delete a pre-configured action
router.delete("/action/:actionId", requireSession, deleteAction);

export default router;
