const mysql = require('mysql2/promise');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) process.env[key.trim()] = value.trim().replace(/['"]/g, "").replace(/"/g, "");
});
async function f() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dateStrings: true // IMPORTANTE: para ver el string real sin conversiones
  });
  const [now] = await c.query('SELECT NOW() as n, UTC_TIMESTAMP() as u');
  const [reg] = await c.query('SELECT update_time FROM registros ORDER BY update_time DESC LIMIT 1');
  console.log('--- RESULTADOS RAW ---');
  console.log('Hora actual DB (NOW):  ', now[0].n);
  console.log('Hora actual DB (UTC):  ', now[0].u);
  if (reg[0]) console.log('Ultimo registro (DB):  ', reg[0].update_time);
  console.log('Hora actual Servidor:  ', new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }));
  await c.end();
}
f();
