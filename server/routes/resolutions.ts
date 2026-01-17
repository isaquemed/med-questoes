// server/routes/resolutions.ts

import { Router } from "express";
import { aiResolutionService } from "../services/aiResolutionService.js";
import  db  from "../db/index.js";
import { resolutions } from "../db/schema.js";
import { eq } from "drizzle-orm"; // 1. Importação necessária

const router = Router();

router.post("/generate", async (req, res) => {
  try {
    const { questionId, questionText } = req.body;

    if (!questionId || !questionText || typeof questionText !== 'string' || questionText.length < 10) {
      return res.status(400).json({ error: "Dados da questão inválidos ou insuficientes para gerar resolução." });
    }

    // 2. Garante que o ID seja um número para evitar erros de tipo
    const qId = Number(questionId);

    // 3. Correção da sintaxe de consulta (usando eq(coluna, valor))
    const existing = await db
      .select()
      .from(resolutions)
      .where(eq(resolutions.questionId, qId))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ resolution: existing[0].resolution, cached: true });
    }

    // Gera no Dify
    const generatedResolution = await aiResolutionService.generateResolution(questionText);

    // 4. Salva no banco (removido createdAt se não existir na tabela)
    await db.insert(resolutions).values({
      questionId: qId,
      resolution: generatedResolution,
    });

    return res.json({ resolution: generatedResolution, cached: false });

  } catch (error) {
    console.error("Error generating resolution:", error);
    return res.status(500).json({ error: "Failed to generate resolution" });
  }
});

export default router;
