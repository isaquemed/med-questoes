import { Router } from "express";
import  db  from "../db/index.js";
import { questions, alternatives } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { source, year, specialty, topic } = req.query;
    const filters = [];

    if (source && source !== "all") filters.push(eq(questions.source, String(source)));
    if (year && year !== "all") filters.push(eq(questions.year, Number(year)));
    if (specialty && specialty !== "all") filters.push(eq(questions.specialty, String(specialty)));
    if (topic && topic !== "all") filters.push(eq(questions.topic, String(topic)));

    // 1. Busca as questões filtradas
    const questionsData = await db
      .select()
      .from(questions)
      .where(filters.length ? and(...filters) : undefined);

    // 2. Busca as alternativas para cada questão encontrada
    const questionsWithAlternatives = await Promise.all(
      questionsData.map(async (q) => {
        const alts = await db
          .select()
          .from(alternatives)
          .where(eq(alternatives.questionId, q.id));
        
        return {
          ...q,
          alternatives: alts.map(a => ({ letter: a.letter, text: a.text }))
        };
      })
    );

    // RETORNA DIRETAMENTE O ARRAY (O frontend espera isso)
    res.json(questionsWithAlternatives);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar questões" });
  }
});

export default router;