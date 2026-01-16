// Test script to verify existing features still work after guardian QR changes
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Card credentials from cardController demo
const TEST_CARD = '5555444433332222';
const TEST_PIN = '1234';

let authToken = null;

async function login() {
  console.log('\n🔐 Testing Card Login...');
  const response = await fetch(`${BASE_URL}/api/card/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardNumber: TEST_CARD, pin: TEST_PIN })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${data.error}`);
  }
  
  authToken = data.token;
  console.log('✅ Login successful');
  console.log('   Token:', authToken.substring(0, 50) + '...');
  return authToken;
}

async function getBalance() {
  console.log('\n💰 Testing Get Balance...');
  const response = await fetch(`${BASE_URL}/account/balance`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Get balance failed: ${data.error}`);
  }
  
  console.log('✅ Balance retrieved:', data.balance);
  return data.balance;
}

async function testDeposit() {
  console.log('\n💵 Testing Deposit...');
  const response = await fetch(`${BASE_URL}/account/deposit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: 50, description: 'Test deposit' })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Deposit failed: ${data.error}`);
  }
  
  console.log('✅ Deposit successful');
  console.log('   New balance:', data.newBalance);
  return data.newBalance;
}

async function testWithdraw() {
  console.log('\n💸 Testing Withdrawal...');
  const response = await fetch(`${BASE_URL}/account/withdraw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: 25, description: 'Test withdrawal' })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Withdraw failed: ${data.error}`);
  }
  
  console.log('✅ Withdrawal successful');
  console.log('   New balance:', data.newBalance);
  return data.newBalance;
}

async function testTransfer() {
  console.log('\n💱 Testing Transfer...');
  const response = await fetch(`${BASE_URL}/account/transfer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      toAccountNumber: '12345678',
      amount: 10,
      description: 'Test transfer'
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Transfer failed: ${data.error}`);
  }
  
  console.log('✅ Transfer successful');
  console.log('   New balance:', data.newBalance);
  return data.newBalance;
}

async function testApprovedRecipients() {
  console.log('\n👥 Testing Approved Recipients...');
  const response = await fetch(`${BASE_URL}/api/approved-recipients`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Get recipients failed: ${data.error}`);
  }
  
  console.log('✅ Approved recipients retrieved:', data.length, 'recipients');
  return data;
}

async function runTests() {
  try {
    console.log('=====================================');
    console.log('🧪 Testing Existing Features');
    console.log('=====================================');
    
    await login();
    const initialBalance = await getBalance();
    await testDeposit();
    await testWithdraw();
    await testTransfer();
    await testApprovedRecipients();
    const finalBalance = await getBalance();
    
    console.log('\n=====================================');
    console.log('✅ All tests passed!');
    console.log('=====================================');
    console.log('Initial balance:', initialBalance);
    console.log('Final balance:  ', finalBalance);
    console.log('Net change:     ', finalBalance - initialBalance, '(+50 -25 -10 = +15 expected)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
