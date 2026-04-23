const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'imsdb',
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'admin1234',
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    encrypt: process.env.DB_ENCRYPT === 'true',
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
    },
  },
};

async function testConnection() {
  try {
    console.log('Connecting...');
    await sql.connect(config);
    console.log('✅ Connected successfully!');
    sql.close();
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testConnection();