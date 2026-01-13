import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface PerformanceData {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  bySpecialty: Array<{
    specialty: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  bySource: Array<{
    source: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  recentTrend: {
    last7Days: number;
    last30Days: number;
    improvement: number;
  };
  streak: number;
  bestSpecialty: string;
  weakestSpecialty: string;
}

export function PerformanceAnalysis() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/user-answers/performance");
      setData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de desempenho:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-8 h-8 animate-pulse mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Carregando análise de desempenho...</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">
          Responda algumas questões para ver sua análise de desempenho
        </p>
      </Card>
    );
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600 bg-green-50";
    if (accuracy >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 80) return { text: "Excelente", color: "bg-green-500" };
    if (accuracy >= 60) return { text: "Bom", color: "bg-yellow-500" };
    return { text: "Precisa Melhorar", color: "bg-red-500" };
  };

  const badge = getAccuracyBadge(data.accuracy);

  return (
    <div className="space-y-6">
      {/* Card principal de estatísticas */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-1">
              Análise de Desempenho
            </h2>
            <p className="text-blue-700 text-sm">
              Acompanhe sua evolução e identifique áreas de melhoria
            </p>
          </div>
          <Badge className={`${badge.color} text-white px-4 py-2 text-sm`}>
            {badge.text}
          </Badge>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">
              {data.accuracy.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Taxa de Acerto</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">
              {data.totalQuestions}
            </p>
            <p className="text-xs text-gray-600">Questões Respondidas</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">
              {data.correctAnswers}
            </p>
            <p className="text-xs text-gray-600">Acertos</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-gray-900">
              {data.streak}
            </p>
            <p className="text-xs text-gray-600">Dias Consecutivos</p>
          </div>
        </div>
      </Card>

      {/* Tendência recente */}
      {data.recentTrend.improvement !== 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            {data.recentTrend.improvement > 0 ? (
              <>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    Evolução Positiva
                  </p>
                  <p className="text-sm text-green-700">
                    Você melhorou {data.recentTrend.improvement.toFixed(1)}% nos últimos 7 dias
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">
                    Atenção Necessária
                  </p>
                  <p className="text-sm text-orange-700">
                    Seu desempenho caiu {Math.abs(data.recentTrend.improvement).toFixed(1)}% nos últimos 7 dias
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Desempenho por especialidade */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Desempenho por Especialidade
        </h3>

        <div className="space-y-3">
          {data.bySpecialty
            .sort((a, b) => b.accuracy - a.accuracy)
            .map((item) => (
              <div key={item.specialty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.specialty}
                    </span>
                    {item.specialty === data.bestSpecialty && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Melhor
                      </Badge>
                    )}
                    {item.specialty === data.weakestSpecialty && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        Precisa Atenção
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {item.correct}/{item.total}
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${getAccuracyColor(item.accuracy)}`}
                    >
                      {item.accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.accuracy >= 80
                        ? "bg-green-500"
                        : item.accuracy >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Desempenho por banca */}
      {data.bySource.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Desempenho por Banca
          </h3>

          <div className="space-y-3">
            {data.bySource
              .sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {item.source}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {item.correct}/{item.total}
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${getAccuracyColor(item.accuracy)}`}
                    >
                      {item.accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
