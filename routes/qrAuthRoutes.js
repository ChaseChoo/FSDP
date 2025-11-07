// routes/qrAuthRoutes.js
import express from "express";

const router = express.Router();

// Store for QR authentication sessions (in production, use Redis or database)
const qrSessions = new Map();

// QR Authentication endpoints
router.get("/qr-auth-status/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = qrSessions.get(sessionId);
    
    if (!session) {
        return res.json({ status: 'expired' });
    }
    
    // Check if session is expired (5 minutes)
    if (Date.now() - session.createdAt > 5 * 60 * 1000) {
        qrSessions.delete(sessionId);
        return res.json({ status: 'expired' });
    }
    
    res.json({ 
        status: session.status || 'waiting',
        token: session.token,
        user: session.user
    });
});

router.post("/verify-qr-session", (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Create new QR session
    qrSessions.set(sessionId, {
        createdAt: Date.now(),
        status: 'waiting'
    });
    
    res.json({ success: true });
});

router.post("/approve-qr-auth", (req, res) => {
    const { sessionId, userId, token } = req.body;
    
    const session = qrSessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }
    
    // Update session with authentication data
    session.status = 'authenticated';
    session.token = token;
    session.user = { id: userId };
    
    qrSessions.set(sessionId, session);
    
    res.json({ success: true });
});

export default router;