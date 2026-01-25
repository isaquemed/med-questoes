import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Lightbulb, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from 'axios';

interface Question {
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
  resolution?: string;
  highlights?: string; // Adicionado suporte a grifos salvos
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
  disabled?: boolean;
  initialAnswer?: string | null;
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  initialAnswer = null,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer);
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localResolution, setLocalResolution] = useState<string | undefined>(question.resolution);

  useEffect(() => {
    setSelectedAnswer(initialAnswer);
    setShowResult(!!initialAnswer);
    setLocalResolution(question.resolution);
  }, [question.id, initialAnswer, question.resolution]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post("/api/resolutions/generate", {
        questionId: question.id,
        questionText: question.question
      });
      setLocalResolution(res.data.resolution);
    } catch (err) {
      console.error("Erro ao chamar a IA:", err);
      alert("Não foi possível gerar a resolução no momento. Tente novamente mais tarde.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (letter: string) => {
    if (!disabled && !showResult) {
      setSelectedAnswer(letter);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer && !showResult) {
      const isCorrect = selectedAnswer === question.correctAnswer;
      setShowResult(true);
      onAnswer(selectedAnswer, isCorrect);
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  const processText = (text: string) => {
    return text.replace(/\n{3,}/g, "\n\n").trim();
  };

  return (
    <Card className="elegant-card p-8 space-y-6 border-t-4 border-t-[#d4af37]">
      {/* Header */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#002b5c]">
            {question.source && `[${question.source}${question.year ? ` - ${question.year}` : ""}]`}
          </h2>
          {question.specialty && (
            <span className="px-3 py-1 bg-[#002b5c]/10 text-[#002b5c] rounded-full text-xs font-bold uppercase tracking-wider">
              {question.specialty}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-4">
        <div className="prose prose-blue max-w-none">
          {question.highlights ? (
            <div 
              className="text-lg leading-relaxed text-foreground mb-4"
              dangerouslySetInnerHTML={{ __html: question.highlights }}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="text-lg leading-relaxed text-foreground mb-4">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[#002b5c]">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 my-4">{children}</ol>
                ),
              }}
            >
              {processText(question.question)}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* Alternatives */}
      <div className="space-y-3">
        {question.alternatives.map((alt) => {
          const isSelected = selectedAnswer === alt.letter;
          const isAnswerCorrect = alt.letter === question.correctAnswer;
          const showCorrect = showResult && isAnswerCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={alt.letter}
              onClick={() => handleSelectAnswer(alt.letter)}
              disabled={disabled || showResult}
              className={`
                w-full p-5 rounded-xl border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? showCorrect
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : showIncorrect
                        ? "border-red-500 bg-red-50 shadow-sm"
                        : "border-[#002b5c] bg-[#002b5c]/5 shadow-md"
                    : showCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-100 hover:border-[#002b5c]/30 hover:bg-gray-50"
                }
                ${disabled || showResult ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-start gap-4">
                <span className={`
                  font-bold text-lg min-w-8 h-8 flex items-center justify-center rounded-full
                  ${isSelected ? "bg-[#002b5c] text-white" : "bg-gray-100 text-gray-500"}
                `}>
                  {alt.letter}
                </span>
                <div className="flex-1 pt-0.5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <span className="text-gray-700 font-medium">{children}</span>
                      ),
                    }}
                  >
                    {processText(alt.text)}
                  </ReactMarkdown>
                </div>
                {showResult && isAnswerCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Message and Resolution */}
      {showResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            className={`
              p-4 rounded-xl text-center font-bold text-lg
              ${isCorrect ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}
            `}
          >
            {isCorrect ? "✓ Resposta Correta!" : "✗ Resposta Incorreta"}
            {!isCorrect && (
              <p className="text-sm mt-2 font-medium">
                A alternativa correta é a <strong>{question.correctAnswer}</strong>
              </p>
            )}
          </div>

          {/* Bloco da Resolução Comentada */}
          {localResolution ? (
            <div className="p-8 bg-[#002b5c]/5 border-l-4 border-[#d4af37] rounded-r-xl">
              <h3 className="font-bold text-[#002b5c] mb-4 flex items-center gap-2 text-xl">
                <Lightbulb className="w-6 h-6 text-[#d4af37]" /> Resolução Comentada
              </h3>
              <div className="prose prose-blue max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-[#002b5c]">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 my-4 text-gray-700">
                        {children}
                      </ul>
                    ),
                  }}
                >
                  {processText(localResolution)}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center justify-center gap-2 text-lg">
                  <AlertTriangle className="w-6 h-6" /> Resolução não disponível
                </h3>
                <p className="text-amber-900 font-medium">
                  Deseja que nossa IA gere uma explicação detalhada agora?
                </p>
              </div>
              <Button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="bg-[#d4af37] hover:bg-[#b8962d] text-[#002b5c] font-bold px-8 py-6 rounded-xl"
              >
                {isGenerating ? "IA Analisando..." : "Gerar Resolução com IA"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || disabled}
          className="w-full py-8 text-xl font-bold bg-[#002b5c] hover:bg-[#001a3a] rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          Confirmar Resposta
        </Button>
      )}
    </Card>
  );
}
