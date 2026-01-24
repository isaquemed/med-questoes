import { mysqlTable, serial, text, varchar, int, boolean, decimal, datetime, sql } from "drizzle-orm/mysql-core";

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

export const markedQuestions = mysqlTable("marked_questions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  markedAt: int("marked_at").notNull(),
});

export const resolutions = mysqlTable("resolutions", {
  id: serial("id").primaryKey(),
  questionId: int("question_id").notNull(),
  resolution: text("resolution").notNull(),
});

export const usuarios = mysqlTable("usuarios", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  dataCadastro: datetime("data_cadastro").default(sql`CURRENT_TIMESTAMP`),
});

export const respostas = mysqlTable("respostas", {
  id: serial("id").primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  questaoId: int("question_id").notNull(),
  opcaoEscolhida: varchar("opcao_escolhida", { length: 1 }).notNull(),
  acertou: boolean("acertou").notNull(),
  tempoResposta: int("tempo_resposta"),
  tema: varchar("tema", { length: 100 }),
  dataResposta: datetime("data_resposta").default(sql`CURRENT_TIMESTAMP`),
});

export const desempenhoTemas = mysqlTable("desempenho_temas", {
  id: serial("id").primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  tema: varchar("tema", { length: 100 }).notNull(),
  totalQuestoes: int("total_questoes").default(0),
  acertos: int("acertos").default(0),
  erros: int("erros").default(0),
  taxaAcerto: decimal("taxa_acerto", { precision: 5, scale: 2 }).default("0.00"),
  ultimaAtualizacao: datetime("ultima_atualizacao").default(sql`CURRENT_TIMESTAMP`),
});


export const userAnswers = mysqlTable("user_answers", {
  id: serial("id").primaryKey(),
  usuarioId: int("usuario_id"), 
  questionId: int("question_id").notNull(),
  selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
  isCorrect: int("is_correct").notNull(),
  answeredAt: int("answered_at").notNull(),
  // Adicione campos para performance se quiser
  tempoResposta: int("tempo_resposta"),
  tema: varchar("tema", { length: 100 }),
});

