const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "imsdb",
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "admin1234",
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
    encrypt: process.env.DB_ENCRYPT === "true",
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    },
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    throw err;
  });

module.exports = { sql, poolPromise };