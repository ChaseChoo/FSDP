// models/loginModel.js
import { poolPromise, mssql } from "./db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function createUser(userData) {
    const { name, email, phone, password } = userData;
    
    try {
        const pool = await poolPromise;
        
        // Check if pool is available
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        const transaction = new mssql.Transaction(pool);
        
        await transaction.begin();
        
        try {
            // Check if user already exists
            const checkRequest = transaction.request();
            checkRequest.input("email", mssql.NVarChar(200), email);
            checkRequest.input("phone", mssql.NVarChar(20), phone);
            
            const existingUser = await checkRequest.query(`
                SELECT Id FROM Users 
                WHERE Email = @email OR Phone = @phone OR ExternalId = @email
            `);
            
            if (existingUser.recordset.length > 0) {
                await transaction.rollback();
                throw new Error("User with this email or phone already exists");
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Insert new user
            const insertRequest = transaction.request();
            insertRequest.input("externalId", mssql.NVarChar(200), email); // Use email as external ID
            insertRequest.input("fullName", mssql.NVarChar(200), name);
            insertRequest.input("email", mssql.NVarChar(200), email);
            insertRequest.input("phone", mssql.NVarChar(20), phone);
            insertRequest.input("password", mssql.NVarChar(255), hashedPassword);
            
            const result = await insertRequest.query(`
                INSERT INTO Users (ExternalId, FullName, Email, Phone, Password, CreatedAt, UpdatedAt, IsActive)
                OUTPUT INSERTED.Id, INSERTED.ExternalId, INSERTED.FullName, INSERTED.Email, INSERTED.Phone, INSERTED.CreatedAt
                VALUES (@externalId, @fullName, @email, @phone, @password, GETUTCDATE(), GETUTCDATE(), 1)
            `);
            
            await transaction.commit();
            return result.recordset[0];
            
        } catch (error) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

export async function authenticateUser(emailOrPhone, password) {
    try {
        const pool = await poolPromise;
        
        // Check if pool is available
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        const request = pool.request();
        
        request.input("identifier", mssql.NVarChar(200), emailOrPhone);
        
        const result = await request.query(`
            SELECT Id, ExternalId, FullName, Email, Phone, Password, IsActive
            FROM Users 
            WHERE (Email = @identifier OR Phone = @identifier OR ExternalId = @identifier) 
            AND IsActive = 1
        `);
        
        if (result.recordset.length === 0) {
            return null; // User not found
        }
        
        const user = result.recordset[0];
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        
        if (!isPasswordValid) {
            return null; // Invalid password
        }
        
        // Remove password from returned user object
        const { Password, ...userWithoutPassword } = user;
        
        return userWithoutPassword;
        
    } catch (error) {
        console.error("Error authenticating user:", error);
        throw error;
    }
}

export async function findUserByEmailOrPhone(emailOrPhone) {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            throw new Error("Database connection not available");
        }
        
        const request = pool.request();
        
        request.input("identifier", mssql.NVarChar(200), emailOrPhone);
        
        const result = await request.query(`
            SELECT Id, ExternalId, FullName, Email, Phone, IsActive
            FROM Users 
            WHERE (Email = @identifier OR Phone = @identifier OR ExternalId = @identifier)
        `);
        
        return result.recordset[0] || null;
        
    } catch (error) {
        console.error("Error finding user:", error);
        throw error;
    }
}

export async function updateUserLastLogin(userId) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input("userId", mssql.Int, userId);
        
        await request.query(`
            UPDATE Users 
            SET UpdatedAt = GETUTCDATE() 
            WHERE Id = @userId
        `);
        
    } catch (error) {
        console.error("Error updating user last login:", error);
        throw error;
    }
}

export async function changeUserPassword(userId, newPassword) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        request.input("userId", mssql.Int, userId);
        request.input("password", mssql.NVarChar(255), hashedPassword);
        
        const result = await request.query(`
            UPDATE Users 
            SET Password = @password, UpdatedAt = GETUTCDATE()
            WHERE Id = @userId AND IsActive = 1
        `);
        
        return result.rowsAffected[0] > 0;
        
    } catch (error) {
        console.error("Error changing user password:", error);
        throw error;
    }
}

export async function deactivateUser(userId) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input("userId", mssql.Int, userId);
        
        const result = await request.query(`
            UPDATE Users 
            SET IsActive = 0, UpdatedAt = GETUTCDATE()
            WHERE Id = @userId
        `);
        
        return result.rowsAffected[0] > 0;
        
    } catch (error) {
        console.error("Error deactivating user:", error);
        throw error;
    }
}