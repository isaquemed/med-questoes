import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { specialty } = req.query;

    // Função auxiliar para tentar buscar de múltiplas colunas possíveis
    const getDistinct = async (col1: string, col2: string) => {
      try {
        const [rows]: [any[], any] = await db.query(`SELECT DISTINCT ${col1} as value FROM questions WHERE ${col1} IS NOT NULL AND ${col1} != '' ORDER BY value ASC`);
        return rows.map(r => r.value);
      } catch (e) {
        try {
          const [rows]: [any[], any] = await db.query(`SELECT DISTINCT ${col2} as value FROM questions WHERE ${col2} IS NOT NULL AND ${col2} != '' ORDER BY value ASC`);
          return rows.map(r => r.value);
        } catch (e2) {
          return [];
        }
      }
    };

    const sources = await getDistinct('source', 'banca');
    const specialties = await getDistinct('specialty', 'subject');
    
    // Anos geralmente é 'year'
    let years = [];
    try {
      const [rows]: [any[], any] = await db.query("SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC");
      years = rows.map(r => r.year);
    } catch (e) {}

    // Tópicos / Instituições
    let topics = [];
    try {
      let query = "SELECT DISTINCT topic as value FROM questions WHERE topic IS NOT NULL AND topic != ''";
      const params = [];
      if (specialty && specialty !== 'all') {
        query += " AND (specialty = ? OR subject = ?)";
        params.push(specialty, specialty);
      }
      query += " ORDER BY value ASC";
      const [rows]: [any[], any] = await db.query(query, params);
      topics = rows.map(r => r.value);
    } catch (e) {
      try {
        let query = "SELECT DISTINCT institution as value FROM questions WHERE institution IS NOT NULL AND institution != ''";
        const params = [];
        if (specialty && specialty !== 'all') {
          query += " AND (specialty = ? OR subject = ?)";
          params.push(specialty, specialty);
        }
        query += " ORDER BY value ASC";
        const [rows]: [any[], any] = await db.query(query, params);
        topics = rows.map(r => r.value);
      } catch (e2) {}
    }

    res.json({
      sources,
      years,
      specialties,
      topics,
    });
  } catch (error: any) {
    console.error('ERRO NA ROTA /api/filters:', error);
    res.status(500).json({ error: 'Erro ao buscar filtros', details: error.message });
  }
});

export default router;
