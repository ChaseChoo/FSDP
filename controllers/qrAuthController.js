// controllers/qrAuthController.js
import jwt from "jsonwebtoken";
import { findUserByExternalId, createUser } from "../models/userModel.js";
import { findAccountByUserId, createAccountForUser } from "../models/accountModel.js";
import { getUserByCardNumber } from "../models/cardModel.js";
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
    let session = qrSessions.get(sessionId);
    
    // If session doesn't exist yet, create it (ATM is polling before mobile scans)
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + QR_SESSION_TIMEOUT,
        authenticated: false
      };
      qrSessions.set(sessionId, session);
      console.log(`[QR Auth] Created new session ${sessionId}, expires at ${new Date(session.expiresAt).toISOString()}`);
      return res.json({ status: 'waiting' });
    }
    
    // Check if session expired
    const now = Date.now();
    const timeRemaining = session.expiresAt - now;
    
    if (timeRemaining <= 0) {
      console.log(`[QR Auth] Session ${sessionId} expired`);
      qrSessions.delete(sessionId);
      return res.json({ status: 'expired' });
    }
    
    if (session.authenticated) {
      // Session was authenticated, return user data and clean up
      console.log(`[QR Auth] Session ${sessionId} authenticated successfully`);
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
      const session = {
        id: sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + QR_SESSION_TIMEOUT,
        authenticated: false
      };
      qrSessions.set(sessionId, session);
      console.log(`[QR Auth] Mobile verify: Created session ${sessionId}, expires at ${new Date(session.expiresAt).toISOString()}`);
    } else {
      console.log(`[QR Auth] Mobile verify: Session ${sessionId} already exists`);
    }
    
    const session = qrSessions.get(sessionId);
    
    // Check if session expired
    const now = Date.now();
    const timeRemaining = session.expiresAt - now;
    
    if (timeRemaining <= 0) {
      console.log(`[QR Auth] Mobile verify: Session ${sessionId} expired`);
      qrSessions.delete(sessionId);
      return res.status(400).json({ valid: false, error: 'Session expired' });
    }
    
    console.log(`[QR Auth] Mobile verify: Session ${sessionId} valid, ${Math.floor(timeRemaining / 1000)}s remaining`);
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
  const { sessionId, approved, cardNumber } = req.body;
  
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
    
    if (!cardNumber) {
      return res.status(400).json({ error: 'Card number required' });
    }
    
    // DEV mode: use demo card data instead of database
    let user, account;
    if (process.env.DEV_ALLOW_ALL === 'true') {
      // Map demo card numbers to user data
      const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
      
      if (cleanCardNumber === '5555444433332222') {
        user = { 
          id: 6, 
          externalId: 'user-6', 
          fullName: 'Fresh Test User', 
          email: 'test@example.com',
          cardNumber: '5555 **** **** 2222'
        };
        account = { 
          id: 6005, 
          balance: 1146, 
          currency: 'SGD',
          accountNumber: 'ACC6005',
          accountType: 'SAVINGS'
        };
      } else if (cleanCardNumber === '4444333322221111') {
        user = { 
          id: 9, 
          externalId: 'user-9', 
          fullName: 'Demo User Two', 
          email: 'demo2@example.com',
          cardNumber: '4444 **** **** 1111'
        };
        account = { 
          id: 9002, 
          balance: 4131, 
          currency: 'SGD',
          accountNumber: 'ACC9002',
          accountType: 'SAVINGS'
        };
      } else {
        return res.status(404).json({ error: 'Card not found (dev mode)' });
      }
      console.log(`[QR Auth] DEV mode: Using demo data for card ${cleanCardNumber}`);
    } else {
      // Production: Get user and account by card number from database
      const result = await getUserByCardNumber(cardNumber);
      
      if (!result) {
        return res.status(404).json({ error: 'Card not found or inactive' });
      }
      
      user = result.user;
      account = result.account;
    }
    
    // Create session
    const authSession = createSession(user.externalId, { 
      id: user.externalId,
      name: user.fullName,
      email: user.email,
      cardNumber: user.cardNumber
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.externalId,
        email: user.email,
        name: user.fullName,
        cardNumber: user.cardNumber,
        sessionType: 'QR_LOGIN'
      },
      process.env.JWT_VERIFY_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    // Update QR session with authentication data
    session.authenticated = true;
    session.token = token;
    session.user = {
      id: user.id,
      externalId: user.externalId,
      fullName: user.fullName,
      email: user.email,
      cardNumber: user.cardNumber
    };
    session.account = {
      id: account.id,
      balance: account.balance,
      currency: account.currency,
      accountNumber: account.accountNumber,
      accountType: account.accountType
    };
    
    console.log(`[QR Auth] Approved login for ${user.fullName} (${user.cardNumber})`);
    
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