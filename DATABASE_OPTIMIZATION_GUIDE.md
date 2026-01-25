# Guia Completo de Otimização do TiDB e Importação de Questões

## 1. Otimização do Banco de Dados (TiDB)

### 1.1 Índices Estratégicos

O projeto foi atualizado para usar índices que aceleram drasticamente as consultas de filtros e o carregamento do dashboard.

| Tabela | Índice | Campo | Benefício |
|--------|--------|-------|-----------|
| `questions` | `idx_questions_source` | `source` | Filtro rápido por banca |
| `questions` | `idx_questions_specialty` | `specialty` | Filtro rápido por especialidade |
| `questions` | `idx_questions_year` | `year` | Filtro rápido por ano |
| `questions` | `idx_questions_topic` | `topic` | Filtro rápido por tema |
| `alternatives` | `idx_alt_question_id` | `question_id` | Carregamento instantâneo de alternativas |
| `user_answers` | `idx_ua_usuario_id` | `usuario_id` | Carregamento rápido do dashboard |
| `user_answers` | `idx_ua_answered_at` | `answered_at` | Filtros por data e tendências |

### 1.2 Aplicar os Índices no TiDB Cloud

Execute o seguinte comando SQL no seu console TiDB:

```sql
-- Índices na tabela questions
CREATE INDEX idx_questions_source ON questions(source);
CREATE INDEX idx_questions_specialty ON questions(specialty);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_topic ON questions(topic);

-- Índices na tabela alternatives
CREATE INDEX idx_alt_question_id ON alternatives(question_id);

-- Índices na tabela user_answers
CREATE INDEX idx_ua_usuario_id ON user_answers(usuario_id);
CREATE INDEX idx_ua_answered_at ON user_answers(answered_at);
CREATE INDEX idx_ua_is_correct ON user_answers(is_correct);
```

---

## 2. Limpeza e Formatação de Questões

### 2.1 Script de Limpeza
O script `server/scripts/cleanQuestions.ts` remove espaços extras, corrige entidades HTML e padroniza o texto.

**Como executar:**
```bash
npx tsx server/scripts/cleanQuestions.ts
```

---

## 3. Importação de Novas Questões

### 3.1 Fontes Gratuitas Recomendadas
- **FUVEST/USP:** [Provas e Gabaritos](https://www.fuvest.br/residencia-medica-provas-e-gabarito/)
- **ENARE:** [Portal EBSERH](https://enare.ebserh.gov.br/)
- **PCI Concursos:** [Repositório de Provas](https://www.pciconcursos.com.br/provas/residencia)

### 3.2 Script de Importação
Use o script `server/scripts/importQuestions.ts` para inserir questões em massa via JSON.

**Estrutura do JSON esperada:**
```json
{
  "question": "Texto...",
  "correctAnswer": "A",
  "source": "Banca",
  "year": 2024,
  "specialty": "Área",
  "topic": "Tema",
  "alternatives": [
    { "letter": "A", "text": "..." },
    { "letter": "B", "text": "..." }
  ]
}
```

**Como executar:**
```bash
npx tsx server/scripts/importQuestions.ts
```

---

## 4. Manutenção Preventiva

- **Semanal:** Verifique o crescimento das tabelas e o tempo de resposta das APIs.
- **Mensal:** Execute o script de limpeza para garantir a qualidade do banco.
- **Trimestral:** Revise os índices se adicionar novos filtros ou funcionalidades.

---
*Última atualização: 25 de Janeiro de 2026*
