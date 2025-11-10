// controllers/authController.js
import jwt from "jsonwebtoken";
import { createSession } from "../services/sessionStore.js";
import { findUserByExternalId, createUser } from "../models/userModel.js";
import { findAccountByUserId, createAccountForUser } from "../models/accountModel.js";
import bcrypt from 'bcrypt';
import { createOtp, findValidOtp, deleteOtpById, deleteOtpsByIdentifier } from '../models/otpModel.js';
import { findUserByEmailOrPhone } from '../models/loginModel.js';
import { changeUserPassword } from '../models/loginModel.js';

const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET || "";
const TEMP_OTP_TOKEN_SECRET = process.env.TEMP_OTP_TOKEN_SECRET || (JWT_VERIFY_SECRET || 'temp-otp-secret');

/**
 * POST /auth/receive-token
 * Accepts: { token: "<jwt>" } or Authorization Bearer header
 * Decodes token, upserts minimal user & account, creates an in-memory session.
 */
export async function receiveToken(req, res) {
  const headerToken = (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
    ? req.headers.authorization.substring("Bearer ".length).trim()
    : null;
  const token = headerToken || req.body.token;
  if (!token) return res.status(400).json({ error: "Missing token (in body.token or Authorization header)" });

  let payload;
  try {
    if (JWT_VERIFY_SECRET) payload = jwt.verify(token, JWT_VERIFY_SECRET);
    else payload = jwt.decode(token);
  } catch (err) {
    return res.status(400).json({ error: "Invalid token" });
  }

  // Choose an external id
  const externalId = payload.sub || payload.email || payload.id;
  if (!externalId) return res.status(400).json({ error: "Token payload missing external id (sub/email/id)" });

  // Upsert user and ensure account exists
  try {
    let user = await findUserByExternalId(externalId);
    if (!user) {
      const created = await createUser(externalId, payload.name || null, payload.email || null);
      user = { Id: created.Id, ExternalId: externalId, FullName: payload.name, Email: payload.email };
    }
    let account = await findAccountByUserId(user.Id);
    if (!account) {
      const acc = await createAccountForUser(user.Id, 0.00, "USD");
      account = { Id: acc.Id, Balance: parseFloat(acc.Balance), Currency: acc.Currency };
    }

    // create in-memory session (expires on app restart)
    const session = createSession(externalId, payload);

    return res.json({
      message: "Simulated login successful (session created, expires on app restart).",
      session,
      user: { id: user.Id, externalId: user.ExternalId, fullName: user.FullName, email: user.Email },
      account: { id: account.Id, balance: parseFloat(account.Balance), currency: account.Currency }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error while creating user/account" });
  }
}

// POST /auth/request-otp
// body: { identifier: "email or phone" }
export async function requestOtp(req, res){
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ error: 'Missing identifier (email or phone)' });

  try{
    // find user - optional, but we'll allow requesting OTP for existing users only
    const user = await findUserByEmailOrPhone(identifier);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // remove previous OTPs for identifier and create new
    await deleteOtpsByIdentifier(identifier).catch(()=>{});
    const created = await createOtp(identifier, hashed, expiresAt);

    // In production: send via SMS/Email. For demo, return OTP in response when not in production
    console.log(`OTP for ${identifier}: ${otp} (expires ${expiresAt.toISOString()})`);

    const response = { message: 'OTP generated and (for demo) returned in response' };
    if (process.env.NODE_ENV !== 'production') response.otp = otp;

    return res.json(response);
  }catch(err){
    console.error('requestOtp error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST /auth/verify-otp
// body: { identifier, otp }
// Returns a short-lived temp token to allow password change or login
export async function verifyOtp(req, res){
  const { identifier, otp } = req.body;
  if (!identifier || !otp) return res.status(400).json({ error: 'Missing identifier or otp' });

  try{
    const rec = await findValidOtp(identifier);
    if (!rec) return res.status(400).json({ error: 'No OTP found for identifier' });
    if (new Date(rec.ExpiresAt) < new Date()){
      await deleteOtpById(rec.Id).catch(()=>{});
      return res.status(400).json({ error: 'OTP expired' });
    }

    const ok = await bcrypt.compare(otp, rec.OtpHash);
    if (!ok) return res.status(400).json({ error: 'Invalid OTP' });

    // Delete OTP after successful verification
    await deleteOtpById(rec.Id).catch(()=>{});

    // sign a short-lived token for password change (10 minutes)
    const tempToken = jwt.sign({ identifier, purpose: 'otp' }, TEMP_OTP_TOKEN_SECRET, { expiresIn: '10m' });

    return res.json({ success: true, tempToken });
  }catch(err){
    console.error('verifyOtp error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST /auth/change-password
// Accepts either Authorization: Bearer <JWT> (authenticated user) OR { tempToken, newPassword }
export async function changePassword(req, res){
  try{
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')){
      // try verify JWT (regular login JWT from loginController)
      const token = authHeader.substring(7).trim();
      try{
        const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET || process.env.JWT_SECRET || 'your-fallback-secret-key');
        userId = decoded.userId || decoded.userId;
      }catch(e){}
    }

    const { tempToken, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Missing newPassword' });

    if (!userId){
      if (!tempToken) return res.status(401).json({ error: 'Not authenticated and no tempToken provided' });
      try{
        const dec = jwt.verify(tempToken, TEMP_OTP_TOKEN_SECRET);
        if (!dec || dec.purpose !== 'otp' || !dec.identifier) return res.status(401).json({ error: 'Invalid temp token' });
        // find userId by identifier
        const user = await findUserByEmailOrPhone(dec.identifier);
        if (!user) return res.status(404).json({ error: 'User not found' });
        userId = user.Id;
      }catch(e){
        return res.status(401).json({ error: 'Invalid or expired tempToken' });
      }
    }

    const ok = await changeUserPassword(userId, newPassword);
    if (!ok) return res.status(500).json({ error: 'Failed to update password' });

    return res.json({ success: true, message: 'Password changed' });
  }catch(err){
    console.error('changePassword error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
