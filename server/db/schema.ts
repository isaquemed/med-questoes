import { mysqlTable, serial, text, varchar, int, timestamp, tinyint } from "drizzle-orm/mysql-core";

export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  source: varchar("source", { length: 255 }),
  year: int("year"),
  specialty: varchar("specialty", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  resolution: text("resolution"),
  area: varchar("area", { length: 255 }),
});

export const alternatives = mysqlTable("alternatives", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  letter: varchar("letter", { length: 1 }).notNull(),
  text: text("text").notNull(),
});

export const usuarios = mysqlTable("usuarios", {
  id: serial("id").primaryKey(),
  usuario: varchar("usuario", { length: 255 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  nome: varchar("100").notNull(),
  dataCadastro: timestamp("data_cadastro").defaultNow(),
});

export const userAnswers = mysqlTable("user_answers", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
  isCorrect: tinyint("is_correct").notNull(),
  answeredAt: int("answered_at").notNull(), // Mantendo como INT conforme o SHOW CREATE TABLE
  usuarioId: int("usuario_id"),
});

// Tabela legada ou para compatibilidade se necessário
export const respostas = mysqlTable("respostas", {
  id: serial("id").primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  questionId: int("question_id").notNull(),
  resposta: varchar("resposta", { length: 1 }).notNull(),
  correta: tinyint("correta").notNull(),
  data: timestamp("data").defaultNow(),
});
