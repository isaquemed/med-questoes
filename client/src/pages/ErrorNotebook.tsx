import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, LogOut, Filter, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ErrorQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  specialty: string;
  source: string;
  year: number;
  answeredAt: number;
  attempts: number;
}

export default function ErrorNotebook() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [errors, setErrors] = useState<ErrorQuestion[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    loadErrorNotebook();
  }, []);

  useEffect(() => {
    filterErrors();
  }, [selectedSpecialty, errors]);

  const loadErrorNotebook = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('medquestoes_user');
      const token = localStorage.getItem('medquestoes_token');

      if (!userData || !token) {
        setLocation('/login');
        return;
      }

      setUser(JSON.parse(userData));

      const response = await fetch('/api/user-answers/errors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('medquestoes_user');
        localStorage.removeItem('medquestoes_token');
        setLocation('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar caderno de erros');
      }

      const data = await response.json();
      setErrors(data || []);

      // Extrair especialidades únicas
      const uniqueSpecialties = [...new Set(data?.map((e: ErrorQuestion) => e.specialty))];
      setSpecialties(uniqueSpecialties.filter(Boolean));
    } catch (err) {
      console.error('Erro ao carregar caderno de erros:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filterErrors = () => {
    if (selectedSpecialty === 'all') {
      setFilteredErrors(errors);
    } else {
      setFilteredErrors(errors.filter(e => e.specialty === selectedSpecialty));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medquestoes_user');
    localStorage.removeItem('medquestoes_token');
    setLocation('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando caderno de erros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => setLocation('/')} className="w-full">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Caderno de Erros</h1>
              <p className="text-sm text-muted-foreground">Revise as questões que você errou</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total de Erros</p>
            <p className="text-3xl font-bold text-destructive">{errors.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
            <p className="text-3xl font-bold text-primary">{specialties.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Filtrando</p>
            <p className="text-3xl font-bold text-accent">
              {selectedSpecialty === 'all' ? filteredErrors.length : filteredErrors.length}
            </p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as especialidades</SelectItem>
                {specialties.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadErrorNotebook}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </Card>

        {/* Lista de Erros */}
        {filteredErrors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {errors.length === 0
                ? 'Nenhum erro registrado ainda. Continue respondendo questões!'
                : 'Nenhuma questão encontrada com os filtros selecionados.'}
            </p>
            <Button onClick={() => setLocation('/')}>
              Voltar às Questões
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((err, idx) => (
              <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Especialidade</p>
                    <p className="font-semibold text-sm">{err.specialty}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Banca</p>
                    <p className="font-semibold text-sm">{err.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ano</p>
                    <p className="font-semibold text-sm">{err.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tentativas</p>
                    <p className="font-semibold text-sm">{err.attempts}</p>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-foreground">{err.question}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 font-semibold mb-1">Sua Resposta</p>
                    <p className="text-sm font-bold text-red-700">{err.selectedAnswer})</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-semibold mb-1">Resposta Correta</p>
                    <p className="text-sm font-bold text-green-700">{err.correctAnswer})</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
