/**
 * Script para gerar resoluções em lote para questões sem resolução
 * 
 * Uso:
 * tsx server/scripts/generateBatchResolutions.ts [limite]
 * 
 * Exemplo:
 * tsx server/scripts/generateBatchResolutions.ts 10
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";
import { generateResolution } from "../services/aiResolutionService";

interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  source?: string;
  year?: number;
  specialty?: string;
  alternatives: Array<{
    letter: string;
    text: string;
  }>;
}

async function main() {
  // Obter limite da linha de comando (padrão: 5)
  const limit = parseInt(process.argv[2] || "5");

  console.log(`🚀 Iniciando geração de resoluções para ${limit} questões...\n`);

  // Conectar ao banco
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "host",
    password: "M3dqu3st03s!",
    database: "med_questoes",
  });

  const db = drizzle(connection);

  try {
    // Buscar questões sem resolução
    console.log("📚 Buscando questões sem resolução...");
    
    const [questionsRows] = await db.execute(
      sql`SELECT id, question, correct_answer as correctAnswer, source, year, specialty 
          FROM questions 
          WHERE resolution IS NULL OR resolution = ''
          LIMIT ${limit}`
    );

    const questions = questionsRows as any[];

    if (questions.length === 0) {
      console.log("✅ Todas as questões já possuem resolução!");
      await connection.end();
      return;
    }

    console.log(`📝 Encontradas ${questions.length} questões sem resolução\n`);

    // Buscar alternativas para cada questão
    const questionsWithAlternatives: Question[] = await Promise.all(
      questions.map(async (q) => {
        const [altsRows] = await db.execute(
          sql`SELECT letter, text FROM alternatives WHERE question_id = ${q.id}`
        );
        
        const alternatives = (altsRows as any[]).map(a => ({
          letter: a.letter,
          text: a.text,
        }));

        return {
          ...q,
          alternatives,
        };
      })
    );

    // Gerar resoluções
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < questionsWithAlternatives.length; i++) {
      const question = questionsWithAlternatives[i];
      const progress = `[${i + 1}/${questionsWithAlternatives.length}]`;

      console.log(`${progress} Gerando resolução para questão ID ${question.id}...`);
      console.log(`   📋 ${question.question.substring(0, 80)}...`);

      try {
        const result = await generateResolution(question);

        if (result.success && result.resolution) {
          // Salvar no banco
          await db.execute(
            sql`UPDATE questions SET resolution = ${result.resolution} WHERE id = ${question.id}`
          );

          successCount++;
          console.log(`   ✅ Resolução gerada e salva com sucesso!\n`);
        } else {
          errorCount++;
          console.log(`   ❌ Erro: ${result.error}\n`);
        }
      } catch (error: any) {
        errorCount++;
        console.log(`   ❌ Erro: ${error.message}\n`);
      }

      // Delay para evitar rate limiting (1 segundo entre requisições)
      if (i < questionsWithAlternatives.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA EXECUÇÃO");
    console.log("=".repeat(60));
    console.log(`✅ Resoluções geradas com sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📝 Total processado: ${questionsWithAlternatives.length}`);
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("❌ Erro fatal:", error);
  } finally {
    await connection.end();
    console.log("🔌 Conexão com banco de dados encerrada");
  }
}

// Executar script
main().catch(console.error);
