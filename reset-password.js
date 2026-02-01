import sql from 'mssql';

// Use Windows Authentication to connect as admin
const config = {
  server: 'localhost',
  database: 'master',
  port: 51455,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true
  },
};

console.log('Connecting to SQL Server with Windows Authentication...');

sql.connect(config)
  .then(pool => {
    console.log('✓ Connected successfully\n');
    
    // Reset the password for myuser
    console.log('Resetting password for user: myuser');
    return pool.request().query(`
      ALTER LOGIN myuser WITH PASSWORD = 'FSDP123', CHECK_POLICY = OFF;
    `);
  })
  .then(() => {
    console.log('✓ Password reset successfully!\n');
    console.log('User credentials:');
    console.log('  Username: myuser');
    console.log('  Password: FSDP123');
    console.log('  CHECK_POLICY: OFF (password won\'t expire)');
    console.log('\n✅ Database user is ready to use!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Failed to reset password!');
    console.error('Error:', err.message);
    console.error('\nPossible reasons:');
    console.error('  1. You need to run this as Windows Administrator');
    console.error('  2. Your Windows user doesn\'t have SQL Server admin rights');
    console.error('  3. SQL Server mixed mode authentication is disabled');
    console.error('\nTry running PowerShell as Administrator and run this script again.');
    process.exit(1);
  });
