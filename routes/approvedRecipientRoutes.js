import express from "express";
import { listApprovedRecipients, createApproved, updateApproved, removeApproved } from "../controllers/approvedRecipientController.js";
import validateRecipient from "../middleware/validateRecipient.js";
import requireSession from "../middleware/requireSession.js";

const router = express.Router();

// All routes require a valid session
router.get('/approved-recipients', requireSession, listApprovedRecipients);
router.post('/approved-recipients', requireSession, validateRecipient, createApproved);
router.put('/approved-recipients/:id', requireSession, validateRecipient, updateApproved);
router.delete('/approved-recipients/:id', requireSession, removeApproved);

export default router;
