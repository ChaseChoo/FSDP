// controllers/cardController.js - ATM Card Authentication Controller
import jwt from 'jsonwebtoken';
import { authenticateCard, createCard, changePIN, blockCard, logCardTransaction } from '../models/cardModel.js';
import { findAccountByUserId, createAccountForUser } from '../models/accountModel.js';
import { poolPromise, mssql } from '../models/db.js';

const JWT_SECRET = process.env.JWT_VERIFY_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = '24h'; // Shorter session for ATM security

/**
 * POST /api/card/login
 * Authenticate user with card number and PIN
 */
export async function cardLogin(req, res) {
    try {
        const { cardNumber, pin } = req.body;
        
        console.log('🔐 Card Login Attempt:', { cardNumber, pinLength: pin?.length });
        
        // Input validation
        if (!cardNumber || !pin) {
            console.log('❌ Missing credentials');
            return res.status(400).json({
                success: false,
                error: 'Card number and PIN are required',
                shouldRetry: true
            });
        }
        
        // Clean card number (remove spaces and hyphens)
        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        
        console.log('🔍 Authenticating card:', cleanCardNumber);
        // DEV mode: accept demo cards and return a fake user/token using dev balances
        if (process.env.DEV_ALLOW_ALL === 'true') {
            // Basic format checks still apply
            if (!/^\d{16}$/.test(cleanCardNumber) || !/^\d{4}$/.test(pin)) {
                return res.status(400).json({ success: false, error: 'Invalid card or PIN format' });
            }
            
            // In dev mode, PIN must be 1234
            if (pin !== '1234') {
                return res.status(401).json({ success: false, error: 'Incorrect PIN', shouldRetry: true });
            }

            // Map known demo card numbers to dev externalIds/userIds used in dev-balances.json
            let devUser = null;
            if (cleanCardNumber === '5555444433332222') {
                devUser = { id: 6, externalId: 'user-6', fullName: 'Lee Jia Jun', cardNumber: '5555 **** **** 2222', cardExpiryDate: null };
            } else if (cleanCardNumber === '4444333322221111') {
                devUser = { id: 9, externalId: 'user-9', fullName: 'Chase Choo', cardNumber: '4444 **** **** 1111', cardExpiryDate: null };
            } else if (cleanCardNumber === '3333222211110000') {
                devUser = { id: 7, externalId: 'user-7', fullName: 'Fang Yu Xuan', cardNumber: '3333 **** **** 0000', cardExpiryDate: null };
            } else if (cleanCardNumber === '2222111100009999') {
                devUser = { id: 8, externalId: 'user-8', fullName: 'David Chong', cardNumber: '2222 **** **** 9999', cardExpiryDate: null };
            } else if (cleanCardNumber === '1111000099998888') {
                devUser = { id: 10, externalId: 'user-10', fullName: 'Luo Tian Rui', cardNumber: '1111 **** **** 8888', cardExpiryDate: null };
            } else {
                // Generic dev user fallback — use externalId from dev-balances if available
                devUser = { id: 1, externalId: 'dev-user', fullName: 'Dev User', cardNumber: cleanCardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4'), cardExpiryDate: null };
            }

            // Create token for dev session
            const token = jwt.sign(
                {
                    userId: devUser.id,
                    externalId: devUser.externalId,
                    cardNumber: cleanCardNumber,
                    sessionType: 'ATM_CARD'
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Log in dev mode (best-effort)
            try {
                await logCardTransaction(devUser.id, cleanCardNumber, 'LOGIN', null, 'SUCCESS', 'ATM login (dev)');
            } catch (e) {
                console.warn('Dev login: logCardTransaction failed', e.message || e);
            }

            return res.json({
                success: true,
                message: 'Login successful (dev)',
                token: token,
                user: {
                    id: devUser.id,
                    name: devUser.fullName,
                    cardNumber: devUser.cardNumber,
                    cardExpiry: devUser.cardExpiryDate
                },
                account: {
                    id: `dev-${devUser.externalId}`,
                    balance: null,
                    currency: 'SGD'
                },
                session: { expiresIn: JWT_EXPIRES_IN, sessionType: 'ATM_CARD' }
            });
        }
        
        // Authenticate card
        const authResult = await authenticateCard(cleanCardNumber, pin);
        
        console.log('📊 Auth result:', { success: authResult.success, error: authResult.error });
        
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

/**
 * GET /api/card/demo-balances
 * Fetch current balances for the two demo accounts from the database
 */
export async function getDemoBalances(req, res) {
    try {
        // In DEV mode, get balances from in-memory store
        if (process.env.DEV_ALLOW_ALL === 'true') {
            const { getDevBalance } = await import('../controllers/accountController.js');
            
            // Card 5555444433332222 is userId 6, Card 4444333322221111 is userId 9
            const accounts = [
                {
                    fullName: 'Lee Jia Jun',
                    cardNumber: '5555444433332222',
                    accountNumber: 'ACC-5555444433332222',
                    balance: getDevBalance('user-6'),
                    currency: 'SGD'
                },
                {
                    fullName: 'Chase Choo',
                    cardNumber: '4444333322221111',
                    accountNumber: 'ACC-4444333322221111',
                    balance: getDevBalance('user-9'),
                    currency: 'SGD'
                }
            ];
            
            return res.json({ success: true, accounts });
        }
        
        // In production, query the database
        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ success: false, error: 'Database not available' });
        }
        
        const request = pool.request();
        request.input('card1', mssql.NVarChar(20), '5555444433332222');
        request.input('card2', mssql.NVarChar(20), '4444333322221111');
        
        const query = `
            SELECT 
                u.FullName,
                u.CardNumber,
                a.AccountNumber,
                a.Balance,
                a.Currency
            FROM Users u
            INNER JOIN Accounts a ON u.Id = a.UserId
            WHERE u.CardNumber IN (@card1, @card2) AND a.Status = 'ACTIVE'
            ORDER BY u.CardNumber
        `;
        
        const result = await request.query(query);
        
        const accounts = result.recordset.map(r => ({
            fullName: r.FullName,
            cardNumber: r.CardNumber,
            accountNumber: r.AccountNumber,
            balance: parseFloat(r.Balance),
            currency: r.Currency
        }));
        
        res.json({ success: true, accounts });
    } catch (error) {
        console.error('getDemoBalances error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch demo balances' });
    }
}

/**
 * POST /api/card/verify-pin
 * Verify card PIN for Impersonation Guard transaction unlock
 * This endpoint validates the user's 4-digit login PIN without full re-authentication
 */
export async function verifyCardPIN(req, res) {
    try {
        const { pin } = req.body;
        
        console.log('🔐 PIN Verification Request');
        
        // Input validation
        if (!pin) {
            return res.status(400).json({
                valid: false,
                error: 'PIN is required'
            });
        }
        
        // Validate PIN format (4 digits - matching login PIN)
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                valid: false,
                error: 'PIN must be exactly 4 digits'
            });
        }
        
        // Get user info from token/session
        const userId = req.user?.userId;
        const cardNumber = req.user?.cardNumber;
        const externalId = req.user?.externalId;
        
        if (!userId && !cardNumber && !externalId) {
            console.log('❌ No user session found');
            return res.status(401).json({
                valid: false,
                error: 'Authentication required'
            });
        }
        
        console.log('🔍 Verifying PIN for user:', userId || externalId);
        console.log('🔍 DEV_ALLOW_ALL:', process.env.DEV_ALLOW_ALL);
        console.log('🔍 PIN entered:', pin);
        console.log('🔍 Card number from token:', cardNumber);
        
        // DEV mode: accept any 4-digit PIN for demo purposes
        if (process.env.DEV_ALLOW_ALL === 'true') {
            console.log('✅ PIN verification successful (dev mode) - accepting PIN:', pin);
            
            // Log the verification attempt
            try {
                await logCardTransaction(
                    userId,
                    cardNumber || 'unknown',
                    'PIN_VERIFY',
                    null,
                    'SUCCESS',
                    'Impersonation Guard PIN verification (dev)'
                );
            } catch (e) {
                console.warn('Dev PIN verify: logCardTransaction failed', e.message);
            }
            
            return res.json({
                valid: true,
                message: 'PIN verified successfully'
            });
        }
        
        // Production: verify against database
        if (!cardNumber) {
            return res.status(400).json({
                valid: false,
                error: 'Card number not found in session'
            });
        }
        
        // Use the authenticateCard function to verify PIN
        const authResult = await authenticateCard(cardNumber, pin);
        
        if (!authResult.success) {
            console.log('❌ Invalid PIN');
            
            // Log failed attempt
            try {
                await logCardTransaction(
                    userId,
                    cardNumber,
                    'PIN_VERIFY',
                    null,
                    'FAILED',
                    'Invalid PIN for Impersonation Guard'
                );
            } catch (e) {
                console.warn('Failed to log PIN verification failure:', e.message);
            }
            
            return res.json({
                valid: false,
                error: 'Invalid PIN'
            });
        }
        
        console.log('✅ PIN verified successfully');
        
        // Log successful verification
        try {
            await logCardTransaction(
                authResult.user.id,
                cardNumber,
                'PIN_VERIFY',
                null,
                'SUCCESS',
                'Impersonation Guard PIN verification'
            );
        } catch (e) {
            console.warn('Failed to log PIN verification:', e.message);
        }
        
        res.json({
            valid: true,
            message: 'PIN verified successfully'
        });
        
    } catch (error) {
        console.error('❌ verifyCardPIN error:', error);
        res.status(500).json({
            valid: false,
            error: 'PIN verification failed'
        });
    }
}
