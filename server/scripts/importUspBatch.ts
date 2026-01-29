import { db } from "../db/index.js";
import { questions, alternatives } from "../db/schema.js";
import fs from "fs";

async function importBatch() {
  const rawData = fs.readFileSync("/home/ubuntu/extracted_usp_30.json", "utf-8");
  const data = JSON.parse(rawData);

  console.log(`Iniciando importação de ${data.length} questões da USP 2026...`);

  for (const item of data) {
    try {
      // 1. Inserir a questão
      const [result] = await db.insert(questions).values({
        question: item.question,
        correctAnswer: item.correctAnswer,
        source: item.source,
        year: item.year,
        specialty: item.specialty,
        topic: item.topic
      });

      const questionId = (result as any).insertId;

      // 2. Inserir as alternativas
      for (const alt of item.alternatives) {
        await db.insert(alternatives).values({
          questionId: questionId,
          letter: alt.letter,
          text: alt.text
        });
      }

      console.log(`Questão importada: USP 2026 - ID Gerado: ${questionId}`);
    } catch (error) {
      console.error("Erro ao importar questão:", error);
    }
  }

  console.log("Processo concluído!");
  process.exit(0);
}

importBatch();
