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
  topic?: string;
  resolution?: string;
  highlights?: string;
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
    <Card className="emed-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#c5a059] uppercase tracking-wider mb-1">
            {question.source || "Residência Médica"} {question.year && `• ${question.year}`}
          </span>
          <h2 className="text-lg font-bold text-[#002b5c]">
            Questão #{question.id}
          </h2>
        </div>
        {question.specialty && (
          <span className="px-3 py-1 bg-blue-50 text-[#002b5c] rounded-full text-xs font-bold">
            {question.specialty}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="question-text-body prose prose-blue max-w-none">
        {question.highlights ? (
          <div 
            className="text-gray-800 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: question.highlights }}
          />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-gray-800 leading-relaxed text-lg mb-4">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-[#002b5c]">{children}</strong>
              ),
            }}
          >
            {processText(question.question)}
          </ReactMarkdown>
        )}
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
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4
                ${
                  isSelected
                    ? showCorrect
                      ? "border-green-500 bg-green-50"
                      : showIncorrect
                        ? "border-red-500 bg-red-50"
                        : "border-[#002b5c] bg-[#002b5c]/5"
                    : showCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <span className={`
                font-bold w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0
                ${isSelected ? "bg-[#002b5c] text-white" : "bg-gray-100 text-gray-500"}
              `}>
                {alt.letter}
              </span>
              <div className="flex-1 pt-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <span className="text-gray-700">{children}</span>
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
            </button>
          );
        })}
      </div>

      {/* Result and Resolution */}
      {showResult && (
        <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in duration-500">
          <div className={`p-4 rounded-lg text-center font-bold ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {isCorrect ? "Resposta Correta!" : `Incorreto. A resposta certa é ${question.correctAnswer}`}
          </div>

          {localResolution ? (
            <div className="p-6 bg-blue-50 rounded-xl border-l-4 border-[#c5a059]">
              <h3 className="font-bold text-[#002b5c] mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#c5a059]" /> Resolução Comentada
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {processText(localResolution)}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 rounded-xl border-l-4 border-amber-500 flex flex-col items-center gap-4">
              <p className="text-amber-800 font-medium text-center">Deseja uma explicação detalhada desta questão?</p>
              <Button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="bg-[#c5a059] hover:bg-[#b08e4d] text-white font-bold"
              >
                {isGenerating ? "Gerando..." : "Gerar Resolução com IA"}
              </Button>
            </div>
          )}
        </div>
      )}

      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || disabled}
          className="w-full py-6 text-lg font-bold bg-[#002b5c] hover:bg-[#001a3a] text-white rounded-xl shadow-md"
        >
          Confirmar Resposta
        </Button>
      )}
    </Card>
  );
}
