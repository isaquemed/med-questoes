import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/question', async (req, res) => {
  try {
    // Busca uma questão aleatória
    const [questions]: [any[], any] = await db.query("SELECT * FROM questions ORDER BY RAND() LIMIT 1");

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found' });
    }

    const question = questions[0];

    // Busca as alternativas para a questão encontrada
    const [alternatives]: [any[], any] = await db.query("SELECT * FROM alternatives WHERE question_id = ?", [question.id]);

    // Adiciona as alternativas ao objeto da questão
    const questionWithAlternatives = {
      ...question,
      alternatives: alternatives
    };

    res.json(questionWithAlternatives);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Error fetching question' });
  }
});

export default router;
