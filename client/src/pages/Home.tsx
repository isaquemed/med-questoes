import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { useEffect, useState, useCallback } from "react";
import { Brain, Filter, BookOpen, Trophy, LogIn, User, BarChart3, LogOut, Highlighter, Search, ChevronRight } from "lucide-react";
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

  // Lógica de Grifar Texto Corrigida
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
          try {
            range.surroundContents(span);
          } catch(e) {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        }
        
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
      <div className="min-h-screen bg-white">
        {/* Header Minimalista */}
        <nav className="border-b border-gray-50 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#002b5c] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">MQ</span>
            </div>
            <h1 className="text-xl font-bold text-[#002b5c] tracking-tight">MedQuestões</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setLocation('/performance')} className="text-sm font-medium text-gray-500 hover:text-[#002b5c] transition-colors">Desempenho</button>
                <button onClick={() => setLocation('/error-notebook')} className="text-sm font-medium text-gray-500 hover:text-[#002b5c] transition-colors">Caderno de Erros</button>
                <div className="h-4 w-[1px] bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#002b5c]">{user.nome || user.name}</span>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setLocation('/login')} className="text-[#002b5c] font-bold flex items-center gap-2">
                <LogIn size={18} /> Entrar
              </Button>
            )}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h2 className="text-5xl font-extrabold text-[#002b5c] tracking-tight leading-tight">
              Sua aprovação começa <br /> com a <span className="text-[#c5a059]">questão certa.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
              Prepare-se para a residência médica com um banco de questões otimizado e focado no que realmente cai.
            </p>
          </section>

          {/* Filtros Minimalistas */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Configurar Simulado</h3>
              <button onClick={handleClearFilters} className="text-xs font-bold text-[#c5a059] hover:underline">Resetar Filtros</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Banca</label>
                <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                  <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-0 focus:border-[#002b5c]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as bancas</SelectItem>
                    {availableFilters.sources.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ano</label>
                <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                  <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-0 focus:border-[#002b5c]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {availableFilters.years.map((y: any) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Especialidade</label>
                <Select value={filters.specialty} onValueChange={(v) => handleFilterChange("specialty", v)}>
                  <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-0 focus:border-[#002b5c]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {availableFilters.specialties.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Questões</label>
                <Input 
                  type="number" 
                  min="1" 
                  value={filters.limit} 
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                  className="h-12 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-0 focus:border-[#002b5c]"
                />
              </div>
            </div>

            <div className="flex flex-col items-center pt-6">
              <Button 
                size="lg" 
                className="h-16 px-12 bg-[#002b5c] hover:bg-[#001a3a] text-white font-bold rounded-2xl shadow-xl shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleStartQuiz}
                disabled={loading}
              >
                {loading ? "Carregando..." : "Iniciar Simulado"}
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="mt-4 text-xs text-gray-400 font-medium">
                {countLoading ? "Sincronizando..." : `${totalQuestionsCount} questões disponíveis para estes filtros`}
              </p>
            </div>
          </section>

          {/* Features Minimalistas */}
          <section className="grid md:grid-cols-3 gap-12 pt-10">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002b5c]">
                <Brain size={24} />
              </div>
              <h4 className="font-bold text-[#002b5c] text-lg">IA Integrada</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Resoluções comentadas geradas por inteligência artificial para cada questão.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-[#c5a059]">
                <Trophy size={24} />
              </div>
              <h4 className="font-bold text-[#002b5c] text-lg">Foco em Resultados</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Acompanhe seu desempenho por especialidade e identifique seus pontos fracos.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600">
                <BookOpen size={24} />
              </div>
              <h4 className="font-bold text-[#002b5c] text-lg">Caderno de Erros</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Revise automaticamente todas as questões que você errou para nunca mais esquecer.</p>
            </div>
          </section>
        </main>

        <footer className="py-10 border-t border-gray-50 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 MedQuestões • Excelência em Medicina</p>
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
              <div className="flex gap-4 justify-between items-center pt-4">
                <Button variant="ghost" onClick={() => setPageState("home")} className="text-gray-400 font-bold">Sair do Simulado</Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={clearHighlights} className="rounded-xl border-gray-200 text-gray-500 flex items-center gap-2">
                    <Highlighter size={16} /> Limpar Grifos
                  </Button>
                  <Button onClick={handleFinishQuiz} className="bg-[#c5a059] hover:bg-[#b08e4d] text-white font-bold rounded-xl px-8">Finalizar</Button>
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
        <Card className="max-w-md w-full p-12 text-center space-y-10 border-none shadow-2xl shadow-blue-900/5 rounded-3xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#002b5c]">Simulado Finalizado</h1>
            <p className="text-gray-400 font-medium">Confira seu desempenho geral</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-50">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Acertos</p><p className="text-3xl font-bold text-green-500">{stats.correct}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Erros</p><p className="text-3xl font-bold text-red-400">{stats.incorrect}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Taxa</p><p className="text-3xl font-bold text-[#002b5c]">{percentage.toFixed(0)}%</p></div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleRestart} className="h-14 bg-[#002b5c] hover:bg-[#001a3a] text-white font-bold rounded-2xl">Novo Simulado</Button>
            <Button variant="ghost" onClick={() => { setPageState("quiz"); setCurrentIndex(0); }} className="text-gray-400 font-bold">Revisar Questões</Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
