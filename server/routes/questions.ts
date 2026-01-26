import { Router } from "express";
import { pool } from "../db/index.js";
import { validateQuestionFilters } from "../validators/questionFilters.js";

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    // Validar query params
    const validation = validateQuestionFilters(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Parâmetros inválidos', 
        details: validation.error.issues 
      });
    }
    
    const { source, year, specialty, topic, limit = 10, offset = 0 } = validation.data;

    console.log("Buscando questões com filtros:", { source, year, specialty, topic, limit, offset });

    // 1. Construir a query base para as questões
    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    // Mapeamento flexível para suportar diferentes nomes de colunas
    if (source && source !== 'all') {
      whereClause += " AND (source = ?)";
      params.push(source as string);
    }
    if (year && year !== 'all') {
      whereClause += " AND year = ?";
      params.push(parseInt(year as string, 10));
    }
    if (specialty && specialty !== 'all') {
      whereClause += " AND (specialty = ?)";
      params.push(specialty as string);
    }
    if (topic && topic !== 'all') {
      whereClause += " AND (topic = ?)";
      params.push(topic as string);
    }

    // 2. Buscar o total de questões para paginação
    const [countResult]: [any[], any] = await pool.query(
      `SELECT COUNT(*) as total FROM questions ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // 3. Buscar as questões com paginação
    const questionsQuery = `
      SELECT * FROM questions 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [questions]: [any[], any] = await pool.query(questionsQuery, [
      ...params, 
      Number(limit), 
      Number(offset)
    ]);

    if (!questions || questions.length === 0) {
      return res.json({
        questions: [],
        pagination: { total, limit: Number(limit), offset: Number(offset) }
      });
    }

    // 4. Buscar todas as alternativas para as questões selecionadas em uma única query
    const questionIds = questions.map(q => q.id);
    const placeholders = questionIds.map(() => '?').join(',');
    const [allAlternatives]: [any[], any] = await pool.query(
      `SELECT * FROM alternatives WHERE question_id IN (${placeholders}) ORDER BY question_id, letter`,
      questionIds
    );

    // 5. Agrupar alternativas por questão
    const alternativesMap = allAlternatives.reduce((acc: any, alt: any) => {
      const qId = alt.question_id || alt.questionId;
      if (!acc[qId]) {
        acc[qId] = [];
      }
      acc[qId].push(alt);
      return acc;
    }, {});

    // 6. Montar o objeto final com mapeamento de compatibilidade
    const questionsWithAlternatives = questions.map(question => ({
      id: question.id,
      question: question.question,
      source: question.source,
      specialty: question.specialty,
      topic: question.topic,
      year: question.year,
      correctAnswer: question.correct_answer || question.correctAnswer,
      resolution: question.resolution,
      alternatives: (alternativesMap[question.id] || []).map((alt: any) => ({
        letter: alt.letter,
        text: alt.text
      }))
    }));

    res.json({
      questions: questionsWithAlternatives,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error: any) {
    console.error('ERRO NA ROTA /api/questions:', error);
    res.status(500).json({ error: 'Erro ao buscar questões', details: error.message });
  }
});

export default router;
