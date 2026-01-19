import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { source, year, specialty, topic, limit = 10, offset = 0 } = req.query;

    // 1. Construir a query base para as questões
    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    // Mapeamento de filtros para colunas do banco (conforme schema.ts)
    if (source && source !== 'all') {
      whereClause += " AND source = ?";
      params.push(source as string);
    }
    if (year && year !== 'all') {
      whereClause += " AND year = ?";
      params.push(parseInt(year as string, 10));
    }
    if (specialty && specialty !== 'all') {
      whereClause += " AND specialty = ?";
      params.push(specialty as string);
    }
    if (topic && topic !== 'all') {
      whereClause += " AND topic = ?";
      params.push(topic as string);
    }

    // 2. Buscar o total de questões para paginação
    const [countResult]: [any[], any] = await db.query(
      `SELECT COUNT(*) as total FROM questions ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 3. Buscar as questões com paginação
    const questionsQuery = `
      SELECT * FROM questions 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [questions]: [any[], any] = await db.query(questionsQuery, [
      ...params, 
      Number(limit), 
      Number(offset)
    ]);

    if (questions.length === 0) {
      return res.json({
        questions: [],
        pagination: { total, limit: Number(limit), offset: Number(offset) }
      });
    }

    // 4. Buscar todas as alternativas para as questões selecionadas em uma única query
    const questionIds = questions.map(q => q.id);
    const [allAlternatives]: [any[], any] = await db.query(
      "SELECT * FROM alternatives WHERE question_id IN (?) ORDER BY question_id, letter",
      [questionIds]
    );

    // 5. Agrupar alternativas por questão
    const alternativesMap = allAlternatives.reduce((acc: any, alt: any) => {
      if (!acc[alt.question_id]) {
        acc[alt.question_id] = [];
      }
      acc[alt.question_id].push(alt);
      return acc;
    }, {});

    // 6. Montar o objeto final
    const questionsWithAlternatives = questions.map(question => ({
      ...question,
      // As colunas já estão com os nomes corretos conforme o schema
      alternatives: alternativesMap[question.id] || []
    }));

    res.json({
      questions: questionsWithAlternatives,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

export default router;
