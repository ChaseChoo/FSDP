import jwt from "jsonwebtoken";
import { findSession } from "../services/sessionStore.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET || "";

export default function requireSession(req, res, next) {
  // If an earlier middleware already set req.user (e.g. DEV_ALLOW_ALL), skip verification
  if (req.user) {
    console.log("requireSession: skipping verification because req.user is already set ->", req.user);
    return next();
  }

  // DEV: allow anonymous read access for GETs when enabled
  if (process.env.DEV_ALLOW_READ === "true" && req.method === "GET") {
    req.user = { externalId: "ANON", id: "anon", username: "anon", readonly: true };
    console.log("requireSession: DEV_ALLOW_READ active — anonymous read access granted");
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Authorization Bearer token" });

  const token = auth.substring("Bearer ".length).trim();
  let payload;
  try {
    if (JWT_VERIFY_SECRET) payload = jwt.verify(token, JWT_VERIFY_SECRET);
    else payload = jwt.decode(token);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Check if this is a card-based ATM session (has externalId in payload)
  if (payload.sessionType === 'ATM_CARD' && payload.externalId) {
    req.user = { 
      externalId: payload.externalId,
      userId: payload.userId,
      cardNumber: payload.cardNumber,
      sessionType: 'ATM_CARD',
      tokenPayload: payload
    };
    console.log("requireSession: ATM card session authenticated ->", req.user.externalId);
    return next();
  }

  // Expect payload.sub or payload.email as external id (for non-card sessions)
  const externalId = payload.sub || payload.email || payload.id || payload.externalId;
  if (!externalId) return res.status(400).json({ error: "Token payload missing external id (sub/email/id)" });

  const session = findSession(externalId);
  if (!session) return res.status(401).json({ error: "Not logged in (session not found). Use /auth/receive-token to simulate login." });

  // attach user info to request
  req.user = { externalId, tokenPayload: payload, session };
  next();
}