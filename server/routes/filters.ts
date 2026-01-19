import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { specialty } = req.query;

    // Consulta para bancas (sources)
    const [bancas]: [any[], any] = await db.query(
      "SELECT DISTINCT banca FROM questions WHERE banca IS NOT NULL AND banca != '' ORDER BY banca ASC"
    );
    
    // Consulta para anos (years)
    const [anos]: [any[], any] = await db.query(
      "SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC"
    );
    
    // Consulta para matérias (specialties)
    const [materias]: [any[], any] = await db.query(
      "SELECT DISTINCT subject FROM questions WHERE subject IS NOT NULL AND subject != '' ORDER BY subject ASC"
    );
    
    // Consulta para instituições (topics) - Com filtro de especialidade
    let topicsQuery = "SELECT DISTINCT institution FROM questions WHERE institution IS NOT NULL AND institution != ''";
    const topicsParams = [];
    
    if (specialty && specialty !== 'all') {
      topicsQuery += " AND subject = ?";
      topicsParams.push(specialty);
    }
    
    topicsQuery += " ORDER BY institution ASC";
    const [instituicoes]: [any[], any] = await db.query(topicsQuery, topicsParams);

    // Retornando no formato que o frontend espera (sources, years, specialties, topics)
    res.json({
      sources: bancas.map((r: any) => r.banca),
      years: anos.map((r: any) => r.year),
      specialties: materias.map((r: any) => r.subject),
      topics: instituicoes.map((r: any) => r.institution),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Error fetching filters' });
  }
});

export default router;