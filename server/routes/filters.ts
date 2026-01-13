// server/routes/filters.ts
import { Router } from "express";
import { db } from "../db";
import { questions } from "../db/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const results = await db
      .selectDistinct({
        topic: questions.topic,
        specialty: questions.specialty,
        year: questions.year,
        source: questions.source
      })
      .from(questions);

    return res.json({
      topics: [...new Set(results.map(r => r.topic).filter(Boolean))],
      specialties: [...new Set(results.map(r => r.specialty).filter(Boolean))],
      years: [...new Set(results.map(r => r.year).filter(Boolean))],
      sources: [...new Set(results.map(r => r.source).filter(Boolean))]
    });

  } catch (err) {
    console.error("Erro ao buscar filtros:", err);
    res.status(500).json({ error: "Falha ao carregar filtros" });
  }
});

export default router;
