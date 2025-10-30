// services/sessionStore.js
// Simple in-memory session store: externalId => session { externalId, payload, createdAt, lastSeen }
const sessions = new Map();

export function createSession(externalId, payload) {
  const session = { externalId, payload, createdAt: new Date(), lastSeen: new Date() };
  sessions.set(externalId, session);
  return session;
}

export function findSession(externalId) {
  const s = sessions.get(externalId);
  if (s) s.lastSeen = new Date();
  return s || null;
}

export function deleteSession(externalId) {
  sessions.delete(externalId);
}

export function clearSessions() {
  sessions.clear();
}

// Export size for debugging
export function sessionCount() {
  return sessions.size;
}
