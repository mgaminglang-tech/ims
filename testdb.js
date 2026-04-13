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