// Test script to check transaction history
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_CARD = '5555444433332222';
const TEST_PIN = '1234';

async function test() {
  // Login
  console.log('Logging in...');
  const loginRes = await fetch(`${BASE_URL}/api/card/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardNumber: TEST_CARD, pin: TEST_PIN })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in successfully\n');

  // Get transactions
  console.log('Fetching transaction history...');
  const txRes = await fetch(`${BASE_URL}/api/transactions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const txData = await txRes.json();
  
  console.log(`Found ${txData.transactions.length} transactions\n`);
  console.log('Recent transactions:');
  console.log('='.repeat(80));
  
  txData.transactions.slice(0, 10).forEach((tx, idx) => {
    console.log(`${idx + 1}. ${tx.Type.padEnd(15)} | $${String(tx.Amount).padStart(6)} | ${tx.Description || 'N/A'}`);
    console.log(`   Date: ${new Date(tx.CreatedAt).toLocaleString()}`);
    console.log(`   Balance After: $${tx.BalanceAfter}`);
    console.log('-'.repeat(80));
  });
  
  // Check for guardian QR transactions
  const guardianTx = txData.transactions.filter(tx => 
    tx.Description && tx.Description.includes('Pre-configured')
  );
  
  console.log(`\n✅ Found ${guardianTx.length} guardian QR transactions`);
  if (guardianTx.length > 0) {
    console.log('Guardian QR transactions:');
    guardianTx.forEach(tx => {
      console.log(`  - ${tx.Type}: $${tx.Amount} (${tx.Description})`);
    });
  }
}

test().catch(console.error);
