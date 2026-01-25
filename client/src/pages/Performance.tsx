import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, BookOpen, Target, Award, LogOut, ArrowLeft, Stethoscope } from 'lucide-react';

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002b5c] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Analisando seu progresso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center shadow-xl">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <Button onClick={() => setLocation('/')} className="w-full bg-[#002b5c]">
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="p-12 max-w-md text-center shadow-xl border-t-4 border-t-[#d4af37]">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#002b5c] mb-2">Sem dados ainda</h2>
          <p className="text-gray-500 mb-8">Você precisa responder algumas questões para ver sua análise de desempenho.</p>
          <Button onClick={() => setLocation('/')} className="w-full bg-[#002b5c] py-6 text-lg">
            Começar a Estudar
          </Button>
        </Card>
      </div>
    );
  }

  const COLORS = ['#002b5c', '#d4af37', '#1e40af', '#fbbf24'];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/')} className="text-[#002b5c]">
              <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
            <div>
              <h1 className="text-xl font-bold text-[#002b5c]">Meu Desempenho</h1>
              <p className="text-xs text-gray-500 hidden md:block">Análise detalhada de evolução</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#002b5c]">{user.nome}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="p-6 shadow-sm border-l-4 border-l-[#002b5c]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total</p>
              <div className="p-2 bg-[#002b5c]/10 rounded-lg text-[#002b5c]">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#002b5c]">{stats.totalQuestions}</p>
            <p className="text-xs text-gray-400 mt-2">Questões respondidas</p>
          </Card>

          <Card className="p-6 shadow-sm border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Acertos</p>
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <p className="text-4xl font-black text-green-600">{stats.correctAnswers}</p>
            <p className="text-xs text-gray-400 mt-2">Respostas corretas</p>
          </Card>

          <Card className="p-6 shadow-sm border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Erros</p>
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-4xl font-black text-red-600">{stats.incorrectAnswers}</p>
            <p className="text-xs text-gray-400 mt-2">Respostas incorretas</p>
          </Card>

          <Card className="p-6 shadow-sm border-l-4 border-l-[#d4af37]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Aproveitamento</p>
              <div className="p-2 bg-[#d4af37]/10 rounded-lg text-[#d4af37]">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#d4af37]">{stats.accuracy.toFixed(1)}%</p>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4af37] transition-all duration-1000"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Desempenho por Especialidade */}
          <Card className="p-8 shadow-md">
            <h2 className="text-xl font-bold text-[#002b5c] mb-8 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-[#d4af37]" /> Desempenho por Especialidade
            </h2>
            {stats.bySpecialty.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.bySpecialty} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="specialty" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.bySpecialty.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#002b5c' : '#d4af37'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400 italic">
                Dados insuficientes para gerar o gráfico
              </div>
            )}
          </Card>

          {/* Tendência e Melhora */}
          <div className="space-y-8">
            <Card className="p-8 shadow-md bg-[#002b5c] text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#d4af37]" /> Tendência Recente
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-blue-200 text-xs font-bold uppercase">Últimos 7 dias</p>
                  <p className="text-4xl font-black">{stats.recentTrend.last7Days.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-blue-200 text-xs font-bold uppercase">Últimos 30 dias</p>
                  <p className="text-4xl font-black">{stats.recentTrend.last30Days.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-white/10 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium">Evolução no período:</span>
                <span className={`text-xl font-black ${stats.recentTrend.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.recentTrend.improvement >= 0 ? '+' : ''}{stats.recentTrend.improvement.toFixed(1)}%
                </span>
              </div>
            </Card>

            <Card className="p-8 shadow-md">
              <h2 className="text-xl font-bold text-[#002b5c] mb-6">Top Bancas</h2>
              <div className="space-y-4">
                {stats.bySource.slice(0, 4).map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-[#002b5c] shadow-sm">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-gray-700">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#002b5c]">{source.accuracy.toFixed(1)}%</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{source.total} questões</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Detalhes por Especialidade Table */}
        <Card className="shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-[#002b5c]">Análise por Especialidade</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Especialidade</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Acertos</th>
                  <th className="px-6 py-4">Aproveitamento</th>
                  <th className="px-6 py-4">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.bySpecialty.map((spec, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700">{spec.specialty}</td>
                    <td className="px-6 py-4 text-gray-600">{spec.total}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{spec.correct}</td>
                    <td className="px-6 py-4 font-black text-[#002b5c]">{spec.accuracy.toFixed(1)}%</td>
                    <td className="px-6 py-4 w-48">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#002b5c]" 
                          style={{ width: `${spec.accuracy}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
