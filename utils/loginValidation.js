// utils/loginValidation.js
import validator from 'validator';

export function validateSignupData(data) {
    const errors = [];
    const { name, email, phone, password, confirmPassword } = data;
    
    // Validate name
    if (!name || typeof name !== 'string') {
        errors.push("Name is required");
    } else if (name.trim().length < 2) {
        errors.push("Name must be at least 2 characters long");
    } else if (name.trim().length > 100) {
        errors.push("Name must be less than 100 characters");
    }
    
    // Validate email
    if (!email || typeof email !== 'string') {
        errors.push("Email is required");
    } else if (!validator.isEmail(email)) {
        errors.push("Please enter a valid email address");
    }
    
    // Validate phone
    if (!phone || typeof phone !== 'string') {
        errors.push("Phone number is required");
    } else if (!isValidSingaporePhone(phone)) {
        errors.push("Please enter a valid Singapore phone number (8 digits starting with 8 or 9)");
    }
    
    // Validate password
    if (!password || typeof password !== 'string') {
        errors.push("Password is required");
    } else if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    } else if (password.length > 128) {
        errors.push("Password must be less than 128 characters");
    } else if (!isStrongPassword(password)) {
        errors.push("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
        errors.push("Password confirmation is required");
    } else if (password !== confirmPassword) {
        errors.push("Passwords do not match");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

export function validateLoginData(data) {
    const errors = [];
    const { email, password } = data;
    
    // Validate email/phone identifier
    if (!email || typeof email !== 'string') {
        errors.push("Email or phone number is required");
    } else if (email.trim().length === 0) {
        errors.push("Email or phone number cannot be empty");
    }
    
    // Validate password
    if (!password || typeof password !== 'string') {
        errors.push("Password is required");
    } else if (password.length === 0) {
        errors.push("Password cannot be empty");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

export function validatePasswordChange(data) {
    const errors = [];
    const { currentPassword, newPassword, confirmPassword } = data;
    
    // Validate current password
    if (!currentPassword || typeof currentPassword !== 'string') {
        errors.push("Current password is required");
    }
    
    // Validate new password
    if (!newPassword || typeof newPassword !== 'string') {
        errors.push("New password is required");
    } else if (newPassword.length < 8) {
        errors.push("New password must be at least 8 characters long");
    } else if (newPassword.length > 128) {
        errors.push("New password must be less than 128 characters");
    } else if (!isStrongPassword(newPassword)) {
        errors.push("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }
    
    // Check if new password is different from current
    if (currentPassword === newPassword) {
        errors.push("New password must be different from current password");
    }
    
    // Validate password confirmation
    if (!confirmPassword) {
        errors.push("Password confirmation is required");
    } else if (newPassword !== confirmPassword) {
        errors.push("New passwords do not match");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Helper function to validate Singapore phone numbers
function isValidSingaporePhone(phone) {
    // Remove any spaces, dashes, or plus signs
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    // Check for Singapore mobile numbers (8 digits starting with 8 or 9)
    // or landline numbers (8 digits starting with 6)
    const sgMobileRegex = /^[89]\d{7}$/;
    const sgLandlineRegex = /^6\d{7}$/;
    
    return sgMobileRegex.test(cleanPhone) || sgLandlineRegex.test(cleanPhone);
}

// Helper function to check password strength
function isStrongPassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Sanitize user input
export function sanitizeUserData(data) {
    const sanitized = {};
    
    // Sanitize string fields
    for (const key in data) {
        if (data[key] && typeof data[key] === 'string') {
            sanitized[key] = data[key].trim();
        } else {
            sanitized[key] = data[key];
        }
    }
    
    return sanitized;
}

// Rate limiting helper (simple in-memory implementation)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);
    
    if (!attempts) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }
    
    // Clean up old attempts (older than lockout time)
    const recentAttempts = attempts.filter(attempt => now - attempt < LOCKOUT_TIME);
    
    if (recentAttempts.length < MAX_ATTEMPTS) {
        return { 
            allowed: true, 
            remainingAttempts: MAX_ATTEMPTS - recentAttempts.length 
        };
    }
    
    const oldestAttempt = Math.min(...recentAttempts);
    const timeUntilUnlock = LOCKOUT_TIME - (now - oldestAttempt);
    
    return { 
        allowed: false, 
        remainingAttempts: 0,
        timeUntilUnlock: Math.ceil(timeUntilUnlock / 1000 / 60) // minutes
    };
}

export function recordLoginAttempt(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || [];
    
    // Add current attempt
    attempts.push(now);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(attempt => now - attempt < LOCKOUT_TIME);
    
    loginAttempts.set(identifier, recentAttempts);
}

export function clearLoginAttempts(identifier) {
    loginAttempts.delete(identifier);
}