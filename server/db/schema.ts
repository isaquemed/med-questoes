import { mysqlTable, serial, text, varchar, int, datetime } from "drizzle-orm/mysql-core";

export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  source: varchar("source", { length: 255 }),
  year: int("year"),
  specialty: varchar("specialty", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  resolution: text("resolution"),
});

export const alternatives = mysqlTable("alternatives", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  letter: varchar("letter", { length: 1 }).notNull(),
  text: text("text").notNull(),
});

export const userAnswers = mysqlTable("user_answers", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
  isCorrect: int("is_correct").notNull(),
  answeredAt: int("answered_at").notNull(),
});

export const markedQuestions = mysqlTable("marked_questions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  markedAt: int("marked_at").notNull(),
});

// NOVA tabela para salvar resoluções geradas pela IA
export const resolutions = mysqlTable("resolutions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  resolution: text("resolution").notNull(),
});
