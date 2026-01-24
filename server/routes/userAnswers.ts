import express from "express";
import pool from "../db/index.js";
import { db } from "../db/index.js";
import { userAnswers, questions } from "../db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/user-answers
 * Registra uma resposta do usuário (requer autenticação)
 */
router.post("/", authenticateToken, async (req: any, res: any) => {
  try {
    const { questionId, selectedAnswer, isCorrect, tempoResposta, tema } = req.body;
    const usuarioId = req.user?.id;

    if (!questionId || !selectedAnswer || isCorrect === undefined) {
      return res.status(400).json({
        error: "Campos obrigatórios: questionId, selectedAnswer, isCorrect"
      });
    }

    const answeredAt = Math.floor(Date.now() / 1000);

    // Usar raw query para inserir
    const [result]: [any, any] = await pool.query(
      `INSERT INTO user_answers (usuario_id, question_id, selected_answer, is_correct, answered_at, tempo_resposta, tema) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, questionId, selectedAnswer, isCorrect ? 1 : 0, answeredAt, tempoResposta || null, tema || null]
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
 * Retorna o caderno de erros do usuário (requer autenticação)
 */
router.get("/errors", authenticateToken, async (req: any, res: any) => {
  try {
    const usuarioId = req.user?.id;

    const [rows]: [any[], any] = await pool.query(
      `SELECT 
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
      WHERE ua.usuario_id = ? AND ua.is_correct = 0
      GROUP BY q.id, ua.selected_answer
      ORDER BY ua.answered_at DESC
      LIMIT 100`,
      [usuarioId]
    );

    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao buscar caderno de erros:", error);
    res.status(500).json({ error: "Erro interno ao buscar caderno de erros" });
  }
});

/**
 * GET /api/user-answers/performance
 * Retorna análise de desempenho do usuário (requer autenticação)
 */
router.get("/performance", authenticateToken, async (req: any, res: any) => {
  try {
    const usuarioId = req.user?.id;

    // Total de questões e acertos
    const [totalStats]: [any[], any] = await pool.query(
      `SELECT 
        COUNT(*) as totalQuestions,
        SUM(is_correct) as correctAnswers,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrectAnswers,
        (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
      FROM user_answers
      WHERE usuario_id = ?`,
      [usuarioId]
    );

    const stats = totalStats[0];

    if (stats.totalQuestions === 0) {
      return res.json(null);
    }

    // Desempenho por especialidade
    const [bySpecialty]: [any[], any] = await pool.query(
      `SELECT 
        q.specialty,
        COUNT(*) as total,
        SUM(ua.is_correct) as correct,
        (SUM(ua.is_correct) * 100.0 / COUNT(*)) as accuracy
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.usuario_id = ? AND q.specialty IS NOT NULL
      GROUP BY q.specialty
      HAVING COUNT(*) >= 3
      ORDER BY accuracy DESC`,
      [usuarioId]
    );

    // Desempenho por banca
    const [bySource]: [any[], any] = await pool.query(
      `SELECT 
        q.source,
        COUNT(*) as total,
        SUM(ua.is_correct) as correct,
        (SUM(ua.is_correct) * 100.0 / COUNT(*)) as accuracy
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.usuario_id = ? AND q.source IS NOT NULL
      GROUP BY q.source
      HAVING COUNT(*) >= 3
      ORDER BY total DESC`,
      [usuarioId]
    );

    // Tendência recente (últimos 7 e 30 dias)
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    const [last7Days]: [any[], any] = await pool.query(
      `SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
       FROM user_answers
       WHERE usuario_id = ? AND answered_at >= ?`,
      [usuarioId, sevenDaysAgo]
    );

    const [last30Days]: [any[], any] = await pool.query(
      `SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
       FROM user_answers
       WHERE usuario_id = ? AND answered_at >= ?`,
      [usuarioId, thirtyDaysAgo]
    );

    const last7Accuracy = last7Days[0]?.accuracy || 0;
    const last30Accuracy = last30Days[0]?.accuracy || 0;
    const improvement = last7Accuracy - last30Accuracy;

    res.json({
      totalQuestions: stats.totalQuestions,
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.incorrectAnswers,
      accuracy: parseFloat(stats.accuracy),
      bySpecialty: bySpecialty.map((s: any) => ({
        specialty: s.specialty,
        total: s.total,
        correct: s.correct,
        accuracy: parseFloat(s.accuracy)
      })),
      bySource: bySource.map((s: any) => ({
        source: s.source,
        total: s.total,
        correct: s.correct,
        accuracy: parseFloat(s.accuracy)
      })),
      recentTrend: {
        last7Days: parseFloat(last7Accuracy),
        last30Days: parseFloat(last30Accuracy),
        improvement: parseFloat(improvement.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error("Erro ao buscar análise de desempenho:", error);
    res.status(500).json({ error: "Erro interno ao buscar análise de desempenho" });
  }
});

/**
 * DELETE /api/user-answers/reset
 * Limpa todo o histórico de respostas (requer autenticação)
 */
router.delete("/reset", authenticateToken, async (req: any, res: any) => {
  try {
    const usuarioId = req.user?.id;

    await pool.query(
      `DELETE FROM user_answers WHERE usuario_id = ?`,
      [usuarioId]
    );

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
