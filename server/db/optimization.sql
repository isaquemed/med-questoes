-- Otimização do Banco de Dados Med-Questoes

-- Índices para a tabela de questões (filtros rápidos)
CREATE INDEX idx_questions_source ON questions(source);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_specialty ON questions(specialty);
CREATE INDEX idx_questions_topic ON questions(topic);

-- Índices para alternativas (performance no join)
CREATE INDEX idx_alternatives_question_id ON alternatives(question_id);

-- Índices para respostas do usuário (dashboard e caderno de erros)
CREATE INDEX idx_user_answers_usuario_id ON user_answers(usuario_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_is_correct ON user_answers(is_correct);
CREATE INDEX idx_user_answers_answered_at ON user_answers(answered_at);

-- Índices para resoluções
CREATE INDEX idx_resolutions_question_id ON resolutions(question_id);

-- Índices para usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
