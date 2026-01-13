import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookX, 
  TrendingDown, 
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface ErrorQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  specialty?: string;
  source?: string;
  year?: number;
  answeredAt: number;
  attempts: number;
}

interface ErrorNotebookProps {
  onStartReview: (questions: any[]) => void;
}

export function ErrorNotebook({ onStartReview }: ErrorNotebookProps) {
  const [errors, setErrors] = useState<ErrorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/user-answers/errors");
      const errorData = response.data || [];
      
      setErrors(errorData);
      
      // Extrair especialidades únicas
      const uniqueSpecialties = [...new Set(
        errorData
          .map((e: ErrorQuestion) => e.specialty)
          .filter(Boolean)
      )] as string[];
      
      setSpecialties(uniqueSpecialties);
    } catch (error) {
      console.error("Erro ao buscar caderno de erros:", error);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredErrors = filterSpecialty === "all" 
    ? errors 
    : errors.filter(e => e.specialty === filterSpecialty);

  const errorsBySpecialty = errors.reduce((acc, error) => {
    const specialty = error.specialty || "Sem especialidade";
    acc[specialty] = (acc[specialty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topWeakAreas = Object.entries(errorsBySpecialty)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleReviewErrors = () => {
    if (filteredErrors.length === 0) return;
    
    // Converter erros para formato de questões
    const questionsToReview = filteredErrors.map(error => ({
      id: error.id,
      // Você precisará buscar os dados completos da questão
      // Por enquanto, passamos apenas o ID
    }));
    
    onStartReview(questionsToReview);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Carregando caderno de erros...</p>
      </Card>
    );
  }

  if (errors.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BookX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          Nenhum erro registrado
        </h3>
        <p className="text-gray-500">
          Continue praticando! Os erros aparecerão aqui para você revisar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookX className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">
                Caderno de Erros
              </h2>
            </div>
            <p className="text-red-700">
              Transforme seus erros em aprendizado
            </p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {errors.length} {errors.length === 1 ? "erro" : "erros"}
          </Badge>
        </div>

        <Button
          onClick={handleReviewErrors}
          disabled={filteredErrors.length === 0}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Revisar {filteredErrors.length} {filteredErrors.length === 1 ? "Questão" : "Questões"}
        </Button>
      </Card>

      {/* Áreas mais fracas */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-lg">Áreas que Precisam de Atenção</h3>
        </div>

        <div className="space-y-3">
          {topWeakAreas.map(([specialty, count]) => (
            <div key={specialty} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {specialty}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${(count / errors.length) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="outline" className="min-w-12 justify-center">
                  {count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filtro por especialidade */}
      {specialties.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">
              Filtrar por Especialidade
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterSpecialty === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSpecialty("all")}
            >
              Todas ({errors.length})
            </Button>
            {specialties.map((specialty) => (
              <Button
                key={specialty}
                variant={filterSpecialty === specialty ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterSpecialty(specialty)}
              >
                {specialty} ({errorsBySpecialty[specialty]})
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de erros */}
      <div className="space-y-3">
        {filteredErrors.map((error, index) => (
          <Card key={`${error.id}-${index}`} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {error.source && (
                    <Badge variant="outline" className="text-xs">
                      {error.source} {error.year && `- ${error.year}`}
                    </Badge>
                  )}
                  {error.specialty && (
                    <Badge className="text-xs bg-blue-100 text-blue-700">
                      {error.specialty}
                    </Badge>
                  )}
                  {error.attempts > 1 && (
                    <Badge variant="destructive" className="text-xs">
                      {error.attempts}x errada
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {error.question}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(error.answeredAt * 1000).toLocaleDateString("pt-BR")}
                  </div>
                  <div>
                    Você marcou: <strong className="text-red-600">{error.selectedAnswer}</strong>
                  </div>
                  <div>
                    Correta: <strong className="text-green-600">{error.correctAnswer}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
