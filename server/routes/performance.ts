import express from "express";
import db from "../db/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Salvar resposta e atualizar desempenho
router.post("/save-answer", async (req: any, res) => {
  try {
    const { questao_id, opcao_escolhida, acertou, tempo_resposta, tema } = req.body;
    const usuario_id = req.user.id;

    // Salvar resposta
    await pool.execute(
      `INSERT INTO respostas (usuario_id, questao_id, opcao_escolhida, acertou, tempo_resposta, tema) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, questao_id, opcao_escolhida, acertou, tempo_resposta, tema]
    );

    // Atualizar desempenho do tema
    await pool.execute(
      `INSERT INTO desempenho_temas (usuario_id, tema, total_questoes, acertos, erros, taxa_acerto)
       VALUES (?, ?, 1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       total_questoes = total_questoes + 1,
       acertos = acertos + VALUES(acertos),
       erros = erros + VALUES(erros),
       taxa_acerto = (acertos + VALUES(acertos)) / (total_questoes + 1) * 100`,
      [usuario_id, tema, acertou ? 1 : 0, acertou ? 0 : 1, acertou ? 100 : 0]
    );

    res.json({ message: "Resposta salva com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao salvar resposta:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obter desempenho do usuário
router.get("/", async (req: any, res) => {
  try {
    const usuario_id = req.user.id;

    // Desempenho por tema
    const [temas] = await pool.execute(
      "SELECT * FROM desempenho_temas WHERE usuario_id = ? ORDER BY tema",
      [usuario_id]
    );

    // Últimas respostas
    const [respostas] = await pool.execute(
      `SELECT r.*, q.question 
       FROM respostas r 
       LEFT JOIN questions q ON r.questao_id = q.id 
       WHERE r.usuario_id = ? 
       ORDER BY r.data_resposta DESC 
       LIMIT 10`,
      [usuario_id]
    );

    // Calcular estatísticas gerais
    let totalQuestoes = 0;
    let totalAcertos = 0;
    (temas as any[]).forEach((t: any) => {
      totalQuestoes += t.total_questoes;
      totalAcertos += t.acertos;
    });
    const taxaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

    res.json({
      temas,
      respostas,
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