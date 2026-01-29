-- SCRIPT DE MIGRAÇÃO PARA O TIDB
-- Execute estes comandos no seu console SQL do TiDB para habilitar todas as funcionalidades

-- 1. Adicionar coluna de highlights (grifos) na tabela user_answers
ALTER TABLE user_answers ADD COLUMN highlights TEXT;

-- 2. Garantir que a coluna tema exista (caso não exista)
-- ALTER TABLE user_answers ADD COLUMN tema VARCHAR(100);

-- 3. Garantir que a coluna tempo_resposta exista (caso não exista)
-- ALTER TABLE user_answers ADD COLUMN tempo_resposta INT;

-- Após executar o comando 1, você poderá voltar o código para suportar grifos no caderno de erros.
