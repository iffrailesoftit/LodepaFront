// lib/db.ts
import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Singleton pattern for the database pool in Next.js development mode
const globalForDb = global as unknown as { db: mysql.Pool | undefined };

export const db = globalForDb.db ?? mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

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
