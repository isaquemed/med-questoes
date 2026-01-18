import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { source, year, specialty, topic } = req.query;

    let query = "SELECT * FROM questions WHERE 1=1";
    const params: (string | number)[] = [];

    if (source && source !== 'all') {
      query += " AND source = ?";
      params.push(source as string);
    }
    if (year && year !== 'all') {
      query += " AND year = ?";
      params.push(parseInt(year as string, 10));
    }
    if (specialty && specialty !== 'all') {
      query += " AND specialty = ?";
      params.push(specialty as string);
    }
    if (topic && topic !== 'all') {
      query += " AND topic = ?";
      params.push(topic as string);
    }

    const [questions]: [any[], any] = await db.query(query, params);

    if (questions.length === 0) {
      return res.json([]); // Retorna um array vazio se não encontrar questões
    }

    // Para cada questão, buscar suas alternativas
    const questionsWithAlternatives = await Promise.all(questions.map(async (question) => {
      const [alternatives]: [any[], any] = await db.query("SELECT * FROM alternatives WHERE question_id = ?", [question.id]);
      return {
        ...question,
        alternatives: alternatives
      };
    }));

    res.json(questionsWithAlternatives);

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

export default router;

