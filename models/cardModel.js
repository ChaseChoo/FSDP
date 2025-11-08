// models/cardModel.js - Card-based ATM Authentication
import { poolPromise, mssql } from "./db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCKOUT_TIME = 15; // minutes

export async function authenticateCard(cardNumber, pin) {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        // Validate card number format (16 digits)
        if (!/^\d{16}$/.test(cardNumber)) {
            throw new Error("Invalid card number format");
        }
        
        // Validate PIN format (4 digits)
        if (!/^\d{4}$/.test(pin)) {
            throw new Error("Invalid PIN format");
        }
        
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Get card details with user information
            const cardRequest = transaction.request();
            cardRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
            
            const cardResult = await cardRequest.query(`
                SELECT 
                    u.Id,
                    u.ExternalId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.CardNumber,
                    u.PIN,
                    u.CardStatus,
                    u.CardExpiryDate,
                    u.FailedPinAttempts,
                    u.CardBlocked,
                    u.LastPinAttempt,
                    u.IsActive
                FROM Users u 
                WHERE u.CardNumber = @cardNumber
                AND u.IsActive = 1
            `);
            
            if (cardResult.recordset.length === 0) {
                await logCardTransaction(null, cardNumber, 'LOGIN', null, 'FAILED', 'Card not found', transaction);
                await transaction.commit();
                return { success: false, error: "Card not found or inactive", shouldRetry: true };
            }
            
            const user = cardResult.recordset[0];
            
            // Check if card is blocked
            if (user.CardBlocked) {
                await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'BLOCKED', 'Card blocked', transaction);
                await transaction.commit();
                return { success: false, error: "Card is blocked. Please contact support.", shouldRetry: false };
            }
            
            // Check if card is expired
            const now = new Date();
            if (user.CardExpiryDate && new Date(user.CardExpiryDate) < now) {
                await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'FAILED', 'Card expired', transaction);
                await transaction.commit();
                return { success: false, error: "Card has expired. Please contact your bank.", shouldRetry: false };
            }
            
            // Check if card is active
            if (user.CardStatus !== 'ACTIVE') {
                await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'FAILED', `Card status: ${user.CardStatus}`, transaction);
                await transaction.commit();
                return { success: false, error: "Card is not active. Please contact support.", shouldRetry: false };
            }
            
            // Check recent failed attempts (rate limiting)
            const failedAttempts = user.FailedPinAttempts || 0;
            const lastAttempt = user.LastPinAttempt ? new Date(user.LastPinAttempt) : null;
            
            if (failedAttempts >= MAX_PIN_ATTEMPTS) {
                const timeSinceLastAttempt = lastAttempt ? (now - lastAttempt) / (1000 * 60) : PIN_LOCKOUT_TIME + 1;
                
                if (timeSinceLastAttempt < PIN_LOCKOUT_TIME) {
                    const remainingTime = Math.ceil(PIN_LOCKOUT_TIME - timeSinceLastAttempt);
                    await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'BLOCKED', `Too many attempts, ${remainingTime} min remaining`, transaction);
                    await transaction.commit();
                    return { 
                        success: false, 
                        error: `Too many failed attempts. Please try again in ${remainingTime} minutes.`, 
                        shouldRetry: false 
                    };
                }
                
                // Reset failed attempts if lockout period has passed
                const resetRequest = transaction.request();
                resetRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
                await resetRequest.query(`
                    UPDATE Users 
                    SET FailedPinAttempts = 0, LastPinAttempt = NULL 
                    WHERE CardNumber = @cardNumber
                `);
            }
            
            // Verify PIN
            const isPinValid = await bcrypt.compare(pin, user.PIN);
            
            if (!isPinValid) {
                // Increment failed attempts
                const incrementRequest = transaction.request();
                incrementRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
                incrementRequest.input("failedAttempts", mssql.Int, failedAttempts + 1);
                incrementRequest.input("lastAttempt", mssql.DateTime, now);
                
                await incrementRequest.query(`
                    UPDATE Users 
                    SET FailedPinAttempts = @failedAttempts, LastPinAttempt = @lastAttempt
                    WHERE CardNumber = @cardNumber
                `);
                
                // Check if card should be blocked
                const newFailedAttempts = failedAttempts + 1;
                if (newFailedAttempts >= MAX_PIN_ATTEMPTS) {
                    await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'BLOCKED', 'Max PIN attempts reached', transaction);
                    await transaction.commit();
                    return { 
                        success: false, 
                        error: `Incorrect PIN. Card temporarily locked for ${PIN_LOCKOUT_TIME} minutes.`, 
                        shouldRetry: false 
                    };
                }
                
                const attemptsRemaining = MAX_PIN_ATTEMPTS - newFailedAttempts;
                await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'FAILED', `Incorrect PIN, ${attemptsRemaining} attempts remaining`, transaction);
                await transaction.commit();
                return { 
                    success: false, 
                    error: `Incorrect PIN. ${attemptsRemaining} attempts remaining.`, 
                    shouldRetry: true 
                };
            }
            
            // Successful authentication - reset failed attempts
            const successRequest = transaction.request();
            successRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
            successRequest.input("lastLogin", mssql.DateTime, now);
            
            await successRequest.query(`
                UPDATE Users 
                SET FailedPinAttempts = 0, 
                    LastPinAttempt = NULL, 
                    UpdatedAt = @lastLogin
                WHERE CardNumber = @cardNumber
            `);
            
            // Log successful login
            await logCardTransaction(user.Id, cardNumber, 'LOGIN', null, 'SUCCESS', 'Authentication successful', transaction);
            
            await transaction.commit();
            
            // Return user data (without sensitive information)
            const { PIN, ...userWithoutPin } = user;
            return {
                success: true,
                user: {
                    id: userWithoutPin.Id,
                    externalId: userWithoutPin.ExternalId,
                    fullName: userWithoutPin.FullName,
                    email: userWithoutPin.Email,
                    phone: userWithoutPin.Phone,
                    cardNumber: cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4'), // Masked for security
                    cardStatus: userWithoutPin.CardStatus,
                    cardExpiryDate: userWithoutPin.CardExpiryDate
                }
            };
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error("Card authentication error:", error);
        throw error;
    }
}

export async function createCard(userData) {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        const { name, email, phone, cardNumber, pin } = userData;
        
        // Validate inputs
        if (!name || !cardNumber || !pin) {
            throw new Error("Name, card number, and PIN are required");
        }
        
        if (!/^\d{16}$/.test(cardNumber)) {
            throw new Error("Card number must be 16 digits");
        }
        
        if (!/^\d{4}$/.test(pin)) {
            throw new Error("PIN must be 4 digits");
        }
        
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Check if card number already exists
            const checkRequest = transaction.request();
            checkRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
            
            const existingCard = await checkRequest.query(`
                SELECT Id FROM Users WHERE CardNumber = @cardNumber
            `);
            
            if (existingCard.recordset.length > 0) {
                await transaction.rollback();
                throw new Error("Card number already exists");
            }
            
            // Hash PIN
            const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
            
            // Generate external ID from card number
            const externalId = `CARD_${cardNumber}`;
            
            // Insert new user with card
            const insertRequest = transaction.request();
            insertRequest.input("externalId", mssql.NVarChar(200), externalId);
            insertRequest.input("fullName", mssql.NVarChar(200), name);
            insertRequest.input("email", mssql.NVarChar(200), email);
            insertRequest.input("phone", mssql.NVarChar(20), phone);
            insertRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
            insertRequest.input("pin", mssql.NVarChar(255), hashedPin);
            insertRequest.input("now", mssql.DateTime, new Date());
            insertRequest.input("expiryDate", mssql.DateTime, new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)); // 5 years
            
            const result = await insertRequest.query(`
                INSERT INTO Users (
                    ExternalId, FullName, Email, Phone, 
                    CardNumber, PIN, CardIssueDate, CardExpiryDate, 
                    CardStatus, FailedPinAttempts, CardBlocked,
                    CreatedAt, UpdatedAt, IsActive
                )
                OUTPUT INSERTED.Id, INSERTED.ExternalId, INSERTED.FullName, 
                       INSERTED.CardNumber, INSERTED.CardExpiryDate
                VALUES (
                    @externalId, @fullName, @email, @phone,
                    @cardNumber, @pin, @now, @expiryDate,
                    'ACTIVE', 0, 0,
                    @now, @now, 1
                )
            `);
            
            const newUser = result.recordset[0];
            
            // Log card creation
            await logCardTransaction(newUser.Id, cardNumber, 'CARD_CREATED', null, 'SUCCESS', 'New card issued', transaction);
            
            await transaction.commit();
            
            return {
                id: newUser.Id,
                externalId: newUser.ExternalId,
                fullName: newUser.FullName,
                cardNumber: cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4'), // Masked
                cardExpiryDate: newUser.CardExpiryDate
            };
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error("Card creation error:", error);
        throw error;
    }
}

export async function changePIN(cardNumber, oldPin, newPin) {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        // Validate inputs
        if (!/^\d{16}$/.test(cardNumber)) {
            throw new Error("Invalid card number format");
        }
        
        if (!/^\d{4}$/.test(oldPin) || !/^\d{4}$/.test(newPin)) {
            throw new Error("PIN must be 4 digits");
        }
        
        if (oldPin === newPin) {
            throw new Error("New PIN must be different from current PIN");
        }
        
        // First authenticate with old PIN
        const authResult = await authenticateCard(cardNumber, oldPin);
        if (!authResult.success) {
            return authResult;
        }
        
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Hash new PIN
            const hashedPin = await bcrypt.hash(newPin, SALT_ROUNDS);
            
            // Update PIN
            const updateRequest = transaction.request();
            updateRequest.input("cardNumber", mssql.NVarChar(16), cardNumber);
            updateRequest.input("newPin", mssql.NVarChar(255), hashedPin);
            updateRequest.input("now", mssql.DateTime, new Date());
            
            await updateRequest.query(`
                UPDATE Users 
                SET PIN = @newPin, UpdatedAt = @now
                WHERE CardNumber = @cardNumber
            `);
            
            // Log PIN change
            await logCardTransaction(authResult.user.id, cardNumber, 'PIN_CHANGE', null, 'SUCCESS', 'PIN changed successfully', transaction);
            
            await transaction.commit();
            
            return { success: true, message: "PIN changed successfully" };
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error("PIN change error:", error);
        throw error;
    }
}

export async function blockCard(cardNumber, reason = 'User requested') {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input("cardNumber", mssql.NVarChar(16), cardNumber);
        request.input("reason", mssql.NVarChar(100), reason);
        request.input("now", mssql.DateTime, new Date());
        
        const result = await request.query(`
            UPDATE Users 
            SET CardBlocked = 1, CardStatus = 'BLOCKED', UpdatedAt = @now
            WHERE CardNumber = @cardNumber
        `);
        
        if (result.rowsAffected[0] > 0) {
            // Get user ID for logging
            const userResult = await request.query(`SELECT Id FROM Users WHERE CardNumber = @cardNumber`);
            const userId = userResult.recordset[0]?.Id;
            
            if (userId) {
                await logCardTransaction(userId, cardNumber, 'CARD_BLOCKED', null, 'SUCCESS', reason);
            }
            
            return { success: true, message: "Card blocked successfully" };
        } else {
            return { success: false, error: "Card not found" };
        }
        
    } catch (error) {
        console.error("Card blocking error:", error);
        throw error;
    }
}

// Helper function to log card transactions
async function logCardTransaction(userId, cardNumber, transactionType, amount, status, notes, transaction = null) {
    try {
        const pool = transaction || await poolPromise;
        const request = pool.request();
        
        request.input("userId", mssql.Int, userId);
        request.input("cardNumber", mssql.NVarChar(16), cardNumber);
        request.input("transactionType", mssql.NVarChar(50), transactionType);
        request.input("amount", mssql.Decimal(18, 2), amount);
        request.input("status", mssql.NVarChar(20), status);
        request.input("notes", mssql.NVarChar(200), notes);
        
        await request.query(`
            INSERT INTO CardTransactions (UserId, CardNumber, TransactionType, Amount, Status, ATMLocation, CreatedAt)
            VALUES (@userId, @cardNumber, @transactionType, @amount, @status, @notes, GETUTCDATE())
        `);
        
    } catch (error) {
        console.error("Transaction logging error:", error);
        // Don't throw here as this is just logging
    }
}

export { logCardTransaction };