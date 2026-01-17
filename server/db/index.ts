// server/db/index.ts

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Caminho seguro para encontrar o certificado, não importa de onde o script rode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const caCertPath = path.join(__dirname, '..', '..', 'certs', 'isrgrootx1.pem');

export default mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    // Lê o arquivo do certificado CA e o fornece para a conexão
    ca: fs.readFileSync(caCertPath),
  }
});
