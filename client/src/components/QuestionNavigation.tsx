import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Flag,
  Grid3x3
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface QuestionStatus {
  answered: boolean;
  correct?: boolean;
  marked: boolean;
}

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  questionStatuses: QuestionStatus[];
  onNavigate: (index: number) => void;
  onToggleMark: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  questionStatuses,
  onNavigate,
  onToggleMark,
  onPrevious,
  onNext,
  disabled = false,
}: QuestionNavigationProps) {
  const [showGrid, setShowGrid] = useState(false);
  const currentStatus = questionStatuses[currentIndex];

  const getQuestionIcon = (status: QuestionStatus, index: number) => {
    if (status.answered && status.correct !== undefined) {
      return status.correct ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <Circle className="w-4 h-4 text-red-600 fill-red-600" />
      );
    }
    if (status.marked) {
      return <Flag className="w-4 h-4 text-amber-600 fill-amber-600" />;
    }
    return <Circle className="w-4 h-4 text-gray-300" />;
  };

  const getQuestionButtonClass = (status: QuestionStatus, index: number) => {
    const baseClass = "w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all font-semibold text-sm";
    
    if (index === currentIndex) {
      return `${baseClass} border-blue-500 bg-blue-50 text-blue-700`;
    }
    
    if (status.answered && status.correct !== undefined) {
      return status.correct
        ? `${baseClass} border-green-500 bg-green-50 text-green-700 hover:bg-green-100`
        : `${baseClass} border-red-500 bg-red-50 text-red-700 hover:bg-red-100`;
    }
    
    if (status.marked) {
      return `${baseClass} border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100`;
    }
    
    return `${baseClass} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
  };

  const answeredCount = questionStatuses.filter(s => s.answered).length;
  const markedCount = questionStatuses.filter(s => s.marked).length;
  const correctCount = questionStatuses.filter(s => s.answered && s.correct).length;

  return (
    <Card className="p-4 space-y-4">
      {/* Header com estatísticas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-foreground">
            Questão {currentIndex + 1} de {totalQuestions}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleMark(currentIndex)}
            disabled={disabled}
            className={currentStatus?.marked ? "text-amber-600" : "text-gray-400"}
          >
            <Flag className={`w-5 h-5 ${currentStatus?.marked ? "fill-amber-600" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">
              {correctCount}/{answeredCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4 text-amber-600" />
            <span className="text-gray-600">{markedCount}</span>
          </div>
        </div>
      </div>

      {/* Barra de progresso visual */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Botões de navegação */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={disabled || currentIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <Popover open={showGrid} onOpenChange={setShowGrid}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Todas as Questões</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGrid(false)}
                  className="h-6 px-2"
                >
                  Fechar
                </Button>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 pb-2 border-b">
                <div className="flex items-center gap-1">
                  <Circle className="w-3 h-3 text-gray-300" />
                  <span>Não respondida</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>Correta</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="w-3 h-3 text-red-600 fill-red-600" />
                  <span>Incorreta</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span>Marcada</span>
                </div>
              </div>

              {/* Grid de questões */}
              <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {questionStatuses.map((status, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onNavigate(index);
                      setShowGrid(false);
                    }}
                    disabled={disabled}
                    className={getQuestionButtonClass(status, index)}
                    title={`Questão ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={disabled || currentIndex === totalQuestions - 1}
          className="flex-1"
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Atalhos de teclado */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">←</span> Anterior •{" "}
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">→</span> Próxima •{" "}
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">M</span> Marcar
      </div>
    </Card>
  );
}
