import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { specialty } = req.query;

    // Consulta para bancas (sources)
    const [sources]: [any[], any] = await db.query(
      "SELECT DISTINCT source FROM questions WHERE source IS NOT NULL AND source != '' ORDER BY source ASC"
    );
    
    // Consulta para anos (years)
    const [years]: [any[], any] = await db.query(
      "SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC"
    );
    
    // Consulta para matérias (specialties)
    const [specialties]: [any[], any] = await db.query(
      "SELECT DISTINCT specialty FROM questions WHERE specialty IS NOT NULL AND specialty != '' ORDER BY specialty ASC"
    );
    
    // Consulta para tópicos (topics)
    let topicsQuery = "SELECT DISTINCT topic FROM questions WHERE topic IS NOT NULL AND topic != ''";
    const topicsParams = [];
    
    if (specialty && specialty !== 'all') {
      topicsQuery += " AND specialty = ?";
      topicsParams.push(specialty);
    }
    
    topicsQuery += " ORDER BY topic ASC";
    const [topics]: [any[], any] = await db.query(topicsQuery, topicsParams);

    // Retornando no formato que o frontend espera
    res.json({
      sources: sources.map((r: any) => r.source),
      years: years.map((r: any) => r.year),
      specialties: specialties.map((r: any) => r.specialty),
      topics: topics.map((r: any) => r.topic),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Error fetching filters' });
  }
});

export default router;
