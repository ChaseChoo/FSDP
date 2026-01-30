// test-wallet-persistence.js
// Test script to verify persistent wallet storage

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET_ID = `test-wallet-${Date.now()}`;
const TEST_WALLET_TYPE = 'alipay';

console.log('🧪 Testing Wallet Persistent Storage\n');
console.log('=' .repeat(60));
console.log(`Test Wallet ID: ${TEST_WALLET_ID}`);
console.log(`Test Wallet Type: ${TEST_WALLET_TYPE}`);
console.log('=' .repeat(60));
console.log('');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWalletPersistence() {
  try {
    // Test 1: Get initial balance (should be 0 for new wallet)
    console.log('📊 Test 1: Get Initial Balance');
    console.log('-'.repeat(60));
    const balanceResponse1 = await fetch(`${BASE_URL}/api/wallet/balance/${TEST_WALLET_ID}`);
    const balanceData1 = await balanceResponse1.json();
    console.log('Initial Balance:', balanceData1);
    console.log('✅ Test 1 Passed: Initial balance retrieved\n');
    
    await sleep(1000);

    // Test 2: Get wallet summary (should create wallet if not exists)
    console.log('📊 Test 2: Get Wallet Summary');
    console.log('-'.repeat(60));
    const summaryResponse1 = await fetch(`${BASE_URL}/api/wallet/summary/${TEST_WALLET_ID}?type=${TEST_WALLET_TYPE}`);
    const summaryData1 = await summaryResponse1.json();
    console.log('Wallet Summary:', {
      walletId: summaryData1.wallet.WalletId,
      walletType: summaryData1.wallet.WalletType,
      balance: summaryData1.wallet.Balance,
      transactionCount: summaryData1.transactions.length
    });
    console.log('✅ Test 2 Passed: Wallet summary retrieved\n');
    
    await sleep(1000);

    // Test 3: Check transaction history (should be empty initially)
    console.log('📊 Test 3: Get Transaction History');
    console.log('-'.repeat(60));
    const txResponse1 = await fetch(`${BASE_URL}/api/wallet/transactions/${TEST_WALLET_ID}`);
    const txData1 = await txResponse1.json();
    console.log('Transaction History:', {
      transactionCount: txData1.transactions.length,
      transactions: txData1.transactions
    });
    console.log('✅ Test 3 Passed: Transaction history retrieved\n');
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ All Tests Passed!');
    console.log('=' .repeat(60));
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Transfer money from ATM to this wallet');
    console.log('2. Check the database:');
    console.log(`   SELECT * FROM WalletBalances WHERE WalletId = '${TEST_WALLET_ID}';`);
    console.log(`   SELECT * FROM WalletTransactions WHERE WalletId = '${TEST_WALLET_ID}';`);
    console.log('');
    console.log('🌐 Open wallet in browser:');
    console.log(`   ${BASE_URL}/wallet-alipay?walletId=${TEST_WALLET_ID}&type=${TEST_WALLET_TYPE}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure server is running: node server.js');
    console.error('2. Check database tables exist: Run CREATE_WALLET_TABLES.sql');
    console.error('3. Verify database connection in .env file');
    process.exit(1);
  }
}

// Additional test to verify database queries
console.log('💡 Tip: After running this test, you can verify in SQL Server:');
console.log('');
console.log('USE FSDP;');
console.log('SELECT * FROM WalletBalances;');
console.log('SELECT * FROM WalletTransactions;');
console.log('');
console.log('Starting tests in 2 seconds...\n');

setTimeout(() => {
  testWalletPersistence();
}, 2000);
