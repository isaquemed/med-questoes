import { mysqlTable, serial, text, varchar, int, boolean, decimal, datetime, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
export const questions = mysqlTable("questions", {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
    source: varchar("source", { length: 255 }),
    year: int("year"),
    specialty: varchar("specialty", { length: 255 }),
    topic: varchar("topic", { length: 255 }),
    resolution: text("resolution"),
}, (table) => ({
    sourceIdx: index("source_idx").on(table.source),
    specialtyIdx: index("specialty_idx").on(table.specialty),
    yearIdx: index("year_idx").on(table.year),
    topicIdx: index("topic_idx").on(table.topic),
}));
export const alternatives = mysqlTable("alternatives", {
    id: serial("id").primaryKey(),
    questionId: int("question_id").notNull(),
    letter: varchar("letter", { length: 1 }).notNull(),
    text: text("text").notNull(),
}, (table) => ({
    questionIdIdx: index("alt_question_id_idx").on(table.questionId),
}));
export const markedQuestions = mysqlTable("marked_questions", {
    id: serial("id").primaryKey(),
    usuarioId: int("usuario_id"),
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
    dataCadastro: datetime("data_cadastro").default(sql `CURRENT_TIMESTAMP`),
});
export const userAnswers = mysqlTable("user_answers", {
    id: serial("id").primaryKey(),
    usuarioId: int("usuario_id"),
    questionId: int("question_id").notNull(),
    selectedAnswer: varchar("selected_answer", { length: 1 }).notNull(),
    isCorrect: int("is_correct").notNull(),
    answeredAt: int("answered_at").notNull(),
    tempoResposta: int("tempo_resposta"),
    tema: varchar("tema", { length: 100 }),
    highlights: text("highlights"), // Novo campo para salvar grifos
}, (table) => ({
    usuarioIdIdx: index("ua_usuario_id_idx").on(table.usuarioId),
    questionIdIdx: index("ua_question_id_idx").on(table.questionId),
}));
// Mantendo 'respostas' e 'desempenho_temas' para compatibilidade se necessário, 
// mas focaremos em 'user_answers' para o novo dashboard.
export const respostas = mysqlTable("respostas", {
    id: serial("id").primaryKey(),
    usuarioId: int("usuario_id").notNull(),
    questaoId: int("question_id").notNull(),
    opcaoEscolhida: varchar("opcao_escolhida", { length: 1 }).notNull(),
    acertou: boolean("acertou").notNull(),
    tempoResposta: int("tempo_resposta"),
    tema: varchar("tema", { length: 100 }),
    dataResposta: datetime("data_resposta").default(sql `CURRENT_TIMESTAMP`),
});
export const desempenhoTemas = mysqlTable("desempenho_temas", {
    id: serial("id").primaryKey(),
    usuarioId: int("usuario_id").notNull(),
    tema: varchar("tema", { length: 100 }).notNull(),
    totalQuestoes: int("total_questoes").default(0),
    acertos: int("acertos").default(0),
    erros: int("erros").default(0),
    taxaAcerto: decimal("taxa_acerto", { precision: 5, scale: 2 }).default("0.00"),
    ultimaAtualizacao: datetime("ultima_atualizacao").default(sql `CURRENT_TIMESTAMP`),
});
