export interface Question {
  id: string;
  question: string;
  alternatives: {
    letter: string;
    text: string;
  }[];
  correctAnswer: string;
  source?: string;
  year?: number;
  specialty?: string;
}

export const questions: Question[] = [
  {
    id: "1",
    question:
      "Um paciente de 45 anos apresenta-se com dispneia progressiva, ortopneia e edema de membros inferiores. Qual é o achado mais esperado no exame físico?",
    alternatives: [
      { letter: "A", text: "Estertores crepitantes bilaterais" },
      { letter: "B", text: "Redução do murmúrio vesicular" },
      { letter: "C", text: "Sibilos difusos" },
      { letter: "D", text: "Atrito pericárdico" },
      { letter: "E", text: "Sopro sistólico em foco mitral" },
    ],
    correctAnswer: "A",
    source: "ENARE",
    year: 2023,
    specialty: "Cardiologia",
  },
  {
    id: "2",
    question:
      "Qual medicamento é considerado primeira linha no tratamento da hipertensão arterial em pacientes com insuficiência cardíaca e fração de ejeção reduzida?",
    alternatives: [
      { letter: "A", text: "Bloqueador de canal de cálcio" },
      { letter: "B", text: "Inibidor da ECA" },
      { letter: "C", text: "Diurético de alça" },
      { letter: "D", text: "Vasodilatador direto" },
      { letter: "E", text: "Antagonista de aldosterona" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Cardiologia",
  },
  {
    id: "3",
    question:
      "Uma criança de 6 anos apresenta febre, tosse produtiva e infiltrado lobar no pulmão direito. Qual é o agente etiológico mais provável?",
    alternatives: [
      { letter: "A", text: "Vírus respiratório sincicial" },
      { letter: "B", text: "Streptococcus pneumoniae" },
      { letter: "C", text: "Mycoplasma pneumoniae" },
      { letter: "D", text: "Haemophilus influenzae" },
      { letter: "E", text: "Chlamydia trachomatis" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2022,
    specialty: "Pediatria",
  },
  {
    id: "4",
    question:
      "Um homem de 55 anos com diabetes mellitus tipo 2 apresenta pressão arterial de 150/90 mmHg. Qual é a meta de pressão arterial recomendada para este paciente?",
    alternatives: [
      { letter: "A", text: "< 140/90 mmHg" },
      { letter: "B", text: "< 130/80 mmHg" },
      { letter: "C", text: "< 120/70 mmHg" },
      { letter: "D", text: "< 110/60 mmHg" },
      { letter: "E", text: "< 100/50 mmHg" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Clínica Médica",
  },
  {
    id: "5",
    question:
      "Uma mulher de 32 anos, primigesta, com 28 semanas de gestação, apresenta pressão arterial de 160/110 mmHg e proteinúria de 2+. Qual é o diagnóstico mais provável?",
    alternatives: [
      { letter: "A", text: "Hipertensão gestacional" },
      { letter: "B", text: "Pré-eclâmpsia" },
      { letter: "C", text: "Eclâmpsia" },
      { letter: "D", text: "Hipertensão crônica" },
      { letter: "E", text: "Síndrome HELLP" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2022,
    specialty: "Obstetrícia",
  },
  {
    id: "6",
    question:
      "Um paciente apresenta dor no flanco direito, náuseas e hematúria. A tomografia revela uma imagem radiopaca no ureter. Qual é o diagnóstico mais provável?",
    alternatives: [
      { letter: "A", text: "Infecção urinária" },
      { letter: "B", text: "Cálculo renal" },
      { letter: "C", text: "Tumor renal" },
      { letter: "D", text: "Pielonefrite" },
      { letter: "E", text: "Glomerulonefrite" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Urologia",
  },
  {
    id: "7",
    question:
      "Um adolescente de 16 anos apresenta dor abdominal aguda, vômitos e ausência de evacuação há 3 dias. Qual é o exame mais importante para o diagnóstico?",
    alternatives: [
      { letter: "A", text: "Ultrassom abdominal" },
      { letter: "B", text: "Radiografia simples de abdômen" },
      { letter: "C", text: "Tomografia computadorizada" },
      { letter: "D", text: "Ressonância magnética" },
      { letter: "E", text: "Endoscopia digestiva alta" },
    ],
    correctAnswer: "C",
    source: "ENARE",
    year: 2022,
    specialty: "Cirurgia Geral",
  },
  {
    id: "8",
    question:
      "Uma mulher de 28 anos apresenta tremor de repouso, rigidez e bradicinesia. Qual é o neurotransmissor deficiente nesta condição?",
    alternatives: [
      { letter: "A", text: "Acetilcolina" },
      { letter: "B", text: "Dopamina" },
      { letter: "C", text: "Serotonina" },
      { letter: "D", text: "GABA" },
      { letter: "E", text: "Glutamato" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Neurologia",
  },
  {
    id: "9",
    question:
      "Um paciente com antecedente de tuberculose pulmonar apresenta tosse crônica e hemoptise. Qual é a complicação mais provável?",
    alternatives: [
      { letter: "A", text: "Pneumotórax" },
      { letter: "B", text: "Aspergiloma" },
      { letter: "C", text: "Bronquiectasia" },
      { letter: "D", text: "Fibrose pulmonar" },
      { letter: "E", text: "Cor pulmonale" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2022,
    specialty: "Pneumologia",
  },
  {
    id: "10",
    question:
      "Uma criança de 4 anos apresenta erupção cutânea maculopapular, febre e conjuntivite. Qual é o diagnóstico mais provável?",
    alternatives: [
      { letter: "A", text: "Sarampo" },
      { letter: "B", text: "Rubéola" },
      { letter: "C", text: "Varicela" },
      { letter: "D", text: "Escarlatina" },
      { letter: "E", text: "Eritema infeccioso" },
    ],
    correctAnswer: "A",
    source: "ENARE",
    year: 2023,
    specialty: "Pediatria",
  },
  {
    id: "11",
    question:
      "Um homem de 60 anos com cirrose hepática apresenta ascite tensa e encefalopatia. Qual é o medicamento mais apropriado para reduzir a pressão portal?",
    alternatives: [
      { letter: "A", text: "Propranolol" },
      { letter: "B", text: "Omeprazol" },
      { letter: "C", text: "Espironolactona" },
      { letter: "D", text: "Furosemida" },
      { letter: "E", text: "Lactulose" },
    ],
    correctAnswer: "A",
    source: "ENARE",
    year: 2022,
    specialty: "Gastroenterologia",
  },
  {
    id: "12",
    question:
      "Uma mulher de 45 anos apresenta fadiga, ganho de peso e queda de cabelo. Os testes mostram TSH elevado. Qual é o diagnóstico?",
    alternatives: [
      { letter: "A", text: "Hipertireoidismo" },
      { letter: "B", text: "Hipotireoidismo" },
      { letter: "C", text: "Tireoidite de Hashimoto" },
      { letter: "D", text: "Bócio nodular" },
      { letter: "E", text: "Câncer de tireoide" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Endocrinologia",
  },
  {
    id: "13",
    question:
      "Um paciente com esquizofrenia apresenta alucinações auditivas persistentes. Qual é o antipsicótico típico mais comumente utilizado?",
    alternatives: [
      { letter: "A", text: "Haloperidol" },
      { letter: "B", text: "Risperidona" },
      { letter: "C", text: "Olanzapina" },
      { letter: "D", text: "Quetiapina" },
      { letter: "E", text: "Aripiprazol" },
    ],
    correctAnswer: "A",
    source: "ENARE",
    year: 2022,
    specialty: "Psiquiatria",
  },
  {
    id: "14",
    question:
      "Um homem de 70 anos apresenta dor nas costas, perda de peso e anemia. A radiografia mostra lesão lítica na coluna. Qual é o diagnóstico mais provável?",
    alternatives: [
      { letter: "A", text: "Osteoporose" },
      { letter: "B", text: "Mieloma múltiplo" },
      { letter: "C", text: "Tuberculose óssea" },
      { letter: "D", text: "Metástase óssea" },
      { letter: "E", text: "Osteomielite" },
    ],
    correctAnswer: "B",
    source: "ENARE",
    year: 2023,
    specialty: "Oncologia",
  },
  {
    id: "15",
    question:
      "Uma mulher de 25 anos com lúpus eritematoso sistêmico apresenta proteinúria e cilindros hemáticos. Qual é o achado histológico mais comum na nefrite lúpica?",
    alternatives: [
      { letter: "A", text: "Glomerulonefrite proliferativa" },
      { letter: "B", text: "Glomerulonefrite membranosa" },
      { letter: "C", text: "Glomerulonefrite mesangial" },
      { letter: "D", text: "Glomerulosclerose segmentar focal" },
      { letter: "E", text: "Glomerulonefrite crescêntica" },
    ],
    correctAnswer: "A",
    source: "ENARE",
    year: 2022,
    specialty: "Reumatologia",
  },
];

export function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

export function getQuestionsBySpecialty(specialty: string): Question[] {
  return questions.filter((q) => q.specialty === specialty);
}
