const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'imsdb',
  port: 1433,
  user: 'sa',
  password: 'admin1234',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
    },
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch((err) => console.error('❌ Connection failed:', err.message));

module.exports = { sql, poolPromise };