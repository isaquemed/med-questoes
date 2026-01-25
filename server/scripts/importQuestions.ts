import { db } from "../db/index.js";
import { questions, alternatives } from "../db/schema.js";

interface NewQuestion {
  question: string;
  correctAnswer: string;
  source: string;
  year: number;
  specialty: string;
  topic: string;
  alternatives: {
    letter: string;
    text: string;
  }[];
}

async function importQuestions(data: NewQuestion[]) {
  console.log(`Iniciando importação de ${data.length} questões...`);

  for (const item of data) {
    try {
      // 1. Inserir a questão
      const [result] = await db.insert(questions).values({
        question: item.question,
        correctAnswer: item.correctAnswer,
        source: item.source,
        year: item.year,
        specialty: item.specialty,
        topic: item.topic
      });

      const questionId = (result as any).insertId;

      // 2. Inserir as alternativas
      for (const alt of item.alternatives) {
        await db.insert(alternatives).values({
          questionId: questionId,
          letter: alt.letter,
          text: alt.text
        });
      }

      console.log(`Questão importada com sucesso: ID ${questionId}`);
    } catch (error) {
      console.error("Erro ao importar questão:", error);
    }
  }

  console.log("Importação concluída!");
}

// Exemplo de uso (Pode ser alimentado por um JSON extraído de PDFs)
const sampleData: NewQuestion[] = [
  {
    question: "De acordo com a Lei 8.080/90, a saúde é um direito fundamental do ser humano, devendo o Estado prover as condições indispensáveis ao seu pleno exercício. O dever do Estado de garantir a saúde consiste na formulação e execução de políticas econômicas e sociais que visem:",
    correctAnswer: "A",
    source: "ENARE",
    year: 2024,
    specialty: "Saúde Pública",
    topic: "Legislação do SUS",
    alternatives: [
      { letter: "A", text: "À redução de riscos de doenças e de outros agravos e no estabelecimento de condições que assegurem acesso universal e igualitário às ações e aos serviços para a sua promoção, proteção e recuperação." },
      { letter: "B", text: "Apenas à recuperação de doenças infectocontagiosas em áreas de vulnerabilidade social." },
      { letter: "C", text: "À criação de planos de saúde privados subsidiados pelo governo federal." },
      { letter: "D", text: "Ao atendimento exclusivo em hospitais de alta complexidade." }
    ]
  }
];

// Descomente para rodar
// importQuestions(sampleData);
