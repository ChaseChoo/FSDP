// Test guardian QR with fraud blocking
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_CARD = '5555444433332222';
const TEST_PIN = '1234';

async function login() {
  const response = await fetch(`${BASE_URL}/api/card/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardNumber: TEST_CARD, pin: TEST_PIN })
  });
  const data = await response.json();
  return data.token;
}

async function testGuardianQR() {
  console.log('=====================================');
  console.log('🧪 Testing Guardian QR Fraud Blocking');
  console.log('=====================================\n');

  const token = await login();
  console.log('✅ Logged in\n');

  // Test 1: Create QR for transfer to APPROVED recipient ($400 to 91234567)
  console.log('Test 1: Transfer $400 to APPROVED recipient (91234567)');
  const approvedQR = await fetch(`${BASE_URL}/api/guardian/create-action-qr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      actionType: 'TRANSFER',
      amount: 400,
      recipientAccountNumber: '91234567',
      description: 'Test approved transfer',
      maxUses: 1,
      expiryDays: 7
    })
  });

  const approvedData = await approvedQR.json();
  if (approvedData.actionId) {
    console.log('✅ QR created for approved recipient:', approvedData.actionId.substring(0, 20) + '...');
    
    // Execute it
    const execApproved = await fetch(`${BASE_URL}/api/guardian/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: approvedData.actionId })
    });
    const execApprovedData = await execApproved.json();
    
    if (execApprovedData.success) {
      console.log('✅ Transaction ALLOWED (approved recipient)');
      console.log(`   Fraud flagged: ${execApprovedData.fraudAlert || false}`);
      console.log(`   New balance: $${execApprovedData.newBalance}\n`);
    } else {
      console.log('❌ Transaction failed:', execApprovedData.error, '\n');
    }
  } else {
    console.log('❌ Failed to create QR:', approvedData.error, '\n');
  }

  // Test 2: Create QR for transfer to NON-APPROVED recipient ($400 to 88888888)
  console.log('Test 2: Transfer $400 to NON-APPROVED recipient (88888888)');
  const blockedQR = await fetch(`${BASE_URL}/api/guardian/create-action-qr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      actionType: 'TRANSFER',
      amount: 400,
      recipientAccountNumber: '88888888',
      description: 'Test blocked transfer',
      maxUses: 1,
      expiryDays: 7
    })
  });

  const blockedData = await blockedQR.json();
  if (blockedData.actionId) {
    console.log('✅ QR created:', blockedData.actionId.substring(0, 20) + '...');
    
    // Execute it
    const execBlocked = await fetch(`${BASE_URL}/api/guardian/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: blockedData.actionId })
    });
    const execBlockedData = await execBlocked.json();
    
    if (execBlockedData.success) {
      console.log('❌ PROBLEM: Transaction was ALLOWED (should be blocked!)');
      console.log(`   New balance: $${execBlockedData.newBalance}\n`);
    } else if (execBlockedData.fraudAlert) {
      console.log('✅ Transaction BLOCKED (fraud protection)');
      console.log(`   Reason: ${execBlockedData.fraudMessage}\n`);
    } else {
      console.log('❌ Transaction failed but not fraud-related:', execBlockedData.error, '\n');
    }
  } else {
    console.log('❌ Failed to create QR:', blockedData.error, '\n');
  }

  // Test 3: Small transfer (no fraud check)
  console.log('Test 3: Transfer $50 to any recipient (under threshold)');
  const smallQR = await fetch(`${BASE_URL}/api/guardian/create-action-qr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      actionType: 'TRANSFER',
      amount: 50,
      recipientAccountNumber: '99999999',
      description: 'Small transfer test',
      maxUses: 1,
      expiryDays: 7
    })
  });

  const smallData = await smallQR.json();
  if (smallData.actionId) {
    console.log('✅ QR created:', smallData.actionId.substring(0, 20) + '...');
    
    const execSmall = await fetch(`${BASE_URL}/api/guardian/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: smallData.actionId })
    });
    const execSmallData = await execSmall.json();
    
    if (execSmallData.success) {
      console.log('✅ Transaction ALLOWED (under $300 threshold)');
      console.log(`   New balance: $${execSmallData.newBalance}\n`);
    } else {
      console.log('❌ Transaction failed:', execSmallData.error, '\n');
    }
  } else {
    console.log('❌ Failed to create QR:', smallData.error, '\n');
  }

  console.log('=====================================');
  console.log('✅ All Guardian QR tests completed!');
  console.log('=====================================');
}

testGuardianQR().catch(err => {
  console.error('❌ Test error:', err);
  process.exit(1);
});
