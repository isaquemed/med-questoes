import fs from 'fs';
import mysql from 'mysql2/promise';

export default mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH) 
    ? { ca: fs.readFileSync(process.env.DB_SSL_CA_PATH) } 
    : (process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : undefined),
  waitForConnections: true,
  connectionLimit: 20, 
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
