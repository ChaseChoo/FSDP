import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

// Test with SQL Authentication
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 51455, // Dynamic port
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
};

console.log('Testing database connection...');
console.log('Configuration:');
console.log('  Server:', config.server);
console.log('  Database:', config.database);
console.log('  User:', config.user);
console.log('  Port:', 51455);
console.log('');

sql.connect(config)
  .then(pool => {
    console.log('✓ Database connected successfully!\n');
    
    // Test query to get SQL Server version and database name
    return pool.request().query(`
      SELECT 
        @@VERSION as Version,
        DB_NAME() as DatabaseName,
        SUSER_NAME() as LoginUser,
        GETDATE() as CurrentTime
    `);
  })
  .then(result => {
    const info = result.recordset[0];
    console.log('Database Information:');
    console.log('  SQL Server:', info.Version.split('\n')[0]);
    console.log('  Current Database:', info.DatabaseName);
    console.log('  Connected User:', info.LoginUser);
    console.log('  Server Time:', info.CurrentTime);
    console.log('');
    
    // Test if we can query tables
    return sql.query('SELECT COUNT(*) as TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
  })
  .then(result => {
    console.log('✓ Tables found:', result.recordset[0].TableCount);
    console.log('');
    console.log('✅ Database is working correctly!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', err.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('  1. Check if SQL Server service is running');
    console.error('  2. Verify SQL Server Browser service is started');
    console.error('  3. Ensure TCP/IP is enabled in SQL Server Configuration Manager');
    console.error('  4. Check firewall allows port 1433');
    console.error('  5. Verify credentials in .env file are correct');
    console.error('  6. Confirm database "FSDP" exists');
    process.exit(1);
  });
