import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração robusta do dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import fs from 'fs';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

console.log("Tentando conectar ao banco de dados...");
if (connectionString) {
  console.log("Usando DATABASE_URL para conexão.");
} else {
  console.log("DATABASE_URL não encontrada, usando variáveis de ambiente individuais.");
}

let pool;

if (connectionString) {
  pool = mysql.createPool(connectionString);
} else {
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
