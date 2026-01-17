import db from './index.js';
// O caminho correto agora é a partir da raiz, dentro de 'src'
import questionsData from '../../src/data/questions.json' assert { type: 'json' };

async function seed() {
  try {
    console.log('Starting to seed the database...');

    for (const q of questionsData) {
      // Insere a questão principal
      const questionSql = `
        INSERT INTO questions (id, title, description, year, banca, institution, subject) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(questionSql, [q.id, q.title, q.description, q.year, q.banca, q.institution, q.subject]);

      // Insere as alternativas associadas
      for (const alt of q.alternatives) {
        const alternativeSql = `
          INSERT INTO alternatives (id, question_id, description, is_correct) 
          VALUES (?, ?, ?, ?)
        `;
        await db.query(alternativeSql, [alt.id, q.id, alt.description, alt.is_correct]);
      }
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    // Encerra o pool de conexões para que o script termine
    await db.end();
  }
}

seed();
