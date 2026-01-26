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
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    fetchFilters();
    updateQuestionCount(filters);
  }, []);

  useEffect(() => {
    if (!highlightsEnabled || pageState !== "quiz") return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0) {
        const range = selection?.getRangeAt(0);
        if (!range) return;
        
        const questionTextContainer = document.querySelector('.question-text-body');
        if (!questionTextContainer || !questionTextContainer.contains(range.commonAncestorContainer)) {
          return;
        }
        
        const selectedNode = range.startContainer.parentNode;
        
        if (selectedNode instanceof HTMLElement && selectedNode.classList.contains('highlighted')) {
          const parent = selectedNode.parentNode;
          if (parent) {
            while (selectedNode.firstChild) {
              parent.insertBefore(selectedNode.firstChild, selectedNode);
            }
            parent.removeChild(selectedNode);
            parent.normalize();
          }
        } else {
          const span = document.createElement('span');
          span.className = 'highlighted';
          span.style.backgroundColor = '#fef08a'; // Amarelo suave para o grifo
          span.style.color = 'inherit';
          try {
            range.surroundContents(span);
          } catch(e) {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        }
        
        // Capturar o HTML grifado
        const currentHighlights = questionTextContainer.innerHTML;
        setQuestionStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[currentIndex] = {
            ...newStatuses[currentIndex],
            highlights: currentHighlights
          };
          return newStatuses;
        });
        
        selection?.removeAllRanges();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [highlightsEnabled, pageState, currentIndex]);

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

  const handleAnswer = (selectedAnswer: string, isCorrect: boolean) => {
    const currentStatus = questionStatuses[currentIndex];
    if (user) {
      const tema = questions[currentIndex]?.specialty || "Geral";
      saveAnswer(isCorrect, selectedAnswer, questions[currentIndex].id, tema, currentStatus.highlights);
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

  const handleFinishQuiz = () => setPageState("results");

  const handleRestart = () => {
    setPageState("home");
    setQuestions([]);
    setCurrentIndex(0);
    setStats({ correct: 0, incorrect: 0 });
    setQuestionStatuses([]);
    updateQuestionCount(filters);
  };

  const handleLogout = () => {
    localStorage.removeItem("medquestoes_user");
    localStorage.removeItem("medquestoes_token");
    setUser(null);
    setPageState("home");
  };

  const clearHighlights = () => {
    const highlights = document.querySelectorAll('.highlighted');
    highlights.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
      }
    });
  };

  if (pageState === "home") {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Navbar Moderna */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#002b5c] to-[#004a99] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-[#002b5c] tracking-tighter">MedQuestões</h1>
            </div>
            
            <div className="flex items-center gap-8">
              {user ? (
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-6">
                    <button onClick={() => setLocation('/performance')} className="text-sm font-bold text-gray-500 hover:text-[#002b5c] transition-all">Desempenho</button>
                    <button onClick={() => setLocation('/error-notebook')} className="text-sm font-bold text-gray-500 hover:text-[#002b5c] transition-all">Caderno de Erros</button>
                  </div>
                  <div className="h-6 w-[1px] bg-gray-200"></div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Médico(a)</p>
                      <p className="text-sm font-black text-[#002b5c]">{user.nome || user.name}</p>
                    </div>
<ThemeToggle />
                    <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
	                      <LogOut size={18} />
	                    </button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setLocation('/login')} className="bg-[#002b5c] hover:bg-[#001a3a] text-white font-bold rounded-xl px-6">
                  Acessar Plataforma
                </Button>
              )}
            </div>
          </div>
        </nav>

        <main>
          {/* Hero Section Impactante */}
          <section className="relative overflow-hidden bg-[#002b5c] py-24 px-6">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-400 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[#c5a059] rounded-full blur-[120px]"></div>
            </div>
            
            <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                <Zap size={14} className="text-[#c5a059]" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">O Banco de Questões mais completo</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
                Domine a Residência <br /> com <span className="text-[#c5a059]">Inteligência.</span>
              </h2>
              <p className="text-blue-100/70 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Milhares de questões comentadas, simulados personalizados e análise de desempenho em tempo real.
              </p>
            </div>
          </section>

          {/* Seção de Filtros Premium */}
          <section className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
            <Card className="bg-white shadow-2xl shadow-blue-900/10 border-none rounded-[2rem] overflow-hidden">
              <div className="p-8 md:p-12 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002b5c]">
                      <Filter size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#002b5c]">Monte seu Simulado</h3>
                      <p className="text-sm text-gray-400 font-medium">Personalize sua experiência de estudo</p>
                    </div>
                  </div>
                  <button onClick={handleClearFilters} className="text-xs font-bold text-[#c5a059] hover:text-[#b08e4d] flex items-center gap-1 transition-all">
                    <RotateCcw size={14} /> Resetar Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Target size={12} /> Instituição
                    </label>
                    <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                      <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-[#002b5c]/10 transition-all">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as bancas</SelectItem>
                        {availableFilters.sources.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={12} /> Ano da Prova
                    </label>
                    <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                      <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-[#002b5c]/10 transition-all">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {availableFilters.years.map((y: any) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Brain size={12} /> Especialidade
                    </label>
                    <Select value={filters.specialty} onValueChange={(v) => handleFilterChange("specialty", v)}>
                      <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-[#002b5c]/10 transition-all">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as áreas</SelectItem>
                        {availableFilters.specialties.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Search size={12} /> Tema Específico
                    </label>
                    <Select value={filters.topic} onValueChange={(v) => handleFilterChange("topic", v)}>
                      <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-[#002b5c]/10 transition-all">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os temas</SelectItem>
                        {availableFilters.topics.map((t: any) => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ListChecks size={12} /> Quantidade
                    </label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={filters.limit} 
                      onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                      className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-[#002b5c]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center pt-8">
                  <Button 
                    onClick={handleStartQuiz} 
                    disabled={loading || totalQuestionsCount === 0}
                    className="w-full md:w-auto min-w-[320px] h-20 bg-gradient-to-r from-[#002b5c] to-[#004a99] dark:from-blue-600 dark:to-blue-700 hover:from-[#001a3a] hover:to-[#002b5c] text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-blue-900/30 transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-4 group"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Preparando...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Zap size={24} className="text-[#c5a059]" />
                        </div>
                        Iniciar Simulado
                        <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </Button>
                  <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                      {countLoading ? "Sincronizando banco..." : `${totalQuestionsCount.toLocaleString()} questões prontas para você`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Features de Destaque */}
          <section className="max-w-7xl mx-auto px-6 py-32">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-50 hover:border-blue-100 transition-all hover:shadow-2xl hover:shadow-blue-900/5">
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-[#002b5c] mb-8 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <h4 className="text-2xl font-black text-[#002b5c] mb-4">Resoluções com IA</h4>
                <p className="text-gray-500 leading-relaxed font-medium">Não fique na dúvida. Nossa inteligência artificial explica cada alternativa detalhadamente para você.</p>
              </div>

              <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-50 hover:border-amber-100 transition-all hover:shadow-2xl hover:shadow-amber-900/5">
                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-[#c5a059] mb-8 group-hover:scale-110 transition-transform">
                  <BarChart3 size={32} />
                </div>
                <h4 className="text-2xl font-black text-[#002b5c] mb-4">Análise de Dados</h4>
                <p className="text-gray-500 leading-relaxed font-medium">Gráficos de desempenho por especialidade para você focar onde realmente precisa melhorar.</p>
              </div>

              <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-50 hover:border-red-100 transition-all hover:shadow-2xl hover:shadow-red-900/5">
                <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-8 group-hover:scale-110 transition-transform">
                  <BookOpen size={32} />
                </div>
                <h4 className="text-2xl font-black text-[#002b5c] mb-4">Caderno de Erros</h4>
                <p className="text-gray-500 leading-relaxed font-medium">Um espaço exclusivo que organiza automaticamente todas as questões que você errou.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-white border-t border-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#002b5c] rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black text-[#002b5c] tracking-tighter">MedQuestões</span>
            </div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">© 2026 Excelência em Preparação Médica</p>
            <div className="flex gap-6">
              <button className="text-xs font-bold text-gray-400 hover:text-[#002b5c]">Termos</button>
              <button className="text-xs font-bold text-gray-400 hover:text-[#002b5c]">Privacidade</button>
              <button className="text-xs font-bold text-gray-400 hover:text-[#002b5c]">Suporte</button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (pageState === "quiz") {
    const currentQuestion = questions[currentIndex];
    const currentStatus = questionStatuses[currentIndex];

    return (
      <div className="min-h-screen bg-[#fcfcfc] py-8">
        <div className="container max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {currentQuestion && (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  initialAnswer={currentStatus?.selectedAnswer}
                />
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-gray-100 dark:border-slate-800">
                <Button 
                  variant="ghost" 
                  onClick={() => setPageState("home")} 
                  className="text-gray-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors"
                >
                  Sair do Simulado
                </Button>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={clearHighlights} 
                    className="rounded-2xl border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-black text-xs px-6 h-12 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <Highlighter size={16} /> Limpar Grifos
                  </Button>
                  <Button 
                    onClick={handleFinishQuiz} 
                    className="bg-gradient-to-r from-[#c5a059] to-[#b08e4d] hover:from-[#b08e4d] hover:to-[#c5a059] text-white font-black rounded-2xl px-10 h-12 shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Finalizar Simulado
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <QuestionNavigation
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                questionStatuses={questionStatuses}
                onNavigate={handleNavigate}
                onToggleMark={handleToggleMark}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
              <ProgressBar
                current={currentIndex + 1}
                total={questions.length}
                correct={stats.correct}
                incorrect={stats.incorrect}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "results") {
    const totalAnswered = stats.correct + stats.incorrect;
    const percentage = totalAnswered > 0 ? (stats.correct / totalAnswered) * 100 : 0;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center space-y-10 border-none shadow-2xl shadow-blue-900/5 rounded-[3rem]">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="text-[#c5a059] w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-[#002b5c]">Simulado Finalizado</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Confira seu desempenho</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-50">
            <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Acertos</p><p className="text-3xl font-black text-green-500">{stats.correct}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Erros</p><p className="text-3xl font-black text-red-400">{stats.incorrect}</p></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Taxa</p><p className="text-3xl font-black text-[#002b5c]">{percentage.toFixed(0)}%</p></div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleRestart} 
              className="h-16 bg-gradient-to-r from-[#002b5c] to-[#004a99] hover:from-[#001a3a] hover:to-[#002b5c] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Novo Simulado
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { setPageState("quiz"); setCurrentIndex(0); }} 
              className="h-14 text-gray-400 dark:text-slate-500 font-black uppercase text-xs tracking-widest hover:text-[#002b5c] dark:hover:text-blue-400 transition-colors"
            >
              Revisar Questões
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
