// routes/cardRoutes.js - Card Authentication Routes
import express from 'express';
import { 
    cardLogin, 
    cardRegister, 
    cardChangePIN, 
    cardBlock, 
    verifyCardSession,
    authenticateCardToken 
} from '../controllers/cardController.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', cardLogin);
router.post('/register', cardRegister); // For demo/testing purposes
router.post('/change-pin', cardChangePIN);

// Emergency routes
router.post('/block', cardBlock);

// Protected routes (require card authentication)
router.get('/verify-session', authenticateCardToken, verifyCardSession);

export default router;