import fs from 'fs';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';
import * as schema from "./schema.js";
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const connectionString = process.env.DATABASE_URL;

let pool;

if (connectionString) {
  // Se tiver DATABASE_URL (comum no Render e ambiente local com .env)
  pool = mysql.createPool(connectionString);
} else {
  // Fallback para variáveis separadas
  pool = mysql.createPool({
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
}

export const db = drizzle(pool, { schema, mode: 'default' });
export default pool;
