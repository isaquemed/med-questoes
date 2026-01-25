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

  // Efeito para a funcionalidade de grifar
  useEffect(() => {
    if (!highlightsEnabled || pageState !== "quiz") return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0) {
        const range = selection?.getRangeAt(0);
        if (!range) return;
        
        // Verificar se a seleção está dentro do container da questão
        const questionContainer = document.querySelector('.question-content-container');
        if (!questionContainer || !questionContainer.contains(range.commonAncestorContainer)) {
          return;
        }
        
        const selectedNode = range.startContainer.parentNode;
        
        if (selectedNode instanceof HTMLElement && selectedNode.classList.contains('highlighted')) {
          // Desgrifar
          const parent = selectedNode.parentNode;
          if (parent) {
            while (selectedNode.firstChild) {
              parent.insertBefore(selectedNode.firstChild, selectedNode);
            }
            parent.removeChild(selectedNode);
            parent.normalize();
          }
        } else {
          // Grifar
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
        
        // Salvar o estado atual do HTML da questão como grifos
        const currentHighlights = questionContainer.innerHTML;
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
      params.limit = 1; // Só queremos o total
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
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const result = await response.json();
        setAvailableFilters(prev => ({
          ...prev,
          topics: result.topics || []
        }));
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
        alert("Nenhuma questão encontrada com os filtros atuais!");
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
      alert("Erro ao carregar questões. Tente novamente.");
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
      console.error("Erro ao salvar resposta no banco:", error);
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

  const handleFinishQuiz = () => {
    setPageState("results");
  };

  const handleRestart = () => {
    setPageState("home");
    setQuestions([]);
    setCurrentIndex(0);
    setStats({ correct: 0, incorrect: 0 });
    setQuestionStatuses([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("medquestoes_user");
    localStorage.removeItem("medquestoes_token");
    setUser(null);
    setLocation("/");
  };

  const clearHighlights = () => {
    const questionContainer = document.querySelector('.question-content-container');
    if (questionContainer) {
      // Remove all spans with class 'highlighted' but keep their text
      const highlights = questionContainer.querySelectorAll('.highlighted');
      highlights.forEach(h => {
        const parent = h.parentNode;
        if (parent) {
          while (h.firstChild) {
            parent.insertBefore(h.firstChild, h);
          }
          parent.removeChild(h);
          parent.normalize();
        }
      });
      
      setQuestionStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[currentIndex] = {
          ...newStatuses[currentIndex],
          highlights: undefined
        };
        return newStatuses;
      });
    }
  };

  if (pageState === "home") {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#002b5c] rounded-lg flex items-center justify-center text-white">
                <Stethoscope size={24} />
              </div>
              <h1 className="text-2xl font-bold text-[#002b5c]">MedQuestões</h1>
            </div>
            
            <div className="flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-[#002b5c]">{user.nome}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/performance')} className="text-[#002b5c]">
                      <BarChart3 size={18} className="mr-2" /> Desempenho
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/error-notebook')} className="text-[#002b5c]">
                      <BookOpen size={18} className="mr-2" /> Erros
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
                      <LogOut size={18} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setLocation('/login')} className="bg-[#002b5c] hover:bg-[#001a3a]">
                  <LogIn size={18} className="mr-2" /> Entrar / Cadastrar
                </Button>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <h2 className="text-5xl font-extrabold text-[#002b5c] leading-tight">
                Sua aprovação na <span className="text-[#d4af37]">Residência Médica</span> começa aqui.
              </h2>
              <p className="text-xl text-gray-600">
                Plataforma inteligente de questões com resoluções comentadas por IA e análise de desempenho detalhada.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-[#002b5c] px-8 py-6 text-lg" onClick={() => document.getElementById('filtros')?.scrollIntoView({ behavior: 'smooth' })}>
                  Começar Agora
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-[#002b5c]/10 rounded-full blur-3xl"></div>
              <Card className="relative p-8 border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Acerto</p>
                      <p className="text-xl font-bold text-[#002b5c]">84.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <ListChecks size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Questões Respondidas</p>
                      <p className="text-xl font-bold text-[#002b5c]">1,240</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div id="filtros" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-[#002b5c]">Personalize seu Estudo</h3>
                <p className="text-gray-500 text-sm">Filtre por banca, ano, especialidade ou tema</p>
              </div>
              <div className="bg-[#002b5c]/5 px-6 py-3 rounded-2xl border border-[#002b5c]/10 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[#002b5c] font-bold">
                  {countLoading ? "Contando..." : `${totalQuestionsCount.toLocaleString()} questões disponíveis`}
                </span>
              </div>
            </div>

            <Card className="p-6 shadow-xl border-t-4 border-t-[#d4af37]">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[150px] space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banca</label>
                  <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as bancas</SelectItem>
                      {availableFilters.sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[120px] space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano</label>
                  <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {availableFilters.years.map((y) => <SelectItem key={String(y)} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Especialidade</label>
                  <Select value={filters.specialty} onValueChange={(v) => handleFilterChange("specialty", v)}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as áreas</SelectItem>
                      {availableFilters.specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tópico</label>
                  <Select value={filters.topic} onValueChange={(v) => handleFilterChange("topic", v)}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tópicos</SelectItem>
                      {availableFilters.topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd</label>
                  <Input 
                    type="number" 
                    value={filters.limit} 
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                    className="bg-gray-50 border-gray-200 h-11"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-11 w-11 border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50"
                    onClick={handleClearFilters}
                    title="Limpar Filtros"
                  >
                    <RotateCcw size={18} />
                  </Button>
                  <Button 
                    className="bg-[#002b5c] hover:bg-[#001a3a] h-11 px-8 font-bold shadow-lg"
                    onClick={handleStartQuiz}
                    disabled={loading || totalQuestionsCount === 0}
                  >
                    {loading ? "Carregando..." : "Gerar Simulado"}
                  </Button>
                </div>
              </div>
            </Card>
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-[#d4af37]">
                <Button variant="ghost" onClick={() => setPageState("home")} className="text-[#002b5c]">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Sair do Simulado
                </Button>
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={clearHighlights} className="text-[#002b5c] border-[#002b5c]">
                    <Highlighter className="mr-2 w-4 h-4" /> Limpar Grifos
                  </Button>
                  <Button onClick={handleFinishQuiz} className="bg-[#002b5c]">
                    Finalizar
                  </Button>
                </div>
              </div>

              {currentQuestion && (
                <div className="question-content-container">
                  <QuestionCard
                    key={currentQuestion.id}
                    question={{
                      ...currentQuestion,
                      highlights: currentStatus?.highlights
                    }}
                    onAnswer={handleAnswer}
                    initialAnswer={currentStatus?.selectedAnswer}
                  />
                </div>
              )}
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 text-center space-y-8 shadow-2xl border-t-8 border-t-[#002b5c]">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-[#d4af37]/10 text-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={40} />
            </div>
            <h1 className="text-4xl font-bold text-[#002b5c]">Simulado Concluído!</h1>
            <p className="text-gray-500">Confira seu desempenho detalhado</p>
          </div>

          <div className="grid grid-cols-3 gap-6 py-8 border-y border-gray-100">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Acertos</p>
              <p className="text-4xl font-bold text-green-600">{stats.correct}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Erros</p>
              <p className="text-4xl font-bold text-red-600">{stats.incorrect}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Aproveitamento</p>
              <p className="text-4xl font-bold text-[#002b5c]">{percentage.toFixed(1)}%</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} className="bg-[#002b5c] px-8 py-6">
              Novo Simulado
            </Button>
            <Button variant="outline" onClick={() => { setPageState("quiz"); setCurrentIndex(0); }} className="border-[#002b5c] text-[#002b5c] px-8 py-6">
              Revisar Questões
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

function ArrowLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
