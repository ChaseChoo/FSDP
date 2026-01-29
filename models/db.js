// models/db.js
import mssql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  // Don't set port when using named instance - let SQL Server Browser handle it
  ...(process.env.DB_PORT && !process.env.DB_INSTANCE ? { port: parseInt(process.env.DB_PORT, 10) } : {}),
  connectionTimeout: 60000,
  requestTimeout: 30000,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: true,
    enableArithAbort: true,
    useUTC: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {})
  },
  pool: { 
    max: 10, 
    min: 0, 
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
};

console.log("Attempting to connect to MSSQL with config:", {
  server: dbConfig.server,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  instance: process.env.DB_INSTANCE || "<default>"
});

let poolErrorLogged = false;

const poolPromise = new mssql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log("✅ Successfully connected to MSSQL");
    return pool;
  })
  .catch(err => {
    if (!poolErrorLogged) {
      console.error("❌ MSSQL connection failed (showing once):", err.message);
      poolErrorLogged = true;
    }
    // Don't exit, let the app continue without DB for now
    return null;
  });

export { mssql, poolPromise };
