import fs from 'fs';
import mysql from 'mysql2/promise';

export default mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: {
    ca: process.env.DB_SSL_CA_PATH ? fs.readFileSync(process.env.DB_SSL_CA_PATH) : undefined,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
