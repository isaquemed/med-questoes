import db from '../db/index.js';
import { getResolutionFromAI } from '../services/aiResolutionService.js';

async function generateBatchResolutions() {
  try {
    console.log('Fetching questions without resolutions...');

    // Busca questões que ainda não têm uma resolução gerada por IA
    const [questionsToResolve]: [any[], any] = await db.query(`
      SELECT q.id, q.description 
      FROM questions q
      LEFT JOIN resolutions r ON q.id = r.question_id
      WHERE r.id IS NULL
      LIMIT 10
    `);

    if (questionsToResolve.length === 0) {
      console.log('No questions to resolve. All done!');
      return;
    }

    console.log(`Found ${questionsToResolve.length} questions to resolve.`);

    for (const question of questionsToResolve) {
      try {
        console.log(`Generating resolution for question ID: ${question.id}`);
        const aiResolutionText = await getResolutionFromAI(question.description);

        if (aiResolutionText) {
          // Insere a nova resolução na tabela
          const insertSql = `
            INSERT INTO resolutions (question_id, resolution, is_correct, resolution_type) 
            VALUES (?, ?, ?, ?)
          `;
          // Para INSERT, o resultado é um objeto ResultSetHeader, não um array.
          // Não precisamos atribuí-lo a uma variável se não formos usar o insertId.
          await db.query(insertSql, [question.id, aiResolutionText, true, 'AI']);
          
          console.log(`Successfully saved resolution for question ID: ${question.id}`);
        } else {
          console.log(`AI did not return a resolution for question ID: ${question.id}`);
        }
      } catch (innerError) {
        console.error(`Failed to process question ID: ${question.id}`, innerError);
      }
    }

    console.log('Batch resolution process completed.');

  } catch (error) {
    console.error('An error occurred during the batch resolution process:', error);
  } finally {
    await db.end();
  }
}

generateBatchResolutions();
