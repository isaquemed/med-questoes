import { Router } from "express";
import db from "../db/index.js";

const router = Router();

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

router.post('/resolution', async (req, res) => {
  try {
    const { question_id, resolution, is_correct } = req.body;

    // Validação básica de entrada
    if (question_id == null || resolution == null || is_correct == null) {
      return res.status(400).json({ message: 'Missing required fields: question_id, resolution, is_correct' });
    }

    const sql = "INSERT INTO resolutions (question_id, resolution, is_correct) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [question_id, resolution, is_correct]);

    // O 'result' do mysql2 para um INSERT é um objeto ResultSetHeader.
    // A propriedade 'insertId' contém o ID da linha recém-criada.
    const insertId = (result as any).insertId;

    res.status(201).json({ id: insertId, message: 'Resolution saved successfully' });
  } catch (error) {
    console.error('Error saving resolution:', error);
    res.status(500).json({ message: 'Error saving resolution' });
  }
});

export default router;
