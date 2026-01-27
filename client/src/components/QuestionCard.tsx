import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Lightbulb, Sparkles, Highlighter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  onAnswer: (selectedAnswer: string, isCorrect: boolean, highlights?: string) => void;
  disabled?: boolean;
  initialAnswer?: string | null;
  onClearHighlights?: () => void;
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  initialAnswer = null,
  onClearHighlights,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialAnswer);
  const [showResult, setShowResult] = useState(!!initialAnswer);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localResolution, setLocalResolution] = useState<string | undefined>(question.resolution);
  const [currentHighlights, setCurrentHighlights] = useState<string>(question.highlights || "");
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedAnswer(initialAnswer);
    setShowResult(!!initialAnswer);
    setLocalResolution(question.resolution);
    setCurrentHighlights(question.highlights || "");
  }, [question.id, initialAnswer, question.resolution, question.highlights]);

  // Lógica de grifar texto
  useEffect(() => {
    if (disabled || showResult) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const range = selection.getRangeAt(0);
      const container = questionRef.current;
      
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      // Verificar se a seleção já contém ou está dentro de um grifo
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode;
      const existingHighlight = (node as HTMLElement)?.closest('.highlighted');

      if (existingHighlight) {
        const parent = existingHighlight.parentNode;
        if (parent) {
          while (existingHighlight.firstChild) {
            parent.insertBefore(existingHighlight.firstChild, existingHighlight);
          }
          parent.removeChild(existingHighlight);
          parent.normalize();
        }
      } else {
        const span = document.createElement('span');
        span.className = 'highlighted';
        // Estilos inline para garantir visibilidade imediata
        span.style.backgroundColor = '#ffff00';
        span.style.color = '#000000';
        span.style.borderRadius = '2px';
        span.style.padding = '2px 0';
        span.style.display = 'inline';

        try {
          range.surroundContents(span);
        } catch (e) {
          // Fallback para seleções complexas que cruzam múltiplos nós
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      }

      const updatedHtml = container.innerHTML;
      setCurrentHighlights(updatedHtml);
      selection.removeAllRanges();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [disabled, showResult, question.id]);

  const handleClearLocalHighlights = () => {
    if (questionRef.current) {
      // Remove todas as tags span.highlighted mantendo o texto
      const highlights = questionRef.current.querySelectorAll('.highlighted');
      highlights.forEach(h => {
        const parent = h.parentNode;
        if (parent) {
          while (h.firstChild) {
            parent.insertBefore(h.firstChild, h);
          }
          parent.removeChild(h);
          parent.normalize();
        }
      });
      setCurrentHighlights(questionRef.current.innerHTML);
    }
    if (onClearHighlights) onClearHighlights();
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
const res = await axios.post("/api/resolutions/generate", {
	        questionId: parseInt(question.id),
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
      // Passar os highlights atuais para a função onAnswer
      onAnswer(selectedAnswer, isCorrect, currentHighlights);
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  const processText = (text: string) => {
    return text.replace(/\n{3,}/g, "\n\n").trim();
  };

  return (
    <Card className="emed-card p-8 space-y-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
      {/* Header Refinado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#c5a059]/10 text-[#c5a059] rounded-full text-[10px] font-black uppercase tracking-widest">
              {question.source || "Residência Médica"}
            </span>
            {question.year && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {question.year}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearLocalHighlights}
            disabled={disabled || showResult}
            className="rounded-xl border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-500 font-black text-[10px] uppercase tracking-widest h-9 px-4 flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all"
          >
            <Highlighter size={14} /> Limpar Grifos
          </Button>
          {question.specialty && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-[#002b5c] dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-100/50 dark:border-blue-800/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              {question.specialty}
            </div>
          )}
        </div>
      </div>

      {/* Question Text com Estilo Acadêmico */}
      <div className="question-text-body prose prose-blue dark:prose-invert max-w-none select-text">
        <div 
          ref={questionRef}
          id={`question-content-${question.id}`}
          className="text-gray-800 dark:text-slate-200 leading-relaxed text-xl font-medium select-text pointer-events-auto"
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          dangerouslySetInnerHTML={{ 
            __html: currentHighlights || question.question.replace(/\n/g, '<br/>') 
          }}
        />
      </div>

      {/* Alternatives com Design Moderno */}
      <div className="space-y-4">
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
                w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-start gap-5 group relative overflow-hidden
                ${
                  isSelected
                    ? showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                      : showIncorrect
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                        : "border-[#002b5c] dark:border-blue-500 bg-[#002b5c]/5 dark:bg-blue-500/5 shadow-lg shadow-blue-900/5"
                    : showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                      : "border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/5"
                }
              `}
            >
              <span className={`
                font-black w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-300
                ${isSelected 
                  ? "bg-[#002b5c] dark:bg-blue-600 text-white scale-110 shadow-lg shadow-blue-900/20" 
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
                }
              `}>
                {alt.letter}
              </span>
              <div className="flex-1 pt-1.5">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <span className={`text-base font-semibold transition-colors duration-300 ${isSelected ? "text-[#002b5c] dark:text-blue-300" : "text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200"}`}>
                        {children}
                      </span>
                    ),
                  }}
                >
                  {processText(alt.text)}
                </ReactMarkdown>
              </div>
              {showResult && isAnswerCorrect && (
                <div className="bg-green-500 p-1.5 rounded-full shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}
              {showResult && isSelected && !isCorrect && (
                <div className="bg-red-500 p-1.5 rounded-full shadow-lg shadow-red-500/20">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Result and Resolution Refinado */}
      {showResult && (
        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`p-5 rounded-2xl text-center font-black text-lg shadow-inner ${
            isCorrect 
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400" 
              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
          }`}>
            {isCorrect ? "✨ Resposta Correta!" : `❌ Incorreto. A resposta certa é ${question.correctAnswer}`}
          </div>

          {localResolution ? (
            <div className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] border border-blue-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb size={80} className="text-[#c5a059]" />
              </div>
              <h3 className="font-black text-[#002b5c] dark:text-blue-400 mb-4 flex items-center gap-3 text-lg">
                <div className="w-10 h-10 bg-[#c5a059]/10 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-[#c5a059]" />
                </div>
                Resolução Comentada
              </h3>
              <div className="prose prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 font-medium leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {processText(localResolution)}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] border border-amber-100 dark:border-slate-700 flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-amber-900 dark:text-amber-400">Explicação Inteligente</h4>
                <p className="text-amber-800/70 dark:text-amber-400/70 font-bold max-w-xs">Deseja uma explicação detalhada desta questão gerada por nossa IA?</p>
              </div>
              <Button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="bg-[#c5a059] hover:bg-[#b08e4d] text-white font-black px-8 py-6 rounded-2xl shadow-xl shadow-amber-900/20 transition-all hover:scale-105 active:scale-95"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Gerando...
                  </div>
                ) : "Gerar Resolução com IA"}
              </Button>
            </div>
          )}
        </div>
      )}

      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || disabled}
          className="w-full py-8 text-xl font-black bg-[#002b5c] hover:bg-[#001a3a] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
        >
          Confirmar Resposta
          <Sparkles className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      )}
    </Card>
  );
}
