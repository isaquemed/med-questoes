import mysql from "mysql2/promise";

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "M3dqu3st03s!",
    database: process.env.DATABASE_NAME || "med_questoes",
  });

  console.log("Creating tables...");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question TEXT NOT NULL,
      correct_answer VARCHAR(1) NOT NULL,
      source VARCHAR(255),
      year INT,
      specialty VARCHAR(255)
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS alternatives (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      letter VARCHAR(1) NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  console.log("Tables created!");
  await connection.end();
}

migrate().catch(console.error);
