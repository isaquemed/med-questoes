import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Esta lógica garante que o certificado seja encontrado:
 * 1. Tenta encontrar na pasta 'certs' na raiz do projeto (melhor para o Render)
 * 2. Se não achar, tenta o caminho relativo ao arquivo atual
 */
const rootCertPath = path.resolve(process.cwd(), 'certs', 'isrgrootx1.pem');
const serverCertPath = path.resolve(process.cwd(), 'server', 'certs', 'isrgrootx1.pem');

let finalCertPath = '';

if (fs.existsSync(rootCertPath)) {
  finalCertPath = rootCertPath;
} else if (fs.existsSync(serverCertPath)) {
  finalCertPath = serverCertPath;
} else {
  // Fallback para o caminho que o erro indicou, caso os acima falhem
  finalCertPath = path.join(__dirname, '..', '..', 'certs', 'isrgrootx1.pem');
}

console.log('Using CA Cert at:', finalCertPath);

export default mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: {
    ca: fs.readFileSync(finalCertPath),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
