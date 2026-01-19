import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { source, year, specialty, topic, limit = 10, offset = 0 } = req.query;

    console.log("Buscando questões com filtros:", { source, year, specialty, topic, limit, offset });

    // 1. Construir a query base para as questões
    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    // Mapeamento flexível para suportar diferentes nomes de colunas
    if (source && source !== 'all') {
      whereClause += " AND (source = ? OR banca = ?)";
      params.push(source as string, source as string);
    }
    if (year && year !== 'all') {
      whereClause += " AND year = ?";
      params.push(parseInt(year as string, 10));
    }
    if (specialty && specialty !== 'all') {
      whereClause += " AND (specialty = ?)";
      params.push(specialty as string, specialty as string);
    }
    if (topic && topic !== 'all') {
      whereClause += " AND (topic = ? OR institution = ?)";
      params.push(topic as string, topic as string);
    }

    // 2. Buscar o total de questões para paginação
    const [countResult]: [any[], any] = await db.query(
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
    
    const [questions]: [any[], any] = await db.query(questionsQuery, [
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
	if (questionIds.length === 0) {
  		return [];
	}
    const placeholders = questionIds.map(() => '?').join(',');
    const [allAlternatives]: [any[], any] = await db.query(
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
      ...question,
      // Normalização de campos para o frontend
      source: question.source || question.banca,
      specialty: question.specialty || question.subject,
      topic: question.topic || question.institution,
      correctAnswer: question.correctAnswer || question.correct_answer,
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

  } catch (error: any) {
    console.error('ERRO NA ROTA /api/questions:', error);
    res.status(500).json({ error: 'Erro ao buscar questões', details: error.message });
  }
});

export default router;
