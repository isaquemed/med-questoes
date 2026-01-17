import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get('/filters', async (req, res) => {
  try {
    // Consulta para bancas distintas
    const [bancas]: [any[], any] = await db.query("SELECT DISTINCT banca FROM questions WHERE banca IS NOT NULL AND banca != '' ORDER BY banca ASC");
    
    // Consulta para anos distintos
    const [anos]: [any[], any] = await db.query("SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC");
    
    // Consulta para matérias distintas
    const [materias]: [any[], any] = await db.query("SELECT DISTINCT subject FROM questions WHERE subject IS NOT NULL AND subject != '' ORDER BY subject ASC");
    
    // Consulta para instituições distintas
    const [instituicoes]: [any[], any] = await db.query("SELECT DISTINCT institution FROM questions WHERE institution IS NOT NULL AND institution != '' ORDER BY institution ASC");

    res.json({
      bancas: bancas.map((r: any) => r.banca),
      anos: anos.map((r: any) => r.year),
      materias: materias.map((r: any) => r.subject),
      instituicoes: instituicoes.map((r: any) => r.institution),
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Error fetching filters' });
  }
});

export default router;
