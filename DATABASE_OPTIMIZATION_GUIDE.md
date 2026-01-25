# Guia Completo de Otimização do TiDB e Importação de Questões

## 1. Otimização do Banco de Dados (TiDB)

### 1.1 Índices Adicionados

O arquivo `server/db/schema.ts` foi atualizado com os seguintes índices estratégicos para melhorar a performance:

| Tabela | Índice | Campo | Benefício |
|--------|--------|-------|-----------|
| questions | source_idx | source | Acelera filtros por banca |
| questions | specialty_idx | specialty | Acelera filtros por especialidade |
| questions | year_idx | year | Acelera filtros por ano |
| questions | topic_idx | topic | Acelera filtros por tema |
| alternatives | alt_question_id_idx | question_id | Acelera busca de alternativas |
| respostas | resp_usuario_id_idx | usuario_id | Acelera busca de respostas por usuário |
| respostas | resp_questao_id_idx | question_id | Acelera análise de performance |

### 1.2 Aplicar os Índices no TiDB

Para aplicar os índices no seu banco de dados TiDB, execute o seguinte comando SQL:

```sql
-- Índices na tabela questions
CREATE INDEX source_idx ON questions(source);
CREATE INDEX specialty_idx ON questions(specialty);
CREATE INDEX year_idx ON questions(year);
CREATE INDEX topic_idx ON questions(topic);

-- Índices na tabela alternatives
CREATE INDEX alt_question_id_idx ON alternatives(question_id);

-- Índices na tabela respostas
CREATE INDEX resp_usuario_id_idx ON respostas(usuario_id);
CREATE INDEX resp_questao_id_idx ON respostas(question_id);
```

### 1.3 Verificar Performance

Após aplicar os índices, você pode verificar a performance com:

```sql
-- Ver tamanho das tabelas
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Tamanho (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'seu_banco_de_dados';

-- Ver índices criados
SHOW INDEXES FROM questions;
SHOW INDEXES FROM alternatives;
SHOW INDEXES FROM respostas;
```

---

## 2. Limpeza e Formatação de Questões Existentes

### 2.1 Script de Limpeza

Um script foi criado em `server/scripts/cleanQuestions.ts` que:

- Remove espaços múltiplos
- Converte entidades HTML (&nbsp;, &amp;, etc.) para caracteres normais
- Remove caracteres especiais quebrados
- Padroniza a formatação de texto

### 2.2 Executar a Limpeza

Para executar o script de limpeza:

```bash
cd /home/ubuntu/med-questoes

# Compilar o script
npx ts-node server/scripts/cleanQuestions.ts

# Ou, se preferir usar tsx
npx tsx server/scripts/cleanQuestions.ts
```

### 2.3 Resultado Esperado

Você verá mensagens como:

```
Iniciando limpeza das questões...
Encontradas 150 questões.
Questão ID 1 limpa.
Questão ID 5 limpa.
...
Limpeza concluída!
```

---

## 3. Importação de Novas Questões

### 3.1 Fontes Gratuitas de Questões

Aqui estão as principais fontes de questões de residência médica gratuitas no Brasil:

| Fonte | Tipo | Acesso | Observações |
|-------|------|--------|-------------|
| **FUVEST** | Provas de Residência USP/SP | Direto (PDF) | Provas completas com gabaritos - Acesse: https://www.fuvest.br/residencia-medica-provas-e-gabarito/ |
| **ENARE** | Provas Nacionais | Parcial | Algumas edições disponíveis no portal do EBSERH |
| **PCI Concursos** | Banco de Provas | Direto | https://www.pciconcursos.com.br/provas/residencia |
| **Simulados Públicos** | Questões Comentadas | Direto | Repositórios em GitHub e Scribd |
| **Universidades Públicas** | Provas Antigas | Direto | Muitas universidades disponibilizam provas em seus portais |

### 3.2 Script de Importação

Um template de script foi criado em `server/scripts/importQuestions.ts`. Para usar:

#### Passo 1: Preparar o Arquivo JSON

Crie um arquivo `questions_data.json` com a estrutura:

```json
[
  {
    "question": "Texto da questão aqui...",
    "correctAnswer": "A",
    "source": "FUVEST",
    "year": 2024,
    "specialty": "Clínica Médica",
    "topic": "Cardiologia",
    "alternatives": [
      { "letter": "A", "text": "Resposta A..." },
      { "letter": "B", "text": "Resposta B..." },
      { "letter": "C", "text": "Resposta C..." },
      { "letter": "D", "text": "Resposta D..." }
    ]
  }
]
```

#### Passo 2: Modificar o Script

Edite `server/scripts/importQuestions.ts` para ler o arquivo JSON:

```typescript
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, '../data/questions_data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

importQuestions(data);
```

#### Passo 3: Executar a Importação

```bash
npx tsx server/scripts/importQuestions.ts
```

### 3.3 Extrair Questões de PDFs (Método Manual)

Para extrair questões de PDFs de provas antigas:

1. **Baixe a prova em PDF** (ex: FUVEST)
2. **Use uma ferramenta de OCR** (ex: pdfplumber em Python)
3. **Estruture os dados** no formato JSON
4. **Execute o script de importação**

Exemplo com Python:

```python
import pdfplumber
import json

pdf_path = "prova_fuvest_2024.pdf"
questions = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        # Processar o texto para extrair questões
        # Estruturar em formato JSON

# Salvar como JSON
with open('questions_data.json', 'w') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
```

---

## 4. Rotina de Manutenção Recomendada

### 4.1 Semanal

```bash
# Verificar tamanho do banco
SELECT COUNT(*) FROM questions;
SELECT COUNT(*) FROM alternatives;
```

### 4.2 Mensal

```bash
# Executar limpeza de dados
npx tsx server/scripts/cleanQuestions.ts

# Verificar performance dos índices
ANALYZE TABLE questions;
ANALYZE TABLE alternatives;
ANALYZE TABLE respostas;
```

### 4.3 Trimestral

```bash
# Otimizar tabelas
OPTIMIZE TABLE questions;
OPTIMIZE TABLE alternatives;
OPTIMIZE TABLE respostas;

# Verificar integridade
CHECK TABLE questions;
CHECK TABLE alternatives;
```

---

## 5. Troubleshooting

### Problema: Importação Lenta

**Solução:** Desabilite índices durante a importação em massa:

```sql
ALTER TABLE questions DISABLE KEYS;
-- Importar dados
ALTER TABLE questions ENABLE KEYS;
```

### Problema: Consultas Lentas

**Solução:** Use EXPLAIN para analisar:

```sql
EXPLAIN SELECT * FROM questions WHERE specialty = 'Clínica Médica' AND year = 2024;
```

### Problema: Espaço em Disco Cheio

**Solução:** Comprima tabelas antigas:

```sql
OPTIMIZE TABLE questions;
```

---

## 6. Próximas Etapas

1. **Automatizar Importação:** Criar um cron job para importar questões mensalmente
2. **Validação de Dados:** Adicionar validação de integridade antes de inserir
3. **Versionamento:** Manter histórico de versões das questões
4. **Sincronização:** Sincronizar com repositórios públicos de questões

---

*Última atualização: 25 de Janeiro de 2026*
