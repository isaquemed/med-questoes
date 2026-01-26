import { mysqlTable, serial, text, varchar, int, timestamp, tinyint } from "drizzle-orm/mysql-core";
// Tabela principal de questões
export const questions = mysqlTable("questions", {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
    source: varchar("source", { length: 255 }),
    year: int("year"),
    specialty: varchar("specialty", { length: 255 }),
    topic: varchar("topic", { length: 255 }),
    area: varchar("area", { length: 255 }),
});
// Alternativas das questões
export const alternatives = mysqlTable("alternatives", {
    id: serial("id").primaryKey(),
    questionId: int("question_id").notNull(),
    letter: varchar("letter", { length: 1 }).notNull(),
    text: text("text").notNull(),
});
// Resoluções detalhadas
export const resolutions = mysqlTable("resolutions", {
    id: serial("id").primaryKey(),
    questionId: int("question_id").notNull(),
    resolution: text("resolution").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// Usuários do sistema
export const usuarios = mysqlTable("usuarios", {
    id: serial("id").primaryKey(),
    usuario: varchar("usuario", { length: 255 }).notNull().unique(),
    senha: varchar("senha", { length: 255 }).notNull(),
    nome: varchar("nome", { length: 100 }).notNull(),
    dataCadastro: timestamp("data_cadastro").defaultNow(),
});
// Histórico de respostas (Única fonte de verdade para desempenho e erros)
export const userAnswers = mysqlTable("user_answers", {
    id: serial("id").primaryKey(),
    questionId: int("question_id").notNull(),
    selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
    isCorrect: tinyint("is_correct").notNull(),
    answeredAt: int("answered_at").notNull(),
    usuarioId: int("usuario_id"),
    tempoResposta: int("tempo_resposta"),
    tema: varchar("tema", { length: 100 }),
    highlights: text("highlights"),
});
// Questões marcadas/favoritas
export const markedQuestions = mysqlTable("marked_questions", {
    id: serial("id").primaryKey(),
    usuarioId: int("usuario_id").notNull(),
    questionId: int("question_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
