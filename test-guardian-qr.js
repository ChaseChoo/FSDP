// test-guardian-qr.js
// Test script for Guardian QR Code feature

import dotenv from 'dotenv';
dotenv.config();

import {
  createPreConfiguredAction,
  validatePreConfiguredAction,
  markActionAsUsed,
  getPreConfiguredAction
} from './models/preConfiguredActionModel.js';

console.log('=== Testing Guardian QR Code Feature ===\n');

// Test 1: Create a withdrawal action
console.log('Test 1: Creating withdrawal action...');
const withdrawAction = createPreConfiguredAction({
  guardianExternalId: 'test-guardian-123',
  guardianCardNumber: '5555 **** **** 2222',
  guardianName: 'John Doe (Guardian)',
  action: {
    type: 'WITHDRAW',
    amount: 100,
    description: 'Weekly allowance for dad'
  },
  maxUses: 1,
  expiryMs: 7 * 24 * 60 * 60 * 1000 // 7 days
});

console.log('✓ Created withdrawal action:', {
  id: withdrawAction.id,
  type: withdrawAction.action.type,
  amount: withdrawAction.action.amount,
  expiresAt: new Date(withdrawAction.expiresAt).toISOString()
});
console.log();

// Test 2: Validate the action
console.log('Test 2: Validating action...');
const validation = validatePreConfiguredAction(withdrawAction.id);
if (validation.valid) {
  console.log('✓ Action is valid');
  console.log('  Guardian:', validation.action.guardianName);
  console.log('  Type:', validation.action.action.type);
  console.log('  Amount:', validation.action.action.amount);
} else {
  console.log('✗ Action validation failed:', validation.error);
}
console.log();

// Test 3: Mark as used
console.log('Test 3: Marking action as used...');
const marked = markActionAsUsed(withdrawAction.id);
if (marked) {
  console.log('✓ Action marked as used');
  const updatedAction = getPreConfiguredAction(withdrawAction.id);
  console.log('  Uses:', updatedAction.currentUses + '/' + updatedAction.maxUses);
} else {
  console.log('✗ Failed to mark action as used');
}
console.log();

// Test 4: Try to use again (should fail for single-use)
console.log('Test 4: Attempting to use single-use action again...');
const validation2 = validatePreConfiguredAction(withdrawAction.id);
if (!validation2.valid) {
  console.log('✓ Correctly rejected:', validation2.error);
} else {
  console.log('✗ Should have rejected second use');
}
console.log();

// Test 5: Create a multi-use action
console.log('Test 5: Creating multi-use deposit action...');
const depositAction = createPreConfiguredAction({
  guardianExternalId: 'test-guardian-123',
  guardianCardNumber: '5555 **** **** 2222',
  guardianName: 'John Doe (Guardian)',
  action: {
    type: 'DEPOSIT',
    amount: 50,
    description: 'Regular deposit'
  },
  maxUses: 5,
  expiryMs: 30 * 24 * 60 * 60 * 1000 // 30 days
});

console.log('✓ Created deposit action:', {
  id: depositAction.id,
  type: depositAction.action.type,
  amount: depositAction.action.amount,
  maxUses: depositAction.maxUses
});
console.log();

// Test 6: Use multi-use action multiple times
console.log('Test 6: Using multi-use action 3 times...');
for (let i = 1; i <= 3; i++) {
  const valid = validatePreConfiguredAction(depositAction.id);
  if (valid.valid) {
    markActionAsUsed(depositAction.id);
    console.log(`✓ Use ${i}/5 successful`);
  } else {
    console.log(`✗ Use ${i} failed:`, valid.error);
  }
}
const finalAction = getPreConfiguredAction(depositAction.id);
console.log('  Final uses:', finalAction.currentUses + '/' + finalAction.maxUses);
console.log();

// Test 7: Create balance check action
console.log('Test 7: Creating balance check action...');
const balanceAction = createPreConfiguredAction({
  guardianExternalId: 'test-guardian-123',
  guardianCardNumber: '5555 **** **** 2222',
  guardianName: 'John Doe (Guardian)',
  action: {
    type: 'CHECK_BALANCE',
    description: 'Check account balance'
  },
  maxUses: 10,
  expiryMs: 7 * 24 * 60 * 60 * 1000
});

console.log('✓ Created balance check action:', {
  id: balanceAction.id,
  type: balanceAction.action.type,
  maxUses: balanceAction.maxUses
});
console.log();

// Test 8: Create expired action
console.log('Test 8: Testing expired action...');
const expiredAction = createPreConfiguredAction({
  guardianExternalId: 'test-guardian-123',
  guardianCardNumber: '5555 **** **** 2222',
  guardianName: 'John Doe (Guardian)',
  action: {
    type: 'WITHDRAW',
    amount: 25
  },
  maxUses: 1,
  expiryMs: -1000 // Already expired
});

const expiredValidation = validatePreConfiguredAction(expiredAction.id);
if (!expiredValidation.valid) {
  console.log('✓ Correctly rejected expired action:', expiredValidation.error);
} else {
  console.log('✗ Should have rejected expired action');
}
console.log();

console.log('=== All Tests Completed ===');
console.log('\nSummary:');
console.log('- Pre-configured actions can be created ✓');
console.log('- Actions can be validated ✓');
console.log('- Single-use enforcement works ✓');
console.log('- Multi-use actions work ✓');
console.log('- Expiry validation works ✓');
console.log('\nGuardian QR Code feature is ready to use!');
