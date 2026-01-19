import { Router } from "express";
import db from "../db/index.js";
import { difyService } from "../services/difyService.js";

const router = Router();

// Endpoint para buscar uma resolução existente
router.get('/resolution/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [resolutions]: [any[], any] = await db.query("SELECT * FROM resolutions WHERE id = ?", [id]);

    if (resolutions.length === 0) {
      return res.status(404).json({ message: 'Resolution not found' });
    }

    res.json(resolutions[0]);
  } catch (error) {
    console.error('Error fetching resolution:', error);
    res.status(500).json({ message: 'Error fetching resolution' });
  }
});

// Endpoint para salvar uma resolução
router.post('/resolution', async (req, res) => {
  try {
    const { question_id, resolution, is_correct } = req.body;

    if (question_id == null || resolution == null || is_correct == null) {
      return res.status(400).json({ message: 'Missing required fields: question_id, resolution, is_correct' });
    }

    const sql = "INSERT INTO resolutions (question_id, resolution, is_correct) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [question_id, resolution, is_correct]);

    const insertId = (result as any).insertId;

    res.status(201).json({ id: insertId, message: 'Resolution saved successfully' });
  } catch (error) {
    console.error('Error saving resolution:', error);
    res.status(500).json({ message: 'Error saving resolution' });
  }
});

// Endpoint para gerar resolução via IA (Dify)
router.post('/generate', async (req, res) => {
  try {
    const { questionId, questionText } = req.body;

    if (!questionId || !questionText) {
      return res.status(400).json({ message: 'Missing questionId or questionText' });
    }

    // Prompt para o Dify
    const prompt = `Por favor, forneça uma resolução detalhada e comentada para a seguinte questão médica: \n\n ${questionText}`;
    
    const resolution = await difyService.generate(prompt);

    // Opcional: Salvar a resolução gerada no banco de dados para uso futuro
    try {
      await db.query(
        "UPDATE questions SET resolution = ? WHERE id = ?",
        [resolution, questionId]
      );
    } catch (dbError) {
      console.error('Error saving generated resolution to database:', dbError);
      // Não falha a requisição se apenas o salvamento falhar
    }

    res.json({ resolution });
  } catch (error) {
    console.error('Error generating resolution:', error);
    res.status(500).json({ message: 'Error generating resolution' });
  }
});

export default router;
