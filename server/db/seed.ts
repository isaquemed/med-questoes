import { questions as questionsTable, alternatives as alternativesTable } from "./schema.js";
import { questions as initialQuestions } from "../../client/src/data/questions.js";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "M3dqu3st03s!",
    database: process.env.DATABASE_NAME || "med_questoes",
  });

  const db = drizzle(connection);

  console.log("Seeding database...");

  for (const q of initialQuestions) {
    const [result] = await db.insert(questionsTable).values({
      question: q.question,
      correctAnswer: q.correctAnswer,
      source: q.source,
      year: q.year,
      specialty: q.specialty,
    });

    const questionId = (result as any).insertId;

    for (const alt of q.alternatives) {
      await db.insert(alternativesTable).values({
        questionId,
        letter: alt.letter,
        text: alt.text,
      });
    }
  }

  console.log("Seeding completed!");
  await connection.end();
}

seed().catch(console.error);
