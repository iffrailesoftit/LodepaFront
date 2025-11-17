// lib/db.ts
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.MYSQL_HOST, // Dirección del servidor MySQL
  user: process.env.MYSQL_USER, // Usuario
  password: process.env.MYSQL_PASSWORD, // Contraseña
  database: process.env.MYSQL_DATABASE, // Nombre de la base de datos
  port: parseInt(process.env.MYSQL_PORT || '3306'), // Puerto del servidor MySQL
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones simultáneas
  queueLimit: 0, // Sin límite de cola
});


// Función para ejecutar una consulta y liberar la conexión después
export async function executeQuery<T = any>(
  query: string, 
  params?: any[]
): Promise<T[]>  {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(query, params);
    return [rows] as any[];
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

// 🔹 Obtener conexión manual (para transacciones)
export async function getConnection() {
  return await db.getConnection();
}

export default db;
