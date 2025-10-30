// models/db.js
import mssql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === "true",
    trustServerCertificate: process.env.MSSQL_ENCRYPT !== "true",
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const poolPromise = new mssql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch(err => {
    console.error("MSSQL connection failed:", err);
    process.exit(1);
  });

export { mssql, poolPromise };
