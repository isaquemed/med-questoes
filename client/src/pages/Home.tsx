import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { useEffect, useState, useCallback } from "react";
import { Heart, Brain, Stethoscope, Filter, LayoutDashboard, BookOpen, ListChecks, Trophy, Settings, RotateCcw, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionsApi } from "@/lib/api";
import "@/styles/emed.css";
import { useLocation } from "wouter";
import { LogIn, User, BarChart3, LogOut, Highlighter } from "lucide-react";
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
          setAvailableFilters(prev => ({
            ...prev,
            topics: result.topics || []
          }));
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
        questionId,
        selectedAnswer,
        isCorrect,
        tempoResposta,
        tema,
        highlights
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
        <main className="container py-10">
          {user ? (
            <div className="user-info-panel mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c5a059] flex items-center justify-center text-white font-bold">
                  {(user.nome || user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bem-vindo(a),</p>
                  <p className="font-bold text-[#002b5c]">{user.nome || user.name}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setLocation('/performance')} className="user-action-link flex items-center gap-1">
                  <BarChart3 size={14} /> Desempenho
                </button>
                <button onClick={() => setLocation('/error-notebook')} className="user-action-link flex items-center gap-1">
                  <BookOpen size={14} /> Erros
                </button>
                <button onClick={handleLogout} className="user-action-link text-destructive flex items-center gap-1">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="user-info-panel mb-8">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Acesse sua conta para salvar seu progresso</span>
              </div>
              <button onClick={() => setLocation('/login')} className="user-action-link flex items-center gap-1 font-bold text-[#002b5c]">
                <LogIn size={14} /> Entrar / Cadastrar
              </button>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-[#002b5c]">Banco de Questões</h2>
                <p className="text-gray-500">Crie sua lista personalizada de estudos</p>
              </div>
              <div className="text-sm text-gray-400">
                {countLoading ? "Contando..." : `${totalQuestionsCount} questões encontradas`}
              </div>
            </header>

            <Card className="emed-card overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#002b5c]">
                  <Filter size={18} /> Filtros Avançados
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
              <div className="p-8 bg-white">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Banca</label>
                    <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Todas as bancas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as bancas</SelectItem>
                        {availableFilters.sources.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Ano</label>
                    <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Todos os anos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {availableFilters.years.map((y: any) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Área / Especialidade</label>
                    <Select value={filters.specialty} onValueChange={(v) => handleFilterChange("specialty", v)}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Todas as áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as áreas</SelectItem>
                        {availableFilters.specialties.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Tema Específico</label>
                    <Select value={filters.topic} onValueChange={(v) => handleFilterChange("topic", v)}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Todos os temas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os temas</SelectItem>
                        {availableFilters.topics.map((t: any) => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Qtd. Questões</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={filters.limit} 
                      onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
                <div className="mt-10 flex justify-center">
                  <Button 
                    size="lg" 
                    className="emed-button-primary px-20 py-8 text-xl rounded-xl shadow-xl"
                    onClick={handleStartQuiz}
                    disabled={loading}
                  >
                    {loading ? "Preparando..." : "Gerar Lista de Questões"}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="emed-card p-6 flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-[#002b5c]"><Brain size={24} /></div>
                <div>
                  <h4 className="font-bold text-[#002b5c]">Questões Comentadas</h4>
                  <p className="text-sm text-gray-500">Milhares de questões com explicações detalhadas.</p>
                </div>
              </Card>
              <Card className="emed-card p-6 flex items-start gap-4">
                <div className="p-3 bg-amber-50 rounded-lg text-[#c5a059]"><Trophy size={24} /></div>
                <div>
                  <h4 className="font-bold text-[#002b5c]">Ranking Nacional</h4>
                  <p className="text-sm text-gray-500">Compare seu desempenho com outros alunos.</p>
                </div>
              </Card>
              <Card className="emed-card p-6 flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-green-600"><ListChecks size={24} /></div>
                <div>
                  <h4 className="font-bold text-[#002b5c]">Simulados Inéditos</h4>
                  <p className="text-sm text-gray-500">Provas criadas por nossos especialistas.</p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (pageState === "quiz") {
    const currentQuestion = questions[currentIndex];
    const currentStatus = questionStatuses[currentIndex];

    return (
      <div className="min-h-screen bg-[#f8fafc] py-8">
        <div className="container max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {currentQuestion && (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  initialAnswer={currentStatus?.selectedAnswer}
                />
              )}
              <div className="flex gap-4 justify-between">
                <Button variant="outline" onClick={() => setPageState("home")}>Voltar ao Início</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearHighlights} className="flex items-center gap-2">
                    <Highlighter size={16} /> Limpar Grifos
                  </Button>
                  <Button onClick={handleFinishQuiz} className="elegant-button">Finalizar Simulado</Button>
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
      <div className="min-h-screen bg-[#f8fafc] py-8">
        <div className="container max-w-2xl">
          <Card className="elegant-card p-12 text-center space-y-8">
            <h1 className="text-4xl font-bold text-[#002b5c]">Simulado Concluído!</h1>
            <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-100">
              <div><p className="text-sm text-gray-500 mb-2">Corretas</p><p className="text-4xl font-bold text-green-600">{stats.correct}</p></div>
              <div><p className="text-sm text-gray-500 mb-2">Incorretas</p><p className="text-4xl font-bold text-red-600">{stats.incorrect}</p></div>
              <div><p className="text-sm text-gray-500 mb-2">Taxa</p><p className="text-4xl font-bold text-[#002b5c]">{percentage.toFixed(1)}%</p></div>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={handleRestart} className="elegant-button">Novo Simulado</Button>
              <Button variant="outline" onClick={() => { setPageState("quiz"); setCurrentIndex(0); }}>Revisar Respostas</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
