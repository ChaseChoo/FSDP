// middleware/requireSession.js
import jwt from "jsonwebtoken";
import { findSession } from "../services/sessionStore.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET || "";

export default function requireSession(req, res, next) {
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

  // Expect payload.sub or payload.email as external id
  const externalId = payload.sub || payload.email || payload.id;
  if (!externalId) return res.status(400).json({ error: "Token payload missing external id (sub/email/id)" });

  const session = findSession(externalId);
  if (!session) return res.status(401).json({ error: "Not logged in (session not found). Use /auth/receive-token to simulate login." });

  // attach user info to request
  req.user = { externalId, tokenPayload: payload, session };
  next();
}
