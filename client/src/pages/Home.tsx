import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { useEffect, useState, useCallback } from "react";
import { Brain, Filter, BookOpen, Trophy, LogIn, User, BarChart3, LogOut, Highlighter, Search, ChevronRight, GraduationCap, Target, Zap, Clock, RotateCcw, ListChecks } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionsApi } from "@/lib/api";
import "@/styles/emed.css";
import { useLocation } from "wouter";
import axios from "axios";

export interface Question {
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

interface QuestionStatus {
  answered: boolean;
  correct?: boolean;
  marked: boolean;
  selectedAnswer?: string;
  highlights?: string;
}

type PageState = "home" | "quiz" | "results";

export default function Home() {
  const [pageState, setPageState] = useState<PageState>("home");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  
  const initialFilters = { source: "all", year: "all", specialty: "all", topic: "all", limit: "10" };
  const [filters, setFilters] = useState(initialFilters);
  const [availableFilters, setAvailableFilters] = useState({ sources: [], years: [], specialties: [], topics: [] });
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("medquestoes_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    fetchFilters();
    updateQuestionCount(filters);
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await questionsApi.getFilters();
      if (response.data) {
        setAvailableFilters({
          sources: response.data.sources || [],
          years: response.data.years || [],
          specialties: response.data.specialties || [],
          topics: response.data.topics || []
        });
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const updateQuestionCount = async (currentFilters: any) => {
    setCountLoading(true);
    try {
      const params: any = {};
      if (currentFilters.source !== "all") params.source = currentFilters.source;
      if (currentFilters.year !== "all") params.year = currentFilters.year;
      if (currentFilters.specialty !== "all") params.specialty = currentFilters.specialty;
      if (currentFilters.topic !== "all") params.topic = currentFilters.topic;
      params.limit = 1;
      params.offset = 0;

      const response = await questionsApi.getQuestions(params);
      const responseData = response.data || response;
      const total = responseData.pagination?.total || 0;
      setTotalQuestionsCount(total);
    } catch (error) {
      console.error("Error updating count:", error);
    } finally {
      setCountLoading(false);
    }
  };

  const handleFilterChange = async (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (key === "specialty") {
      newFilters.topic = "all";
      try {
        const response = await fetch(`/api/filters/filtered-topics?specialty=${encodeURIComponent(value)}`);
        if (response.ok) {
          const result = await response.json();
          setAvailableFilters(prev => ({ ...prev, topics: result.topics || [] }));
        }
      } catch (err) {
        setAvailableFilters(prev => ({ ...prev, topics: [] }));
      }
    }
    setFilters(newFilters);
    updateQuestionCount(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    updateQuestionCount(initialFilters);
  };

  const handleStartQuiz = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const limit = parseInt(filters.limit) || 10;
      const params: any = { ...filters, limit, offset: 0 };
      const response = await questionsApi.getQuestions(params);
      const responseData = response?.data || response;
      let questionsList = Array.isArray(responseData.questions) ? responseData.questions : (Array.isArray(responseData) ? responseData : []);
      
      if (questionsList.length === 0) {
        alert("Nenhuma questão encontrada!");
        setLoading(false);
        return;
      }
      
      const shuffled = [...questionsList].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(questionsList.length, limit));
      
      setQuestions(selectedQuestions);
      setCurrentIndex(0);
      setStats({ correct: 0, incorrect: 0 });
      setQuestionStatuses(selectedQuestions.map(() => ({ answered: false, marked: false })));
      setPageState("quiz");
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Erro ao iniciar simulado:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (isCorrect: boolean, selectedAnswer: string, questionId: string, tema: string, highlights?: string) => {
    try {
      const token = localStorage.getItem("medquestoes_token");
      if (!token) return;
      const tempoResposta = Math.floor((Date.now() - questionStartTime) / 1000);
      await axios.post("/api/user-answers", {
        questionId, selectedAnswer, isCorrect, tempoResposta, tema, highlights
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const handleAnswer = (selectedAnswer: string, isCorrect: boolean, highlights?: string) => {
    if (user) {
      const tema = questions[currentIndex]?.specialty || "Geral";
      saveAnswer(isCorrect, selectedAnswer, questions[currentIndex].id, tema, highlights);
    }
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
    setQuestionStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[currentIndex] = {
        ...newStatuses[currentIndex],
        answered: true,
        correct: isCorrect,
        selectedAnswer: selectedAnswer,
        highlights: highlights
      };
      return newStatuses;
    });
  };

  const handleNavigate = useCallback((index: number) => {
    setCurrentIndex(index);
    setQuestionStartTime(Date.now());
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, questions.length]);

  const handleToggleMark = (index: number) => {
    setQuestionStatuses(prev => {
      const newStatuses = [...prev];
      newStatuses[index] = { ...newStatuses[index], marked: !newStatuses[index].marked };
      return newStatuses;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("medquestoes_user");
    localStorage.removeItem("medquestoes_token");
    setUser(null);
    setLocation("/login");
  };

  if (pageState === "quiz") {
    const currentQuestion = questions[currentIndex];
    const currentStatus = questionStatuses[currentIndex];

    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#002b5c] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-[#002b5c] dark:text-blue-400 leading-none">MedQuestões</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Simulado em Andamento</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso</span>
                  <span className="text-sm font-black text-[#002b5c] dark:text-blue-400">{currentIndex + 1} de {questions.length}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acertos</span>
                  <span className="text-sm font-black text-green-500">{stats.correct}</span>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-gray-100 dark:bg-slate-800 mx-2"></div>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPageState("home")}
                className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
              >
                Encerrar
              </Button>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 dark:bg-slate-800">
            <div 
              className="h-full bg-[#c5a059] transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={currentStatus.answered}
              initialAnswer={currentStatus.selectedAnswer}
            />
            
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-50 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="rounded-2xl font-black text-xs uppercase tracking-widest px-6 h-12 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                {questions.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#002b5c] dark:bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                  />
                ))}
              </div>
              <Button
                onClick={currentIndex === questions.length - 1 ? () => setPageState("results") : handleNext}
                className="bg-[#002b5c] dark:bg-blue-600 hover:bg-[#001a3a] dark:hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-12 shadow-lg shadow-blue-900/20"
              >
                {currentIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
              </Button>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900">
              <h3 className="text-sm font-black text-[#002b5c] dark:text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> Navegação
              </h3>
              <QuestionNavigation
                total={questions.length}
                current={currentIndex}
                statuses={questionStatuses}
                onNavigate={handleNavigate}
                onToggleMark={handleToggleMark}
              />
            </Card>

            <Card className="p-8 rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-[#002b5c] to-[#001a3a] text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Desempenho Atual</p>
                    <p className="text-xl font-black">{Math.round((stats.correct / (stats.correct + stats.incorrect || 1)) * 100)}% de Acerto</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Corretas</p>
                    <p className="text-2xl font-black text-green-400">{stats.correct}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Incorretas</p>
                    <p className="text-2xl font-black text-red-400">{stats.incorrect}</p>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </main>
      </div>
    );
  }

  if (pageState === "results") {
    const total = stats.correct + stats.incorrect;
    const accuracy = Math.round((stats.correct / total) * 100);

    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#002b5c] via-[#c5a059] to-[#002b5c]"></div>
          
          <div className="space-y-4">
            <div className="w-24 h-24 bg-[#c5a059]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-[#c5a059]" />
            </div>
            <h2 className="text-4xl font-black text-[#002b5c] dark:text-blue-400">Simulado Concluído!</h2>
            <p className="text-gray-500 dark:text-slate-400 font-bold">Confira seu desempenho detalhado abaixo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total</p>
              <p className="text-3xl font-black text-[#002b5c] dark:text-blue-400">{total}</p>
            </div>
            <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-[2rem] border border-green-100 dark:border-green-900/20">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Acertos</p>
              <p className="text-3xl font-black text-green-600">{stats.correct}</p>
            </div>
            <div className="p-6 bg-[#c5a059]/10 rounded-[2rem] border border-[#c5a059]/20">
              <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest mb-2">Precisão</p>
              <p className="text-3xl font-black text-[#c5a059]">{accuracy}%</p>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              onClick={() => setPageState("home")}
              className="w-full py-8 bg-[#002b5c] hover:bg-[#001a3a] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02]"
            >
              Voltar ao Início
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setLocation("/performance")}
              className="w-full py-8 text-[#002b5c] dark:text-blue-400 font-black text-lg hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl"
            >
              Ver Estatísticas Completas
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      {/* Header Moderno */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#002b5c] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#002b5c] dark:text-blue-400 leading-none">MedQuestões</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Plataforma de Estudos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Médico(a)</span>
                  <span className="text-sm font-black text-[#002b5c] dark:text-blue-400">{user.nome}</span>
                </div>
                <div className="h-8 w-[1px] bg-gray-100 dark:bg-slate-800 mx-2"></div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl">
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setLocation("/login")}
                className="bg-[#002b5c] hover:bg-[#001a3a] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest px-6 h-11 shadow-lg shadow-blue-900/20"
              >
                Acessar Plataforma
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c5a059]/10 text-[#c5a059] rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Zap size={14} className="fill-current" /> O Banco de Questões mais completo
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-[#002b5c] dark:text-white tracking-tight">
            Domine a Residência <br />
            <span className="text-[#c5a059]">com Inteligência.</span>
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            Milhares de questões comentadas, simulados personalizados e análise de desempenho em tempo real.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filtros e Início */}
          <Card className="lg:col-span-8 p-10 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Search size={200} className="text-[#002b5c]" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#002b5c] dark:text-blue-400">
                    <Filter size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#002b5c] dark:text-blue-400">Monte seu Simulado</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personalize sua experiência de estudo</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleClearFilters}
                  className="text-gray-400 hover:text-[#c5a059] font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Resetar Filtros
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#c5a059] rounded-full"></div> Instituição
                  </label>
                  <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-[#002b5c] dark:text-blue-300">
                      <SelectValue placeholder="Todas as bancas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as bancas</SelectItem>
                      {availableFilters.sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#c5a059] rounded-full"></div> Ano da Prova
                  </label>
                  <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-[#002b5c] dark:text-blue-300">
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {availableFilters.years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#c5a059] rounded-full"></div> Especialidade
                  </label>
                  <Select value={filters.specialty} onValueChange={(v) => handleFilterChange("specialty", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-[#002b5c] dark:text-blue-300">
                      <SelectValue placeholder="Todas as áreas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as áreas</SelectItem>
                      {availableFilters.specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#c5a059] rounded-full"></div> Tema Específico
                  </label>
                  <Select value={filters.topic} onValueChange={(v) => handleFilterChange("topic", v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-[#002b5c] dark:text-blue-300">
                      <SelectValue placeholder="Todos os temas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os temas</SelectItem>
                      {availableFilters.topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#c5a059] rounded-full"></div> Quantidade de Questões
                  </label>
                  <Input 
                    type="number" 
                    value={filters.limit} 
                    onChange={(e) => handleFilterChange("limit", e.target.value)}
                    className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-black text-xl text-[#002b5c] dark:text-blue-300 text-center"
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col items-center gap-4">
                <Button 
                  onClick={handleStartQuiz}
                  disabled={loading || totalQuestionsCount === 0}
                  className="w-full md:w-80 h-16 bg-[#002b5c] hover:bg-[#001a3a] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Preparando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Zap size={20} className="fill-current" /> Iniciar Simulado
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {countLoading ? "Calculando..." : `${totalQuestionsCount.toLocaleString()} questões prontas para você`}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sidebar de Atalhos */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 rounded-[3rem] border-none shadow-2xl bg-gradient-to-br from-[#002b5c] to-[#001a3a] text-white relative overflow-hidden group cursor-pointer" onClick={() => setLocation("/performance")}>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <BarChart3 size={28} className="text-[#c5a059]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Desempenho</h3>
                  <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest mt-1">Análise detalhada</p>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Ver evolução</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Card>

            <Card className="p-8 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 group cursor-pointer" onClick={() => setLocation("/errornotebook")}>
              <div className="space-y-6">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002b5c] dark:text-blue-400">Caderno de Erros</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Revise seus pontos fracos</p>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#002b5c] transition-colors">Acessar agora</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </Card>

            <div className="p-8 bg-[#c5a059]/5 rounded-[3rem] border border-[#c5a059]/10 space-y-4">
              <div className="flex items-center gap-3 text-[#c5a059]">
                <Brain size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Dica do Dia</span>
              </div>
              <p className="text-sm font-bold text-[#002b5c]/70 dark:text-blue-300/70 leading-relaxed">
                "A repetição espaçada é a chave para a memorização de longo prazo em temas complexos como Nefrologia."
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <GraduationCap size={20} className="text-[#002b5c] dark:text-blue-400" />
            <span className="text-xs font-black text-[#002b5c] dark:text-blue-400 uppercase tracking-widest">MedQuestões © 2026</span>
          </div>
          <div className="flex items-center gap-8">
            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#002b5c] transition-colors">Termos</button>
            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#002b5c] transition-colors">Privacidade</button>
            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#002b5c] transition-colors">Suporte</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
