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
    <Card className="elegant-card p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2 border-b-2 border-accent pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {question.source && `[${question.source}${question.year ? ` - ${question.year}` : ""}]`}
          </h2>
          {question.specialty && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {question.specialty}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-4">
        <div className="prose prose-blue max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-lg leading-relaxed text-foreground mb-4">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">{children}</strong>
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
              code: ({ children }) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {processText(question.question)}
          </ReactMarkdown>
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
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? showCorrect
                      ? "border-green-500 bg-green-50"
                      : showIncorrect
                        ? "border-red-500 bg-red-50"
                        : "border-primary bg-blue-50"
                    : showCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-primary hover:bg-secondary"
                }
                ${disabled || showResult ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-start gap-4">
                <span className="font-bold text-lg min-w-8 pt-1">
                  {alt.letter})
                </span>
                <div className="flex-1 prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <span className="text-foreground">{children}</span>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-200 px-1 rounded text-xs font-mono">
                          {children}
                        </code>
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
        <div className="space-y-4">
          <div
            className={`
              p-4 rounded-lg text-center font-semibold
              ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            `}
          >
            {isCorrect ? "✓ Resposta Correta!" : "✗ Resposta Incorreta"}
            {!isCorrect && (
              <p className="text-sm mt-2">
                A resposta correta é: <strong>{question.correctAnswer})</strong>
              </p>
            )}
          </div>

          {/* Bloco da Resolução Comentada */}
          {localResolution ? (
            <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5" /> Resolução Comentada
              </h3>
              <div className="prose prose-blue max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="text-blue-900 leading-relaxed mb-3">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-blue-950">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 my-3 text-blue-900">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 my-3 text-blue-900">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-400 pl-4 italic my-3 text-blue-800">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {processText(localResolution)}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="font-bold text-amber-800 mb-1 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Resolução não encontrada
                </h3>
                <p className="text-amber-900 text-sm">
                  Deseja que nossa IA gere uma explicação detalhada agora?
                </p>
              </div>
              <Button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isGenerating ? "IA pensando..." : "Gerar Resolução com IA"}
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
          className="w-full elegant-button"
        >
          Confirmar Resposta
        </Button>
      )}
    </Card>
  );
}
