// routes/loginRoutes.js
import express from 'express';
import { login, signup, logout, getProfile, authenticateToken } from '../controllers/loginController.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', login);
router.post('/signup', signup);

// Protected routes (authentication required)
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;