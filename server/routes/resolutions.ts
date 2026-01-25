import { Router } from "express";
import { pool } from "../db/index.js";
import { difyService } from "../services/difyService.js";

const router = Router();

router.post('/generate', async (req: any, res: any) => {
  try {
    const { questionId, questionText } = req.body;

    if (!questionId || !questionText) {
      return res.status(400).json({ message: 'Missing questionId or questionText' });
    }


    // 1. Verifica se já existe uma resolução no banco
    const [existingResolutions]: [any[], any] = await pool.query(
      "SELECT resolution FROM resolutions WHERE question_id = ? LIMIT 1",
      [questionId]
    );

    if (existingResolutions.length > 0) {
      console.log(`📋 Resolução já existe, retornando do banco`);
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
    
    await pool.query(sql, [questionId, resolution]);


    // 4. RETORNA A RESPOSTA PARA O FRONTEND
    return res.json({ resolution });

  } catch (error) {
    console.error('❌ Erro ao gerar resolução:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao gerar resolução';
    
    return res.status(500).json({ 
      message: 'Error generating resolution',
      details: errorMessage
    });
  }
});

export default router;
