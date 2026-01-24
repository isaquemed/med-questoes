import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BookOpen, Target, Award, LogOut, ArrowLeft } from 'lucide-react';

interface PerformanceStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  bySpecialty: Array<{ specialty: string; total: number; correct: number; accuracy: number }>;
  bySource: Array<{ source: string; total: number; correct: number; accuracy: number }>;
  recentTrend: { last7Days: number; last30Days: number; improvement: number };
}

export default function Performance() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('medquestoes_user');
      const token = localStorage.getItem('medquestoes_token');

      if (!userData || !token) {
        setLocation('/login');
        return;
      }

      setUser(JSON.parse(userData));

      const response = await fetch('/api/user-answers/performance', {
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
        throw new Error('Erro ao carregar desempenho');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar desempenho:', err);
      setError('Erro ao carregar dados de desempenho');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medquestoes_user');
    localStorage.removeItem('medquestoes_token');
    setLocation('/login');
  };

  if (loading) {
    return (
      <div className="performance-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados de desempenho...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-container">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 max-w-md">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Voltar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="performance-container">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 max-w-md text-center">
            <p className="text-muted-foreground mb-4">Nenhum dado de desempenho disponível.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Começar a responder questões
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#67e8f9'];

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
              <h1 className="text-2xl font-bold">Meu Desempenho</h1>
              <p className="text-sm text-muted-foreground">Análise detalhada do seu progresso</p>
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
        {/* User Info Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Usuário</p>
              <p className="text-xl font-semibold">{user.nome || user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Award className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total de Questões</p>
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalQuestions}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Acertos</p>
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500">{stats.correctAnswers}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Erros</p>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{stats.incorrectAnswers}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
              <Award className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-accent">{stats.accuracy.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Desempenho por Especialidade */}
          {stats.bySpecialty.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Desempenho por Especialidade</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.bySpecialty}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="specialty" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#0d9488" name="Taxa de Acerto (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Desempenho por Banca */}
          {stats.bySource.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Desempenho por Banca</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.bySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#14b8a6" name="Taxa de Acerto (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Tendência Recente */}
        {stats.recentTrend && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Tendência Recente</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Últimos 7 dias</p>
                <p className="text-2xl font-bold">{stats.recentTrend.last7Days.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Últimos 30 dias</p>
                <p className="text-2xl font-bold">{stats.recentTrend.last30Days.toFixed(1)}%</p>
              </div>
              <div className={`p-4 rounded-lg ${stats.recentTrend.improvement >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-muted-foreground mb-1">Melhora</p>
                <p className={`text-2xl font-bold ${stats.recentTrend.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.recentTrend.improvement >= 0 ? '+' : ''}{stats.recentTrend.improvement.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Detalhes por Especialidade */}
        {stats.bySpecialty.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes por Especialidade</h2>
            <div className="space-y-3">
              {stats.bySpecialty.map((spec, idx) => (
                <div key={idx} className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{spec.specialty}</span>
                    <span className="text-sm font-semibold text-primary">{spec.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{spec.correct}/{spec.total} acertos</span>
                  </div>
                  <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${spec.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
