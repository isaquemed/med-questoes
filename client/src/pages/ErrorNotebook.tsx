import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, LogOut, Filter, RefreshCw, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
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

      const uniqueSpecialties = Array.from(new Set(data?.map((e: ErrorQuestion) => e.specialty) || [])) as string[];
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002b5c] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Abrindo seu caderno de erros...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-[#002b5c]">Caderno de Erros</h1>
              <p className="text-xs text-gray-500 hidden md:block">Revise e aprenda com seus erros</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#002b5c]">{user.nome}</p>
                <p className="text-xs text-gray-500">{user.usuario}</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="p-6 shadow-sm border-l-4 border-l-red-500 md:col-span-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total de Erros</p>
            <p className="text-3xl font-black text-red-600">{errors.length}</p>
          </Card>

          <Card className="p-6 shadow-sm md:col-span-3 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-[#002b5c] font-bold whitespace-nowrap">
              <Filter size={18} /> Filtrar por Área:
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-72 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Todas as especialidades" />
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
              onClick={loadErrorNotebook}
              className="ml-auto border-[#002b5c] text-[#002b5c]"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
          </Card>
        </div>

        {/* Lista de Erros */}
        {filteredErrors.length === 0 ? (
          <Card className="p-16 text-center shadow-xl border-t-4 border-t-[#10b981]">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-[#002b5c] mb-2">Tudo limpo por aqui!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {errors.length === 0
                ? 'Você ainda não tem erros registrados. Continue praticando para manter esse caderno vazio!'
                : 'Nenhuma questão encontrada para o filtro selecionado.'}
            </p>
            <Button onClick={() => setLocation('/')} className="bg-[#002b5c] px-8 py-6 text-lg">
              Voltar às Questões
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredErrors.map((err, idx) => (
              <Card key={idx} className="p-8 shadow-md hover:shadow-lg transition-all border-l-4 border-l-red-500 bg-white">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-[#002b5c]/10 text-[#002b5c] rounded-full text-[10px] font-black uppercase tracking-widest">
                    {err.specialty}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {err.source} {err.year}
                  </span>
                  <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest ml-auto">
                    {err.attempts} {err.attempts === 1 ? 'Tentativa' : 'Tentativas'}
                  </span>
                </div>

                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-lg text-gray-800 leading-relaxed font-medium">{err.question}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-red-50 rounded-xl border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <AlertCircle size={40} className="text-red-600" />
                    </div>
                    <p className="text-xs text-red-600 font-black uppercase tracking-wider mb-2">Sua Resposta</p>
                    <p className="text-xl font-black text-red-700">{err.selectedAnswer}</p>
                  </div>
                  <div className="p-5 bg-green-50 rounded-xl border border-green-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 font-black uppercase tracking-wider mb-2">Resposta Correta</p>
                    <p className="text-xl font-black text-green-700">{err.correctAnswer}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    variant="ghost" 
                    className="text-[#002b5c] font-bold hover:bg-[#002b5c]/5"
                    onClick={() => setLocation(`/?question=${err.id}`)}
                  >
                    Revisar Questão Completa →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
