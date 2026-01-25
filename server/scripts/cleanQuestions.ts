import { db } from "../db/index.js";
import { questions, alternatives } from "../db/schema.js";
import { eq } from "drizzle-orm";

async function cleanText(text: string): Promise<string> {
  if (!text) return "";
  
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Remove espaços múltiplos
    .trim();
}

async function main() {
  console.log("Iniciando limpeza das questões...");

  const allQuestions = await db.select().from(questions);
  console.log(`Encontradas ${allQuestions.length} questões.`);

  for (const q of allQuestions) {
    const cleanedQuestion = await cleanText(q.question);
    const cleanedResolution = q.resolution ? await cleanText(q.resolution) : null;

    if (cleanedQuestion !== q.question || cleanedResolution !== q.resolution) {
      await db.update(questions)
        .set({ 
          question: cleanedQuestion, 
          resolution: cleanedResolution 
        })
        .where(eq(questions.id, q.id));
      console.log(`Questão ID ${q.id} limpa.`);
    }
  }

  const allAlternatives = await db.select().from(alternatives);
  for (const alt of allAlternatives) {
    const cleanedAlt = await cleanText(alt.text);
    if (cleanedAlt !== alt.text) {
      await db.update(alternatives)
        .set({ text: cleanedAlt })
        .where(eq(alternatives.id, alt.id));
      console.log(`Alternativa ID ${alt.id} limpa.`);
    }
  }

  console.log("Limpeza concluída!");
}

main().catch(console.error);
