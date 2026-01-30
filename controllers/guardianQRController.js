// controllers/guardianQRController.js
import jwt from "jsonwebtoken";
import { getUserByCardNumber } from "../models/cardModel.js";
import { findUserByExternalId } from "../models/userModel.js";
import { findAccountByUserId } from "../models/accountModel.js";
import { createSession } from "../services/sessionStore.js";
import { getDevBalance, getDevTransactions, setDevBalance, addDevTransaction } from "./accountController.js";
import { getApprovedRecipientsByExternalId } from "../models/approvedRecipientModel.js";
import {
  createPreConfiguredAction,
  getPreConfiguredAction,
  validatePreConfiguredAction,
  markActionAsUsed,
  getActionsForGuardian,
  deletePreConfiguredAction
} from "../models/preConfiguredActionModel.js";

/**
 * POST /api/guardian/create-action-qr
 * Create a pre-configured action QR code
 * Requires authentication
 */
export async function createActionQR(req, res) {
  try {
    const { actionType, amount, recipientAccountNumber, description, maxUses, expiryDays } = req.body;
    
    // Get authenticated user info - use fallback for demo mode
    let externalId = req.user?.externalId;
    let userId = req.user?.userId; // Get userId for card-based auth
    let guardianInfo;
    
    if (!externalId) {
      // Fallback for demo mode - use the same ID as fakeLogin middleware
      console.log('[Guardian QR] No authenticated user, using demo mode');
      externalId = 'FAKE_USER'; // Same as fakeLogin middleware
      guardianInfo = {
        externalId: externalId,
        userId: null,
        cardNumber: '5555 **** **** 2222',
        name: 'Demo User'
      };
    } else {
      // For card-based auth, construct the balance key using userId
      const balanceKey = userId ? `user-${userId}` : externalId;
      
      guardianInfo = {
        externalId: balanceKey, // Use the same key as the account controller
        userId: userId,
        cardNumber: req.user.cardNumber || 'N/A',
        name: req.user.name || req.user.fullName || 'Guardian User'
      };
    }
    
    // Validate action type
    const validActionTypes = ['WITHDRAW', 'DEPOSIT', 'TRANSFER', 'CHECK_BALANCE'];
    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }
    
    // Validate amount for transactions
    if (['WITHDRAW', 'DEPOSIT', 'TRANSFER'].includes(actionType)) {
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount required for this action' });
      }
      
      // Fraud detection check for transfers over $300
      if (actionType === 'TRANSFER' && amount > 300) {
        console.log(`[Guardian QR] ⚠️ FRAUD ALERT: Transfer of $${amount} exceeds $300 threshold`);
        // You could add additional fraud detection logic here
        // For now, we'll log it and allow with warning
      }
    }
    
    // Validate recipient for transfers
    if (actionType === 'TRANSFER' && !recipientAccountNumber) {
      return res.status(400).json({ error: 'Recipient account number required for transfers' });
    }
    
    // Get guardian's info (from session or demo fallback)
    // guardianInfo already set above
    
    // Create the pre-configured action
    const expiryMs = (expiryDays || 7) * 24 * 60 * 60 * 1000;
    
    const preConfiguredAction = createPreConfiguredAction({
      guardianExternalId: guardianInfo.externalId,
      guardianCardNumber: guardianInfo.cardNumber,
      guardianName: guardianInfo.name,
      action: {
        type: actionType,
        amount: amount || null,
        recipientAccountNumber: recipientAccountNumber || null,
        description: description || `Pre-configured ${actionType.toLowerCase()}`
      },
      maxUses: maxUses || 1,
      expiryMs: expiryMs
    });
    
    console.log(`[Guardian QR] Created pre-configured action for ${guardianInfo.name}:`, {
      actionId: preConfiguredAction.id,
      type: actionType,
      amount: amount,
      maxUses: preConfiguredAction.maxUses
    });
    
    return res.json({
      success: true,
      actionId: preConfiguredAction.id,
      action: {
        type: preConfiguredAction.action.type,
        amount: preConfiguredAction.action.amount,
        description: preConfiguredAction.action.description,
        maxUses: preConfiguredAction.maxUses,
        expiresAt: preConfiguredAction.expiresAt,
        createdAt: preConfiguredAction.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating action QR:', error);
    return res.status(500).json({ error: 'Server error creating QR code' });
  }
}

/**
 * GET /api/guardian/validate-action/:actionId
 * Validate a pre-configured action QR code
 */
export async function validateActionQR(req, res) {
  try {
    const { actionId } = req.params;
    
    const validation = validatePreConfiguredAction(actionId);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        valid: false, 
        error: validation.error 
      });
    }
    
    const action = validation.action;
    
    return res.json({
      valid: true,
      action: {
        type: action.action.type,
        amount: action.action.amount,
        description: action.action.description,
        guardianName: action.guardianName,
        guardianCardNumber: action.guardianCardNumber,
        maxUses: action.maxUses,
        currentUses: action.currentUses,
        expiresAt: action.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error validating action QR:', error);
    return res.status(500).json({ error: 'Server error validating QR code' });
  }
}

/**
 * POST /api/guardian/execute-action
 * Execute a pre-configured action from QR code
 * This performs auto-login and executes the transaction
 */
export async function executePreConfiguredAction(req, res) {
  try {
    const { actionId } = req.body;
    
    // Validate the action
    const validation = validatePreConfiguredAction(actionId);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }
    
    const preConfigAction = validation.action;
    const guardianExternalId = preConfigAction.guardianExternalId;
    
    // Auto-login as guardian
    let user, account;
    
    if (process.env.DEV_ALLOW_ALL === 'true') {
      // DEV mode: Use the guardian's external ID
      const balanceKey = guardianExternalId;
      const balance = getDevBalance(balanceKey);
      
      user = {
        id: guardianExternalId,
        externalId: guardianExternalId,
        fullName: preConfigAction.guardianName,
        cardNumber: preConfigAction.guardianCardNumber
      };
      
      account = {
        id: `dev-${guardianExternalId}`,
        balance: balance,
        currency: 'SGD',
        accountNumber: `ACC-${guardianExternalId}`,
        accountType: 'SAVINGS'
      };
    } else {
      // Production mode: Get user from database
      user = await findUserByExternalId(guardianExternalId);
      if (!user) {
        return res.status(404).json({ error: 'Guardian account not found' });
      }
      
      account = await findAccountByUserId(user.Id);
      if (!account) {
        return res.status(404).json({ error: 'Guardian account not found' });
      }
    }
    
    // Create session for the guardian
    const authSession = createSession(guardianExternalId, {
      id: user.externalId,
      name: user.fullName,
      cardNumber: user.cardNumber
    });
    
    // Generate JWT token
    const token = jwt.sign(
      {
        sub: guardianExternalId,
        name: user.fullName,
        cardNumber: user.cardNumber,
        sessionType: 'ASSISTED_QR'
      },
      process.env.JWT_VERIFY_SECRET || 'fallback_secret',
      { expiresIn: '1h' } // Short-lived token for assisted transactions
    );
    
    // Execute the pre-configured action
    let transactionResult;
    const actionType = preConfigAction.action.type;
    
    switch (actionType) {
      case 'WITHDRAW':
        transactionResult = await executeWithdraw(
          guardianExternalId,
          user.id,
          preConfigAction.action.amount,
          preConfigAction.action.description
        );
        break;
        
      case 'DEPOSIT':
        transactionResult = await executeDeposit(
          guardianExternalId,
          user.id,
          preConfigAction.action.amount,
          preConfigAction.action.description
        );
        break;
        
      case 'CHECK_BALANCE':
        transactionResult = {
          success: true,
          action: 'CHECK_BALANCE',
          balance: account.balance,
          currency: account.currency || 'SGD'
        };
        break;
        
      case 'TRANSFER':
        // Check if this is a flagged transaction (>$300)
        const isFlaggedTransaction = preConfigAction.action.amount > 300;
        
        if (isFlaggedTransaction) {
          // Check if recipient is in approved list
          const approvedRecipients = await getApprovedRecipientsByExternalId(guardianExternalId);
          const recipientNumber = String(preConfigAction.action.recipientAccountNumber).replace(/\D/g, '');
          const isApprovedRecipient = approvedRecipients.some(r => 
            String(r.Value).replace(/\D/g, '') === recipientNumber
          );
          
          if (!isApprovedRecipient) {
            // Block the transaction - recipient not approved
            transactionResult = {
              success: false,
              error: 'Transaction blocked',
              fraudAlert: true,
              fraudMessage: 'This high-value transfer (>$300) was blocked because the recipient is not in your approved recipients list. Please add the recipient to your trusted list before creating a QR code for this transfer.'
            };
            break;
          }
        }
        
        transactionResult = await executeTransfer(
          guardianExternalId,
          user.id,
          preConfigAction.action.amount,
          preConfigAction.action.recipientAccountNumber,
          preConfigAction.action.description,
          isFlaggedTransaction
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action type' });
    }
    
    if (!transactionResult.success) {
      return res.status(400).json({
        success: false,
        error: transactionResult.error || 'Transaction failed'
      });
    }
    
    // Mark action as used
    markActionAsUsed(actionId);
    
    console.log(`[Guardian QR] Executed ${actionType} for ${user.fullName}:`, transactionResult);
    
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        externalId: user.externalId,
        fullName: user.fullName,
        cardNumber: user.cardNumber
      },
      account: {
        id: account.id,
        balance: transactionResult.newBalance !== undefined ? transactionResult.newBalance : account.balance,
        currency: account.currency || 'SGD',
        accountNumber: account.accountNumber,
        accountType: account.accountType || 'SAVINGS'
      },
      transaction: {
        ...transactionResult,
        recipient: transactionResult.recipient || preConfigAction.action.recipientAccountNumber
      },
      actionExecuted: {
        type: actionType,
        amount: preConfigAction.action.amount,
        description: preConfigAction.action.description
      }
    });
    
  } catch (error) {
    console.error('Error executing pre-configured action:', error);
    return res.status(500).json({ error: 'Server error executing action' });
  }
}

/**
 * GET /api/guardian/my-actions
 * Get all pre-configured actions for the authenticated guardian
 */
export async function getMyActions(req, res) {
  try {
    const externalId = req.user?.externalId;
    if (!externalId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const actions = getActionsForGuardian(externalId);
    
    return res.json({
      actions: actions.map(action => ({
        id: action.id,
        type: action.action.type,
        amount: action.action.amount,
        description: action.action.description,
        maxUses: action.maxUses,
        currentUses: action.currentUses,
        createdAt: action.createdAt,
        expiresAt: action.expiresAt,
        usedAt: action.usedAt,
        lastUsedAt: action.lastUsedAt
      }))
    });
    
  } catch (error) {
    console.error('Error getting guardian actions:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * DELETE /api/guardian/action/:actionId
 * Delete a pre-configured action
 */
export async function deleteAction(req, res) {
  try {
    const { actionId } = req.params;
    const externalId = req.user?.externalId;
    
    if (!externalId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify ownership
    const action = getPreConfiguredAction(actionId);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }
    
    if (action.guardianExternalId !== externalId) {
      return res.status(403).json({ error: 'Not authorized to delete this action' });
    }
    
    deletePreConfiguredAction(actionId);
    
    return res.json({ success: true, message: 'Action deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting action:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Helper functions for executing transactions

async function executeWithdraw(externalId, userId, amount, description) {
  if (process.env.DEV_ALLOW_ALL === 'true') {
    // DEV mode - use externalId directly for consistent balance lookup
    const key = externalId;
    const currentBalance = getDevBalance(key);
    
    console.log(`[Guardian Withdraw] Key: ${key}, Balance: ${currentBalance}, Amount: ${amount}`);
    
    if (currentBalance < amount) {
      console.log(`[Guardian Withdraw] Insufficient funds: ${currentBalance} < ${amount}`);
      return { success: false, error: 'Insufficient funds' };
    }
    
    const newBalance = currentBalance - amount;
    setDevBalance(key, newBalance);
    addDevTransaction(key, 'WITHDRAWAL', amount, newBalance, description);
    
    console.log(`[Guardian Withdraw] Success! New balance: ${newBalance}`);
    
    return {
      success: true,
      action: 'WITHDRAW',
      amount: amount,
      newBalance: newBalance,
      transaction: {
        Type: 'WITHDRAWAL',
        Amount: amount,
        BalanceAfter: newBalance,
        Description: description,
        CreatedAt: new Date()
      }
    };
  } else {
    // Production mode - would need to implement proper DB transaction
    return { success: false, error: 'Production mode not yet implemented' };
  }
}

async function executeDeposit(externalId, userId, amount, description) {
  if (process.env.DEV_ALLOW_ALL === 'true') {
    // DEV mode - use externalId directly for consistent balance lookup
    const key = externalId;
    const currentBalance = getDevBalance(key);
    const newBalance = currentBalance + amount;
    
    setDevBalance(key, newBalance);
    addDevTransaction(key, 'DEPOSIT', amount, newBalance, description);
    
    return {
      success: true,
      action: 'DEPOSIT',
      amount: amount,
      newBalance: newBalance,
      transaction: {
        Type: 'DEPOSIT',
        Amount: amount,
        BalanceAfter: newBalance,
        Description: description,
        CreatedAt: new Date()
      }
    };
  } else {
    // Production mode
    return { success: false, error: 'Production mode not yet implemented' };
  }
}

async function executeTransfer(externalId, userId, amount, recipient, description, isFraudFlagged) {
  if (process.env.DEV_ALLOW_ALL === 'true') {
    // DEV mode - use externalId directly for consistent balance lookup
    const key = externalId;
    console.log(`[executeTransfer] externalId: ${externalId}, userId: ${userId}, key: ${key}`);
    const currentBalance = getDevBalance(key);
    console.log(`[executeTransfer] Current balance for ${key}: ${currentBalance}, amount: ${amount}`);
    
    if (currentBalance < amount) {
      return { success: false, error: 'Insufficient funds' };
    }
    
    const newBalance = currentBalance - amount;
    setDevBalance(key, newBalance);
    addDevTransaction(key, 'TRANSFER', amount, newBalance, description || `Transfer to ${recipient}`);
    
    // Log fraud detection if amount over $300
    if (isFraudFlagged) {
      console.log(`[Guardian QR] ⚠️ FRAUD DETECTION: Transfer of $${amount} flagged (over $300 threshold)`);
    }
    
    return {
      success: true,
      action: 'TRANSFER',
      amount: amount,
      recipient: recipient,
      newBalance: newBalance,
      fraudAlert: isFraudFlagged,
      fraudMessage: isFraudFlagged ? `This transfer of $${amount} has been flagged for review (exceeds $300 limit). Transaction is logged for security monitoring.` : null,
      transaction: {
        Type: 'TRANSFER',
        Amount: amount,
        BalanceAfter: newBalance,
        Description: description || `Transfer to ${recipient}`,
        CreatedAt: new Date()
      }
    };
  } else {
    // Production mode
    return { success: false, error: 'Production mode not yet implemented' };
  }
}
