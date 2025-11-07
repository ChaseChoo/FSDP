// controllers/loginController.js
import jwt from 'jsonwebtoken';
import { createUser, authenticateUser, updateUserLastLogin } from '../models/loginModel.js';
import { findAccountByUserId, createAccountForUser } from '../models/accountModel.js';
import { 
    validateSignupData, 
    validateLoginData, 
    sanitizeUserData,
    checkRateLimit,
    recordLoginAttempt,
    clearLoginAttempts
} from '../utils/loginValidation.js';

const JWT_SECRET = process.env.JWT_VERIFY_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * POST /api/login
 * Authenticate user with email/phone and password
 */
export async function login(req, res) {
    try {
        const sanitizedData = sanitizeUserData(req.body);
        const validation = validateLoginData(sanitizedData);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }
        
        const { email, password } = sanitizedData;
        
        // Check rate limiting
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                success: false,
                error: `Too many login attempts. Please try again in ${rateLimit.timeUntilUnlock} minutes.`
            });
        }
        
        // Attempt authentication
        const user = await authenticateUser(email, password);
        
        if (!user) {
            // Record failed attempt
            recordLoginAttempt(email);
            
            return res.status(401).json({
                success: false,
                error: 'Invalid email/phone or password',
                remainingAttempts: rateLimit.remainingAttempts - 1
            });
        }
        
        // Clear login attempts on successful login
        clearLoginAttempts(email);
        
        // Update last login time
        await updateUserLastLogin(user.Id);
        
        // Ensure user has an account
        let account = await findAccountByUserId(user.Id);
        if (!account) {
            const newAccount = await createAccountForUser(user.Id, 0.00, "SGD");
            account = { 
                Id: newAccount.Id, 
                Balance: parseFloat(newAccount.Balance), 
                Currency: newAccount.Currency 
            };
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.Id,
                externalId: user.ExternalId,
                email: user.Email 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.Id,
                externalId: user.ExternalId,
                name: user.FullName,
                email: user.Email,
                phone: user.Phone
            },
            account: {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during login'
        });
    }
}

/**
 * POST /api/signup
 * Register a new user account
 */
export async function signup(req, res) {
    try {
        const sanitizedData = sanitizeUserData(req.body);
        const validation = validateSignupData(sanitizedData);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }
        
        const { name, email, phone, password } = sanitizedData;
        
        // Create user
        const newUser = await createUser({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.replace(/\D/g, ''), // Remove non-digits
            password: password
        });
        
        // Create account for the new user
        const account = await createAccountForUser(newUser.Id, 0.00, "SGD");
        
        // Generate JWT token for immediate login
        const token = jwt.sign(
            { 
                userId: newUser.Id,
                externalId: newUser.ExternalId,
                email: newUser.Email 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Return success response
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token: token,
            user: {
                id: newUser.Id,
                externalId: newUser.ExternalId,
                name: newUser.FullName,
                email: newUser.Email,
                phone: newUser.Phone
            },
            account: {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal server error during signup'
        });
    }
}

/**
 * POST /api/logout
 * Logout user (client-side token removal primarily)
 */
export async function logout(req, res) {
    try {
        // In a JWT-based system, logout is mainly handled client-side
        // by removing the token from localStorage/cookies
        // You could implement a token blacklist here if needed
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during logout'
        });
    }
}

/**
 * GET /api/profile
 * Get current user profile (requires authentication)
 */
export async function getProfile(req, res) {
    try {
        // This would typically be called with authentication middleware
        // that sets req.user from the JWT token
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }
        
        // Get user's account
        const account = await findAccountByUserId(user.userId);
        
        res.json({
            success: true,
            user: {
                id: user.userId,
                externalId: user.externalId,
                email: user.email
            },
            account: account ? {
                id: account.Id,
                balance: parseFloat(account.Balance),
                currency: account.Currency
            } : null
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Middleware to verify JWT tokens
 */
export function authenticateToken(req, res, next) {
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
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        
        return res.status(403).json({
            success: false,
            error: 'Invalid token'
        });
    }
}