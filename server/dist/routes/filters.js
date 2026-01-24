import { Router } from "express";
import pool from "../db/index.js";
const router = Router();
// Função auxiliar para tentar buscar de múltiplas colunas possíveis
const getDistinct = async (col1, col2) => {
    try {
        const [rows] = await pool.query(`SELECT DISTINCT ${col1} as value FROM questions WHERE ${col1} IS NOT NULL AND ${col1} != '' ORDER BY value ASC`);
        return rows.map((r) => r.value);
    }
    catch (e) {
        try {
            const [rows] = await pool.query(`SELECT DISTINCT ${col2} as value FROM questions WHERE ${col2} IS NOT NULL AND ${col2} != '' ORDER BY value ASC`);
            return rows.map((r) => r.value);
        }
        catch (e2) {
            return [];
        }
    }
};
// Rota principal para buscar filtros disponíveis
router.get('/', async (req, res) => {
    try {
        const sources = await getDistinct('source', 'banca');
        const specialties = await getDistinct('specialty', 'subject');
        // Anos
        let years = [];
        try {
            const [rows] = await pool.query("SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC");
            years = rows.map((r) => r.year);
        }
        catch (e) {
            console.error("Erro ao buscar anos:", e);
        }
        // Tópicos
        let topics = [];
        try {
            const [rows] = await pool.query("SELECT DISTINCT topic as value FROM questions WHERE topic IS NOT NULL AND topic != '' ORDER BY value ASC");
            topics = rows.map((r) => r.value);
        }
        catch (e) {
            console.error("Erro ao buscar tópicos:", e);
        }
        res.json({
            sources,
            years,
            specialties,
            topics,
        });
    }
    catch (error) {
        console.error('ERRO NA ROTA /api/filters:', error);
        res.status(500).json({
            error: 'Erro ao buscar filtros',
            details: error.message
        });
    }
});
// Nova rota para buscar tópicos filtrados por especialidade
router.get('/filtered-topics', async (req, res) => {
    try {
        const { specialty } = req.query;
        let query = 'SELECT DISTINCT topic FROM questions WHERE topic IS NOT NULL AND topic != ""';
        const queryParams = [];
        if (specialty && specialty !== 'all' && specialty !== '') {
            query += ' AND specialty = ?';
            queryParams.push(specialty);
        }
        query += ' ORDER BY topic';
        const [topics] = await pool.query(query, queryParams);
        // Retorna no formato esperado pelo frontend: { topics: [...] }
        res.json({ topics: topics.map((t) => t.topic) });
    }
    catch (error) {
        console.error('ERRO NA ROTA /api/filtered-topics:', error);
        res.status(500).json({
            error: 'Erro ao buscar tópicos filtrados',
            details: error.message
        });
    }
});
export default router;
