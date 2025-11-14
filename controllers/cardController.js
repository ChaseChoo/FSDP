// controllers/cardController.js - ATM Card Authentication Controller
import jwt from 'jsonwebtoken';
import { authenticateCard, createCard, changePIN, blockCard, logCardTransaction } from '../models/cardModel.js';
import { findAccountByUserId, createAccountForUser } from '../models/accountModel.js';

const JWT_SECRET = process.env.JWT_VERIFY_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = '24h'; // Shorter session for ATM security

/**
 * POST /api/card/login
 * Authenticate user with card number and PIN
 */
export async function cardLogin(req, res) {
    try {
        const { cardNumber, pin } = req.body;
        
        // Input validation
        if (!cardNumber || !pin) {
            return res.status(400).json({
                success: false,
                error: 'Card number and PIN are required',
                shouldRetry: true
            });
        }
        
        // Clean card number (remove spaces and hyphens)
        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        
        // Authenticate card
        const authResult = await authenticateCard(cleanCardNumber, pin);
        
        if (!authResult.success) {
            return res.status(401).json({
                success: false,
                error: authResult.error,
                shouldRetry: authResult.shouldRetry
            });
        }
        
        const user = authResult.user;
        
        // Ensure user has an account
        let account = await findAccountByUserId(user.id);
        if (!account) {
            const newAccount = await createAccountForUser(user.id, 1000.00, "SGD"); // Start with $1000 for demo
            account = { 
                Id: newAccount.Id, 
                Balance: parseFloat(newAccount.Balance), 
                Currency: newAccount.Currency 
            };
        }
        
        // Generate JWT token for session
        const token = jwt.sign(
            { 
                userId: user.id,
                externalId: user.externalId,
                cardNumber: cleanCardNumber,
                sessionType: 'ATM_CARD'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Log successful login
        await logCardTransaction(user.id, cleanCardNumber, 'LOGIN', null, 'SUCCESS', 'ATM login successful');
        
        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.fullName,
                cardNumber: user.cardNumber, // Already masked in model
                cardExpiry: user.cardExpiryDate
            },
            account: {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            },
            session: {
                expiresIn: JWT_EXPIRES_IN,
                sessionType: 'ATM_CARD'
            }
        });
        
    } catch (error) {
        console.error('Card login error:', error);
        res.status(500).json({
            success: false,
            error: 'System error. Please try again or contact support.',
            shouldRetry: true
        });
    }
}

/**
 * POST /api/card/register
 * Register a new card (for demo/testing purposes)
 */
export async function cardRegister(req, res) {
    try {
        const { name, email, phone, cardNumber, pin } = req.body;
        
        // Input validation
        if (!name || !cardNumber || !pin) {
            return res.status(400).json({
                success: false,
                error: 'Name, card number, and PIN are required'
            });
        }
        
        // Clean card number
        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        
        // Validate card number format
        if (!/^\d{16}$/.test(cleanCardNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Card number must be 16 digits'
            });
        }
        
        // Validate PIN format
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                error: 'PIN must be 4 digits'
            });
        }
        
        // Create card
        const newUser = await createCard({
            name: name.trim(),
            email: email ? email.toLowerCase().trim() : null,
            phone: phone ? phone.replace(/\D/g, '') : null,
            cardNumber: cleanCardNumber,
            pin: pin
        });
        
        // Create account for the new user
        const account = await createAccountForUser(newUser.id, 0.00, "SGD");
        
        res.status(201).json({
            success: true,
            message: 'Card registered successfully',
            user: {
                id: newUser.id,
                name: newUser.fullName,
                cardNumber: newUser.cardNumber, // Already masked
                cardExpiry: newUser.cardExpiryDate
            },
            account: {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            }
        });
        
    } catch (error) {
        console.error('Card registration error:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'System error during registration. Please try again.'
        });
    }
}

/**
 * POST /api/card/change-pin
 * Change card PIN
 */
export async function cardChangePIN(req, res) {
    try {
        const { cardNumber, oldPin, newPin } = req.body;
        
        // Input validation
        if (!cardNumber || !oldPin || !newPin) {
            return res.status(400).json({
                success: false,
                error: 'Card number, old PIN, and new PIN are required'
            });
        }
        
        // Clean card number
        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        
        // Validate PIN formats
        if (!/^\d{4}$/.test(oldPin) || !/^\d{4}$/.test(newPin)) {
            return res.status(400).json({
                success: false,
                error: 'PINs must be 4 digits'
            });
        }
        
        if (oldPin === newPin) {
            return res.status(400).json({
                success: false,
                error: 'New PIN must be different from current PIN'
            });
        }
        
        // Change PIN
        const result = await changePIN(cleanCardNumber, oldPin, newPin);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'PIN changed successfully'
            });
        } else {
            res.status(401).json(result);
        }
        
    } catch (error) {
        console.error('PIN change error:', error);
        res.status(500).json({
            success: false,
            error: 'System error. Please try again or contact support.'
        });
    }
}

/**
 * POST /api/card/block
 * Block a card (emergency function)
 */
export async function cardBlock(req, res) {
    try {
        const { cardNumber, reason } = req.body;
        
        if (!cardNumber) {
            return res.status(400).json({
                success: false,
                error: 'Card number is required'
            });
        }
        
        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        const blockReason = reason || 'User requested emergency block';
        
        const result = await blockCard(cleanCardNumber, blockReason);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Card blocked successfully. Contact support to unblock.'
            });
        } else {
            res.status(404).json(result);
        }
        
    } catch (error) {
        console.error('Card blocking error:', error);
        res.status(500).json({
            success: false,
            error: 'System error. Please contact support immediately.'
        });
    }
}

/**
 * GET /api/card/verify-session
 * Verify current card session
 */
export async function verifyCardSession(req, res) {
    try {
        // This would typically be called with authentication middleware
        const user = req.user;
        
        if (!user || user.sessionType !== 'ATM_CARD') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired card session'
            });
        }
        
        // Get user's account
        const account = await findAccountByUserId(user.userId);
        
        res.json({
            success: true,
            user: {
                id: user.userId,
                externalId: user.externalId,
                cardNumber: user.cardNumber
            },
            account: account ? {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            } : null,
            sessionValid: true
        });
        
    } catch (error) {
        console.error('Session verification error:', error);
        res.status(500).json({
            success: false,
            error: 'System error during session verification'
        });
    }
}

/**
 * Middleware to verify card-based JWT tokens
 */
export function authenticateCardToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Ensure it's a card-based session
        if (decoded.sessionType !== 'ATM_CARD') {
            return res.status(401).json({
                success: false,
                error: 'Invalid session type'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please login again.'
            });
        }
        
        return res.status(403).json({
            success: false,
            error: 'Invalid session'
        });
    }
}