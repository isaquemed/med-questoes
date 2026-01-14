var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";
import cors from "cors";

// server/routes/filters.ts
import express from "express";
var router = express.Router();
router.get("/", async (_req, res) => {
  try {
    const specialties = await prisma.specialty.findMany({
      select: { id: true, name: true }
    });
    const years = await prisma.year.findMany({
      select: { id: true, name: true }
    });
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true }
    });
    res.json({
      specialties,
      years,
      institutions
    });
  } catch (err) {
    console.error("Erro ao buscar filtros:", err);
    res.status(500).json({ error: "Erro ao buscar filtros" });
  }
});
var filters_default = router;

// server/routes/userAnswers.ts
import express2 from "express";
import { sql } from "drizzle-orm";
var router2 = express2.Router();
router2.post("/", async (req, res) => {
  try {
    const { questionId, selectedAnswer, isCorrect } = req.body;
    if (!questionId || !selectedAnswer || isCorrect === void 0) {
      return res.status(400).json({
        error: "Campos obrigat\xF3rios: questionId, selectedAnswer, isCorrect"
      });
    }
    const db2 = req.app.get("db");
    const answeredAt = Math.floor(Date.now() / 1e3);
    await db2.execute(
      sql`INSERT INTO user_answers (question_id, selected_answer, is_correct, answered_at) 
          VALUES (${questionId}, ${selectedAnswer}, ${isCorrect ? 1 : 0}, ${answeredAt})`
    );
    res.json({
      success: true,
      message: "Resposta registrada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao registrar resposta:", error);
    res.status(500).json({ error: "Erro interno ao registrar resposta" });
  }
});
router2.get("/errors", async (req, res) => {
  try {
    const db2 = req.app.get("db");
    const [rows] = await db2.execute(
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
  } catch (error) {
    console.error("Erro ao buscar caderno de erros:", error);
    res.status(500).json({ error: "Erro interno ao buscar caderno de erros" });
  }
});
router2.get("/performance", async (req, res) => {
  try {
    const db2 = req.app.get("db");
    const [totalStats] = await db2.execute(
      sql`SELECT 
            COUNT(*) as totalQuestions,
            SUM(is_correct) as correctAnswers,
            SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrectAnswers,
            (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers`
    );
    const stats = totalStats[0];
    if (stats.totalQuestions === 0) {
      return res.json(null);
    }
    const [bySpecialty] = await db2.execute(
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
    const [bySource] = await db2.execute(
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
    const now = Math.floor(Date.now() / 1e3);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const [last7Days] = await db2.execute(
      sql`SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers
          WHERE answered_at >= ${sevenDaysAgo}`
    );
    const [last30Days] = await db2.execute(
      sql`SELECT (SUM(is_correct) * 100.0 / COUNT(*)) as accuracy
          FROM user_answers
          WHERE answered_at >= ${thirtyDaysAgo}`
    );
    const last7Accuracy = last7Days[0]?.accuracy || 0;
    const last30Accuracy = last30Days[0]?.accuracy || 0;
    const improvement = last7Accuracy - last30Accuracy;
    const [streakData] = await db2.execute(
      sql`SELECT COUNT(DISTINCT DATE(FROM_UNIXTIME(answered_at))) as streak
          FROM user_answers
          WHERE answered_at >= ${sevenDaysAgo}`
    );
    const streak = streakData[0]?.streak || 0;
    const specialties = bySpecialty;
    const bestSpecialty = specialties[0]?.specialty || "";
    const weakestSpecialty = specialties[specialties.length - 1]?.specialty || "";
    res.json({
      totalQuestions: stats.totalQuestions,
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.incorrectAnswers,
      accuracy: parseFloat(stats.accuracy),
      bySpecialty: specialties.map((s) => ({
        specialty: s.specialty,
        total: s.total,
        correct: s.correct,
        accuracy: parseFloat(s.accuracy)
      })),
      bySource: bySource.map((s) => ({
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
  } catch (error) {
    console.error("Erro ao buscar an\xE1lise de desempenho:", error);
    res.status(500).json({ error: "Erro interno ao buscar an\xE1lise de desempenho" });
  }
});
router2.delete("/reset", async (req, res) => {
  try {
    const db2 = req.app.get("db");
    await db2.execute(sql`DELETE FROM user_answers`);
    res.json({
      success: true,
      message: "Hist\xF3rico de respostas limpo com sucesso"
    });
  } catch (error) {
    console.error("Erro ao limpar hist\xF3rico:", error);
    res.status(500).json({ error: "Erro interno ao limpar hist\xF3rico" });
  }
});
var userAnswers_default = router2;

// server/routes/resolutions.ts
import { Router } from "express";

// server/services/difyService.ts
import axios from "axios";
var DIFY_API = process.env.DIFY_API_URL;
var DIFY_KEY = process.env.DIFY_API_KEY;
var difyService = {
  async generate(prompt) {
    const response = await axios.post(
      `${DIFY_API}/completion-messages`,
      {
        inputs: {},
        query: prompt,
        user: "user-1",
        response_mode: "blocking"
      },
      {
        headers: {
          Authorization: `Bearer ${DIFY_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const text2 = response.data?.answer || "";
    return text2.trim();
  }
};

// server/services/aiResolutionService.ts
var aiResolutionService = {
  async generateResolution(questionText) {
    const prompt = `
Voc\xEA \xE9 um m\xE9dico especialista.
Explique detalhadamente a resolu\xE7\xE3o da seguinte quest\xE3o de resid\xEAncia:

"${questionText}"

Explique o racioc\xEDnio cl\xEDnico, diagn\xF3stico diferencial e o porqu\xEA da resposta correta.
    `;
    const result = await difyService.generate(prompt);
    return result;
  }
};

// server/db/index.ts
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

// server/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alternatives: () => alternatives,
  markedQuestions: () => markedQuestions,
  questions: () => questions,
  resolutions: () => resolutions,
  userAnswers: () => userAnswers
});
import { mysqlTable, serial, text, varchar, int } from "drizzle-orm/mysql-core";
var questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  source: varchar("source", { length: 255 }),
  year: int("year"),
  specialty: varchar("specialty", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  resolution: text("resolution")
});
var alternatives = mysqlTable("alternatives", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  letter: varchar("letter", { length: 1 }).notNull(),
  text: text("text").notNull()
});
var userAnswers = mysqlTable("user_answers", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
  isCorrect: int("is_correct").notNull(),
  answeredAt: int("answered_at").notNull()
});
var markedQuestions = mysqlTable("marked_questions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  markedAt: int("marked_at").notNull()
});
var resolutions = mysqlTable("resolutions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  resolution: text("resolution").notNull()
});

// server/db/index.ts
var pool = mysql.createPool({
  host: "localhost",
  user: "host",
  password: "M3dqu3st03s!",
  database: "med_questoes",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
var db = drizzle(pool, { schema: schema_exports });

// server/routes/resolutions.ts
var router3 = Router();
router3.post("/generate", async (req, res) => {
  try {
    const { questionId, questionText } = req.body;
    if (!questionId || !questionText) {
      return res.status(400).json({ error: "Missing questionId or questionText" });
    }
    const existing = await db.select().from(resolutions).where(resolutions.questionId.eq(questionId)).limit(1);
    if (existing.length > 0) {
      return res.json({ resolution: existing[0].resolution, cached: true });
    }
    const generatedResolution = await aiResolutionService.generateResolution(questionText);
    await db.insert(resolutions).values({
      questionId,
      resolution: generatedResolution,
      createdAt: /* @__PURE__ */ new Date()
    });
    return res.json({ resolution: generatedResolution, cached: false });
  } catch (error) {
    console.error("Error generating resolution:", error);
    return res.status(500).json({ error: "Failed to generate resolution" });
  }
});
var resolutions_default = router3;

// server/index.ts
var app = express3();
app.use(cors());
app.use(express3.json());
app.use("/api/filters", filters_default);
app.use("/api/questions", userAnswers_default);
app.use("/api/resolutions", resolutions_default);
var PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
