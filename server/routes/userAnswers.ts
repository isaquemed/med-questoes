import express from "express";
import { sql } from "drizzle-orm";

const router = express.Router();

/**
 * POST /api/user-answers
 * Registra uma resposta do usuário
 */
router.post("/", async (req, res) => {
  try {
    const { questionId, selectedAnswer, isCorrect } = req.body;

    if (!questionId || !selectedAnswer || isCorrect === undefined) {
      return res.status(400).json({
        error: "Campos obrigatórios: questionId, selectedAnswer, isCorrect"
      });
    }

    const db = req.app.get('db');
    const answeredAt = Math.floor(Date.now() / 1000);

    await db.execute(
      sql`INSERT INTO user_answers (question_id, selected_answer, is_correct, answered_at) 
          VALUES (${questionId}, ${selectedAnswer}, ${isCorrect ? 1 : 0}, ${answeredAt})`
    );

    res.json({
      success: true,
      message: "Resposta registrada com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao registrar resposta:", error);
    res.status(500).json({ error: "Erro interno ao registrar resposta" });
  }
});

/**
 * GET /api/user-answers/errors
 * Retorna o caderno de erros do usuário
 */
router.get("/errors", async (req, res) => {
  try {
    const db = req.app.get('db');

    const [rows] = await db.execute(
      sql`SELECT 
            q.id,
            q.question,
            q.correct_answer as correctAnswer,
            ua.selected_answer as selectedAnswer,
            q.specialty,
            q.source,
            q.year,
            ua.answered_at as answeredAt,
            COUNT(*) as attempts
          FROM user_answers ua
          JOIN questions q ON ua.question_id = q.id
          WHERE ua.is_correct = 0
          GROUP BY q.id, ua.selected_answer
          ORDER BY ua.answered_at DESC
          LIMIT 100`
    );

    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao buscar caderno de erros:", error);
    res.status(500).json({ error: "Erro interno ao buscar caderno de erros" });
  }
});

/**
 * GET /api/user-answers/performance
 * Retorna análise de desempenho do usuário
 */
router.get("/performance", async (req, res) => {
  try {
    const db = req.app.get('db');

    // Total de questões e acertos
    const [totalStats] = await db.execute(
      sql`SELECT 
            COUNT(*) as totalQuestions,
            SUM(is_correct) as correctAnswers,
            SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrectAnswers,
            (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers`
    );

    const stats = (totalStats as any[])[0];

    if (stats.totalQuestions === 0) {
      return res.json(null);
    }

    // Desempenho por especialidade
    const [bySpecialty] = await db.execute(
      sql`SELECT 
            q.specialty,
            COUNT(*) as total,
            SUM(ua.is_correct) as correct,
            (SUM(ua.is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers ua
          JOIN questions q ON ua.question_id = q.id
          WHERE q.specialty IS NOT NULL
          GROUP BY q.specialty
          HAVING COUNT(*) >= 3
          ORDER BY accuracy DESC`
    );

    // Desempenho por banca
    const [bySource] = await db.execute(
      sql`SELECT 
            q.source,
            COUNT(*) as total,
            SUM(ua.is_correct) as correct,
            (SUM(ua.is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers ua
          JOIN questions q ON ua.question_id = q.id
          WHERE q.source IS NOT NULL
          GROUP BY q.source
          HAVING COUNT(*) >= 3
          ORDER BY total DESC`
    );

    // Tendência recente (últimos 7 e 30 dias)
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    const [last7Days] = await db.execute(
      sql`SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers
          WHERE answered_at >= ${sevenDaysAgo}`
    );

    const [last30Days] = await db.execute(
      sql`SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers
          WHERE answered_at >= ${thirtyDaysAgo}`
    );

    const last7Accuracy = (last7Days as any[])[0]?.accuracy || 0;
    const last30Accuracy = (last30Days as any[])[0]?.accuracy || 0;
    const improvement = last7Accuracy - last30Accuracy;

    // Streak (dias consecutivos)
    // Implementação simplificada - você pode melhorar isso
    const [streakData] = await db.execute(
      sql`SELECT COUNT(DISTINCT DATE(FROM_UNIXTIME(answered_at))) as streak
          FROM user_answers
          WHERE answered_at >= ${sevenDaysAgo}`
    );

    const streak = (streakData as any[])[0]?.streak || 0;

    // Melhor e pior especialidade
    const specialties = bySpecialty as any[];
    const bestSpecialty = specialties[0]?.specialty || "";
    const weakestSpecialty = specialties[specialties.length - 1]?.specialty || "";

    res.json({
      totalQuestions: stats.totalQuestions,
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.incorrectAnswers,
      accuracy: parseFloat(stats.accuracy),
      bySpecialty: specialties.map((s: any) => ({
        specialty: s.specialty,
        total: s.total,
        correct: s.correct,
        accuracy: parseFloat(s.accuracy)
      })),
      bySource: (bySource as any[]).map((s: any) => ({
        source: s.source,
        total: s.total,
        correct: s.correct,
        accuracy: parseFloat(s.accuracy)
      })),
      recentTrend: {
        last7Days: parseFloat(last7Accuracy),
        last30Days: parseFloat(last30Accuracy),
        improvement: parseFloat(improvement.toFixed(2))
      },
      streak,
      bestSpecialty,
      weakestSpecialty
    });
  } catch (error: any) {
    console.error("Erro ao buscar análise de desempenho:", error);
    res.status(500).json({ error: "Erro interno ao buscar análise de desempenho" });
  }
});

/**
 * DELETE /api/user-answers/reset
 * Limpa todo o histórico de respostas (útil para testes)
 */
router.delete("/reset", async (req, res) => {
  try {
    const db = req.app.get('db');

    await db.execute(sql`DELETE FROM user_answers`);

    res.json({
      success: true,
      message: "Histórico de respostas limpo com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao limpar histórico:", error);
    res.status(500).json({ error: "Erro interno ao limpar histórico" });
  }
});

export default router;
