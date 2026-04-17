const mysql = require('mysql2/promise');
const fs = require('fs');

// Leer .env manualmente
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim().replace(/'/g, "").replace(/"/g, "");
  }
});

async function checkTime() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  });

  try {
    const [nowRows] = await connection.query('SELECT NOW() as db_now_local, UTC_TIMESTAMP() as db_now_utc');
    const [latestRows] = await connection.query('SELECT update_time FROM registros ORDER BY update_time DESC LIMIT 1');
    
    const result = {
      database_now_local: nowRows[0].db_now_local,
      database_now_utc: nowRows[0].db_now_utc,
      latest_record_time: latestRows.length > 0 ? latestRows[0].update_time : null,
      server_system_time: new Date().toString(),
      server_iso_time: new Date().toISOString()
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkTime();
