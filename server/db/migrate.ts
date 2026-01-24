import mysql from "mysql2/promise";

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "M3dqu3st03s!",
    database: process.env.DATABASE_NAME || "med_questoes",
  });

  console.log("🔄 Criando/atualizando tabelas...");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question TEXT NOT NULL,
      correct_answer VARCHAR(1) NOT NULL,
      source VARCHAR(255),
      year INT,
      specialty VARCHAR(255),
      topic VARCHAR(255),
      resolution TEXT
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS resolutions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      resolution TEXT NOT NULL
    );
  `);


  // Tabela de usuários
  await connection.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    );
  `);


  try {
    // Verificar se a coluna usuario_id já existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_answers' 
      AND COLUMN_NAME = 'usuario_id'
    `);

    if ((columns as any[]).length === 0) {
      // Adicionar a coluna se não existir
      await connection.query(`
        ALTER TABLE user_answers 
        ADD COLUMN usuario_id INT,
        ADD COLUMN tempo_resposta INT,
        ADD COLUMN tema VARCHAR(100)
      `);

    }
  } catch (error) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        question_id INT NOT NULL,
        selected_answer VARCHAR(1) NOT NULL,
        is_correct INT NOT NULL,
        tempo_resposta INT,
        tema VARCHAR(100),
        answered_at INT NOT NULL
      );
    `);
  }

  // Tabela de respostas detalhadas (nova)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS respostas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      questao_id INT NOT NULL,
      opcao_escolhida VARCHAR(1) NOT NULL,
      acertou BOOLEAN NOT NULL,
      tempo_resposta INT,
      tema VARCHAR(100),
      data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_usuario_tema (usuario_id, tema)
    );
  `);

  // Atualizar marked_questions para ter usuario_id
  try {
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'marked_questions' 
      AND COLUMN_NAME = 'usuario_id'
    `);

    if ((columns as any[]).length === 0) {
      await connection.query(`
        ALTER TABLE marked_questions 
        ADD COLUMN usuario_id INT
      `);
    }
  } catch (error) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS marked_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        question_id INT NOT NULL,
        marked_at INT NOT NULL
      );
    `);
  }

  // Tabela de desempenho por tema
  await connection.query(`
    CREATE TABLE IF NOT EXISTS desempenho_temas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tema VARCHAR(100) NOT NULL,
      total_questoes INT DEFAULT 0,
      acertos INT DEFAULT 0,
      erros INT DEFAULT 0,
      taxa_acerto DECIMAL(5,2) DEFAULT 0,
      ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_usuario_tema (usuario_id, tema),
      INDEX idx_usuario (usuario_id)
    );
  `);
  
  // Listar tabelas criadas
  const [tables] = await connection.query("SHOW TABLES");
  console.log("\n📊 Tabelas no banco de dados:");
  (tables as any[]).forEach((table) => {
    const tableName = table[`Tables_in_${process.env.DATABASE_NAME || 'med_questoes'}`];
    console.log(`  - ${tableName}`);
  });

  await connection.end();
}

migrate().catch(console.error);