import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ErrorQuestion {
  id: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  specialty?: string;
  source?: string;
  year?: number;
}

export const exportErrorNotebookToPDF = (questions: ErrorQuestion[]) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.setTextColor(0, 43, 92); // Azul marinho
  doc.text('Caderno de Erros - MedQuestões', 14, 20);

  // Data
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  // Tabela
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Especialidade', 'Fonte', 'Ano', 'Sua Resposta', 'Resposta Correta']],
    body: questions.map((q, index) => [
      (index + 1).toString(),
      q.specialty || '-',
      q.source || '-',
      q.year?.toString() || '-',
      q.selectedAnswer,
      q.correctAnswer,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 43, 92] }, // Azul marinho
    styles: { fontSize: 9 },
  });

  // Salvar
  doc.save(`caderno-de-erros-${new Date().getTime()}.pdf`);
};
