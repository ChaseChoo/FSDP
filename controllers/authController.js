// controllers/authController.js
import jwt from "jsonwebtoken";
import { createSession } from "../services/sessionStore.js";
import { findUserByExternalId, createUser } from "../models/userModel.js";
import { findAccountByUserId, createAccountForUser } from "../models/accountModel.js";

const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET || "";

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
