// server/routes/filters.ts
import { Router } from "express";
import  db  from "../db/index.js";
import { questions } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { specialty, source, year } = req.query;

    let query = db
      .selectDistinct({
        topic: questions.topic,
        specialty: questions.specialty,
        year: questions.year,
        source: questions.source
      })
      .from(questions);

    const conditions = [];
    if (specialty && specialty !== "all") {
      conditions.push(eq(questions.specialty, specialty as string));
    }
    if (source && source !== "all") {
      conditions.push(eq(questions.source, source as string));
    }
    if (year && year !== "all") {
      conditions.push(eq(questions.year, parseInt(year as string)));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    const results = await query;

    // Se filtrou por especialidade, retornamos os tópicos filtrados, 
    // mas mantemos as outras opções globais para não "travar" o usuário.
    if (specialty && specialty !== "all") {
        const allOptions = await db
            .selectDistinct({
                specialty: questions.specialty,
                year: questions.year,
                source: questions.source
            })
            .from(questions);

        return res.json({
            topics: [...new Set(results.map(r => r.topic).filter(Boolean))],
            specialties: [...new Set(allOptions.map(r => r.specialty).filter(Boolean))],
            years: [...new Set(allOptions.map(r => r.year).filter(Boolean))],
            sources: [...new Set(allOptions.map(r => r.source).filter(Boolean))]
        });
    }

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
