import { Router } from "express";
import db from "../db/index.js";
import { difyService } from "../services/difyService.js";

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { questionId, questionText } = req.body;

    if (!questionId || !questionText) {
      return res.status(400).json({ message: 'Missing questionId or questionText' });
    }


    // 1. PRIMEIRO: Verifica se já existe uma resolução no banco
    const [existingResolutions]: [any[], any] = await db.query(
      "SELECT resolution FROM resolutions WHERE question_id = ? ORDER BY created_at DESC LIMIT 1",
      [questionId]
    );

    if (existingResolutions.length > 0) {
      return res.json({ resolution: existingResolutions[0].resolution });
    }


    // 2. Gera resolução via Dify
    const prompt = `Por favor, forneça uma resolução detalhada e comentada para a seguinte questão médica: \n\n ${questionText} 
1. Analise cada alternativa cuidadosamente
2. Identifique os conceitos médicos envolvidos
3. Relacione com a prática clínica atual
Dê uma dica ao final objetiva`;
    
    let resolution;
    try {
      resolution = await difyService.generate(prompt);
    } catch (difyError) {
      console.error('❌ Erro no Dify:', difyError);
      
      // Fallback se Dify falhar
      resolution = `
**Resolução Gerada Automaticamente**

**Análise da Questão:**
${questionText}

*Esta resolução foi gerada automaticamente. Consulte fontes especializadas para confirmação.*`;
      
    }

    // 3. SALVA no banco de dados
    const sql = `INSERT INTO resolutions (question_id, resolution) VALUES (?, ?)`;
    
    await db.query(sql, [questionId, resolution]);


    return res.json({ resolution });

  } catch (error) {
    console.error('❌ Erro ao gerar resolução:', error);
    return res.status(500).json({ 
      message: 'Error generating resolution',
      details: error.message 
    });
  }
});

export default router;