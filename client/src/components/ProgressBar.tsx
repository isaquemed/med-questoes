import { Card } from "@/components/ui/card";

interface ProgressBarProps {
  current: number;
  total: number;
  correct: number;
  incorrect: number;
}

export function ProgressBar({
  current,
  total,
  correct,
  incorrect,
}: ProgressBarProps) {
  const percentage = (current / total) * 100;
  const correctPercentage = total > 0 ? (correct / total) * 100 : 0;

  return (
    <Card className="elegant-card p-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Questão</p>
          <p className="text-2xl font-bold text-primary">
            {current}/{total}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Corretas</p>
          <p className="text-2xl font-bold text-green-600">{correct}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Incorretas</p>
          <p className="text-2xl font-bold text-red-600">{incorrect}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {percentage.toFixed(0)}% concluído
        </p>
      </div>

      {/* Accuracy */}
      {current > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Taxa de Acerto</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${correctPercentage}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-foreground min-w-12">
              {correctPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
