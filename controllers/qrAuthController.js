// controllers/qrAuthController.js
import jwt from "jsonwebtoken";
import { findUserByExternalId, createUser } from "../models/userModel.js";
import { findAccountByUserId, createAccountForUser } from "../models/accountModel.js";
import { createSession } from "../services/sessionStore.js";

// Store for QR authentication sessions (in production, use Redis or database)
const qrSessions = new Map();

// QR session expires in 5 minutes
const QR_SESSION_TIMEOUT = 5 * 60 * 1000;

/**
 * GET /api/qr-auth-status/:sessionId
 * Check if QR session has been authenticated
 */
export async function getQRAuthStatus(req, res) {
  const { sessionId } = req.params;
  
  try {
    const session = qrSessions.get(sessionId);
    
    if (!session) {
      return res.json({ status: 'invalid' });
    }
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return res.json({ status: 'expired' });
    }
    
    if (session.authenticated) {
      // Session was authenticated, return user data and clean up
      const sessionData = {
        status: 'authenticated',
        token: session.token,
        user: session.user,
        account: session.account
      };
      
      // Clean up the QR session
      qrSessions.delete(sessionId);
      
      return res.json(sessionData);
    }
    
    return res.json({ status: 'waiting' });
  } catch (error) {
    console.error('QR auth status check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * POST /api/verify-qr-session
 * Verify if a QR session is valid for mobile authentication
 */
export async function verifyQRSession(req, res) {
  const { sessionId } = req.body;
  
  try {
    // Create session if it doesn't exist (first time scanning)
    if (!qrSessions.has(sessionId)) {
      qrSessions.set(sessionId, {
        id: sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + QR_SESSION_TIMEOUT,
        authenticated: false
      });
    }
    
    const session = qrSessions.get(sessionId);
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return res.status(400).json({ valid: false, error: 'Session expired' });
    }
    
    return res.json({ valid: true });
  } catch (error) {
    console.error('QR session verification error:', error);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
}

/**
 * POST /api/approve-qr-auth
 * Approve or deny QR authentication from mobile device
 */
export async function approveQRAuth(req, res) {
  const { sessionId, approved } = req.body;
  
  try {
    const session = qrSessions.get(sessionId);
    
    if (!session) {
      return res.status(400).json({ error: 'Invalid session' });
    }
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(sessionId);
      return res.status(400).json({ error: 'Session expired' });
    }
    
    if (!approved) {
      // User denied the authentication
      qrSessions.delete(sessionId);
      return res.json({ message: 'Authentication denied' });
    }
    
    // For demo purposes, create a fake user account
    // In a real application, you would authenticate the mobile user first
    const fakeExternalId = 'mobile_user_' + Date.now();
    
    // Create or find user
    let user = await findUserByExternalId(fakeExternalId);
    if (!user) {
      const created = await createUser(fakeExternalId, 'Mobile User', 'mobile@example.com');
      user = { 
        Id: created.Id, 
        ExternalId: fakeExternalId, 
        FullName: 'Mobile User', 
        Email: 'mobile@example.com' 
      };
    }
    
    // Create or find account
    let account = await findAccountByUserId(user.Id);
    if (!account) {
      const acc = await createAccountForUser(user.Id, 1000.00, 'USD'); // Start with $1000
      account = { 
        Id: acc.Id, 
        Balance: parseFloat(acc.Balance), 
        Currency: acc.Currency 
      };
    }
    
    // Create session
    const authSession = createSession(fakeExternalId, { 
      id: fakeExternalId,
      name: 'Mobile User',
      email: 'mobile@example.com'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: fakeExternalId,
        email: 'mobile@example.com',
        name: 'Mobile User'
      },
      process.env.JWT_VERIFY_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    // Update QR session with authentication data
    session.authenticated = true;
    session.token = token;
    session.user = {
      id: user.Id,
      externalId: user.ExternalId,
      fullName: user.FullName,
      email: user.Email
    };
    session.account = {
      id: account.Id,
      balance: parseFloat(account.Balance),
      currency: account.Currency
    };
    
    return res.json({ 
      message: 'Authentication approved successfully',
      success: true
    });
    
  } catch (error) {
    console.error('QR auth approval error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
}

/**
 * POST /api/login
 * Manual login endpoint
 */
export async function manualLogin(req, res) {
  const { email, password } = req.body;
  
  try {
    // For demo purposes, accept any email/password combination
    // In production, implement proper password verification
    const externalId = email; // Use email as external ID for simplicity
    
    // Create or find user
    let user = await findUserByExternalId(externalId);
    if (!user) {
      const created = await createUser(externalId, 'Manual User', email);
      user = { 
        Id: created.Id, 
        ExternalId: externalId, 
        FullName: 'Manual User', 
        Email: email 
      };
    }
    
    // Create or find account
    let account = await findAccountByUserId(user.Id);
    if (!account) {
      const acc = await createAccountForUser(user.Id, 500.00, 'USD'); // Start with $500
      account = { 
        Id: acc.Id, 
        Balance: parseFloat(acc.Balance), 
        Currency: acc.Currency 
      };
    }
    
    // Create session
    const session = createSession(externalId, { 
      id: externalId,
      email: email,
      name: 'Manual User'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: externalId,
        email: email,
        name: 'Manual User'
      },
      process.env.JWT_VERIFY_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.Id,
        externalId: user.ExternalId,
        fullName: user.FullName,
        email: user.Email
      },
      account: {
        id: account.Id,
        balance: parseFloat(account.Balance),
        currency: account.Currency
      }
    });
    
  } catch (error) {
    console.error('Manual login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

/**
 * POST /api/signup
 * User registration endpoint
 */
export async function signup(req, res) {
  const { name, email, phone, password } = req.body;
  
  try {
    // Check if user already exists
    let existingUser = await findUserByExternalId(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Create new user
    const created = await createUser(email, name, email);
    const user = { 
      Id: created.Id, 
      ExternalId: email, 
      FullName: name, 
      Email: email 
    };
    
    // Create account for new user
    const acc = await createAccountForUser(user.Id, 0.00, 'USD'); // Start with $0
    
    return res.json({
      message: 'Account created successfully',
      user: {
        id: user.Id,
        externalId: user.ExternalId,
        fullName: user.FullName,
        email: user.Email
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Server error during signup' });
  }
}

// Cleanup expired QR sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of qrSessions.entries()) {
    if (now > session.expiresAt) {
      qrSessions.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute