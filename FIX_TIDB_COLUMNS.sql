-- SCRIPT DEFINITIVO DE PADRONIZAÇÃO DO BANCO DE DADOS (TIDB)
-- Execute estes comandos para garantir que o código consiga salvar os dados corretamente.

-- 1. Garante que a coluna 'tempo_resposta' existe
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS tempo_resposta INT;

-- 2. Garante que a coluna 'tema' existe
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS tema VARCHAR(100);

-- 3. Garante que a coluna 'highlights' existe
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS highlights TEXT;

-- 4. Caso você tenha criado as colunas com nomes diferentes (ex: tempoResposta), 
-- você pode renomeá-las ou apenas adicionar as novas acima. O código agora procura exatamente por:
-- usuario_id, question_id, selected_answer, is_correct, answered_at, tempo_resposta, tema, highlights
