import express from "express";
import { db } from "../db/index.js";
import { respostas, desempenhoTemas } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { sql } from "drizzle-orm";

const router = express.Router();

router.use(authenticateToken);

// Salvar resposta e atualizar desempenho
router.post("/save-answer", async (req: any, res: any) => {
  try {
    const { questao_id, opcao_escolhida, acertou, tempo_resposta, tema } = req.body;
    const usuario_id = req.user.id;

    // Salvar resposta
    await db.insert(respostas).values({
      usuarioId: usuario_id,
      questaoId: Number(questao_id),
      opcaoEscolhida: opcao_escolhida,
      acertou: acertou,
      tempoResposta: tempo_resposta,
      tema: tema,
      dataResposta: new Date(),
    });

    // Verificar se já existe desempenho para este tema
    const existingPerformance = await db
      .select()
      .from(desempenhoTemas)
      .where(
        and(
          eq(desempenhoTemas.usuarioId, usuario_id),
          eq(desempenhoTemas.tema, tema)
        )
      )
      .limit(1);

    if (existingPerformance.length > 0) {
      // Atualizar desempenho existente
      const current = existingPerformance[0];
      
      // Usar valores padrão se for null
      const totalAtual = current.totalQuestoes || 0;
      const acertosAtual = current.acertos || 0;
      const errosAtual = current.erros || 0;
      
      const novoTotal = totalAtual + 1;
      const novosAcertos = acertosAtual + (acertou ? 1 : 0);
      const novosErros = errosAtual + (acertou ? 0 : 1);
      const novaTaxa = (novosAcertos / novoTotal) * 100;

      await db
        .update(desempenhoTemas)
        .set({
          totalQuestoes: novoTotal,
          acertos: novosAcertos,
          erros: novosErros,
          taxaAcerto: novaTaxa.toFixed(2),
          ultimaAtualizacao: new Date(),
        })
        .where(eq(desempenhoTemas.id, current.id));
    } else {
      // Criar novo registro de desempenho
      await db.insert(desempenhoTemas).values({
        usuarioId: usuario_id,
        tema: tema,
        totalQuestoes: 1,
        acertos: acertou ? 1 : 0,
        erros: acertou ? 0 : 1,
        taxaAcerto: acertou ? "100.00" : "0.00",
        ultimaAtualizacao: new Date(),
      });
    }

    res.json({ message: "Resposta salva com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao salvar resposta:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obter desempenho do usuário
router.get("/", async (req: any, res: any) => {
  try {
    const usuario_id = req.user.id;

    // Desempenho por tema
    const temas = await db
      .select()
      .from(desempenhoTemas)
      .where(eq(desempenhoTemas.usuarioId, usuario_id));

    // Calcular estatísticas gerais
    const totalQuestoes = temas.reduce(
      (sum: number, t: any) => sum + (t.totalQuestoes || 0),
      0
    );
    const totalAcertos = temas.reduce(
      (sum: number, t: any) => sum + (t.acertos || 0),
      0
    );
    const taxaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

    // Últimas respostas
    const respostasUsuario = await db
      .select()
      .from(respostas)
      .where(eq(respostas.usuarioId, usuario_id))
      .orderBy(sql`${respostas.dataResposta} DESC`)
      .limit(10);

    res.json({
      temas,
      respostas: respostasUsuario,
      estatisticas: {
        totalQuestoes,
        totalAcertos,
        taxaGeral: taxaGeral.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error("Erro ao obter desempenho:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;