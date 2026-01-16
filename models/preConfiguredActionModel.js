// models/preConfiguredActionModel.js
import crypto from 'crypto';

// In-memory store for pre-configured actions (in production, use database)
// Structure: Map<actionId, { id, guardianExternalId, guardianCardNumber, action, createdAt, expiresAt, usedAt, maxUses, currentUses }>
const preConfiguredActions = new Map();

// Action expires in 7 days by default
const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * Create a pre-configured action
 * @param {Object} config - Action configuration
 * @param {string} config.guardianExternalId - Guardian's external ID
 * @param {string} config.guardianCardNumber - Guardian's card number
 * @param {string} config.guardianName - Guardian's name
 * @param {Object} config.action - Action details
 * @param {string} config.action.type - Action type (WITHDRAW, DEPOSIT, TRANSFER, CHECK_BALANCE)
 * @param {number} [config.action.amount] - Amount for transaction
 * @param {string} [config.action.recipientAccountNumber] - For transfers
 * @param {string} [config.action.description] - Transaction description
 * @param {number} [config.maxUses=1] - Maximum number of times this QR can be used
 * @param {number} [config.expiryMs] - Expiry time in milliseconds
 * @returns {Object} Created pre-configured action
 */
export function createPreConfiguredAction(config) {
  const actionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  
  const preConfiguredAction = {
    id: actionId,
    guardianExternalId: config.guardianExternalId,
    guardianCardNumber: config.guardianCardNumber,
    guardianName: config.guardianName,
    action: {
      type: config.action.type,
      amount: config.action.amount || null,
      recipientAccountNumber: config.action.recipientAccountNumber || null,
      description: config.action.description || `Pre-configured ${config.action.type.toLowerCase()}`
    },
    maxUses: config.maxUses || 1,
    currentUses: 0,
    createdAt: now,
    expiresAt: now + (config.expiryMs || DEFAULT_EXPIRY),
    usedAt: null,
    lastUsedAt: null
  };
  
  preConfiguredActions.set(actionId, preConfiguredAction);
  
  console.log(`[PreConfigured Action] Created action ${actionId} for ${config.guardianName}:`, {
    type: preConfiguredAction.action.type,
    amount: preConfiguredAction.action.amount,
    maxUses: preConfiguredAction.maxUses,
    expiresAt: new Date(preConfiguredAction.expiresAt).toISOString()
  });
  
  return preConfiguredAction;
}

/**
 * Get a pre-configured action by ID
 * @param {string} actionId - Action ID
 * @returns {Object|null} Pre-configured action or null if not found
 */
export function getPreConfiguredAction(actionId) {
  return preConfiguredActions.get(actionId) || null;
}

/**
 * Validate if a pre-configured action can be executed
 * @param {string} actionId - Action ID
 * @returns {Object} { valid: boolean, error?: string, action?: Object }
 */
export function validatePreConfiguredAction(actionId) {
  const action = preConfiguredActions.get(actionId);
  
  if (!action) {
    return { valid: false, error: 'Invalid or expired QR code' };
  }
  
  const now = Date.now();
  
  // Check if expired
  if (now > action.expiresAt) {
    preConfiguredActions.delete(actionId);
    return { valid: false, error: 'QR code has expired' };
  }
  
  // Check if already used (for single-use QR codes)
  if (action.currentUses >= action.maxUses) {
    return { valid: false, error: 'QR code has already been used' };
  }
  
  return { valid: true, action };
}

/**
 * Mark a pre-configured action as used
 * @param {string} actionId - Action ID
 * @returns {boolean} Success status
 */
export function markActionAsUsed(actionId) {
  const action = preConfiguredActions.get(actionId);
  
  if (!action) {
    return false;
  }
  
  action.currentUses++;
  action.lastUsedAt = Date.now();
  
  if (action.currentUses === 1) {
    action.usedAt = action.lastUsedAt;
  }
  
  // If max uses reached, we can optionally delete it
  if (action.currentUses >= action.maxUses) {
    console.log(`[PreConfigured Action] Action ${actionId} reached max uses (${action.maxUses})`);
  }
  
  console.log(`[PreConfigured Action] Action ${actionId} used (${action.currentUses}/${action.maxUses})`);
  
  return true;
}

/**
 * Get all pre-configured actions for a guardian
 * @param {string} guardianExternalId - Guardian's external ID
 * @returns {Array} List of pre-configured actions
 */
export function getActionsForGuardian(guardianExternalId) {
  const actions = [];
  const now = Date.now();
  
  for (const [id, action] of preConfiguredActions.entries()) {
    if (action.guardianExternalId === guardianExternalId) {
      // Filter out expired actions
      if (now <= action.expiresAt) {
        actions.push(action);
      } else {
        // Clean up expired actions
        preConfiguredActions.delete(id);
      }
    }
  }
  
  return actions;
}

/**
 * Delete a pre-configured action
 * @param {string} actionId - Action ID
 * @returns {boolean} Success status
 */
export function deletePreConfiguredAction(actionId) {
  return preConfiguredActions.delete(actionId);
}

// Cleanup expired actions periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [actionId, action] of preConfiguredActions.entries()) {
    if (now > action.expiresAt) {
      preConfiguredActions.delete(actionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[PreConfigured Action] Cleaned up ${cleaned} expired actions`);
  }
}, 60000); // Clean up every minute
