import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigation } from "@/components/QuestionNavigation";
import { useEffect, useState, useCallback } from "react";
import { Heart, Brain, Stethoscope, Filter, LayoutDashboard, BookOpen, ListChecks, Trophy, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionsApi } from "@/lib/api";
import "@/styles/emed.css";
import { useLocation } from "wouter";
import { LogIn, User, BarChart3, LogOut, Highlighter } from "lucide-react";

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
}

type PageState = "home" | "quiz" | "results";

export default function Home() {
  const [pageState, setPageState] = useState<PageState>("home");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  
  const [filters, setFilters] = useState({ source: "all", year: "all", specialty: "all", topic: "all", limit: "10" });
  const [availableFilters, setAvailableFilters] = useState({ sources: [], years: [], specialties: [], topics: [] });
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Estados para usuário e grifos
const [, setLocation] = useLocation();
const [user, setUser] = useState(() => {
  const saved = localStorage.getItem("medquestoes_user");
  return saved ? JSON.parse(saved) : null;
});
const [highlightsEnabled, setHighlightsEnabled] = useState(true);
const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    fetchFilters();
    fetchQuestions();
  }, []);


// Efeito para a funcionalidade de grifar
useEffect(() => {
  if (!highlightsEnabled) return;

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      if (!range) return;
      
      const selectedNode = range.startContainer.parentNode;
      
      if (selectedNode instanceof HTMLElement && selectedNode.classList.contains('highlighted')) {
        // Desgrifar
        const parent = selectedNode.parentNode;
        if (parent) {
          while (selectedNode.firstChild) {
            parent.insertBefore(selectedNode.firstChild, selectedNode);
          }
          parent.removeChild(selectedNode);
          normalize(parent);
        }
      } else {
        // Grifar
        const span = document.createElement('span');
        span.className = 'highlighted';
        
        try {
          range.surroundContents(span);
        } catch(e) {
          // Fallback para seleções complexas
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      }
      
      selection?.removeAllRanges();
    }
  };

  document.addEventListener('mouseup', handleMouseUp);
  return () => document.removeEventListener('mouseup', handleMouseUp);
}, [highlightsEnabled]);

  // Atalhos de teclado
  useEffect(() => {
    if (pageState !== "quiz") return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "m" || e.key === "M") {
        handleToggleMark(currentIndex);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [pageState, currentIndex, questionStatuses]);

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

  const fetchQuestions = async (currentFilters = filters) => {
  setLoading(true);
  try {
    const params: any = {};
    if (currentFilters.source !== "all") params.source = currentFilters.source;
    if (currentFilters.year !== "all") params.year = currentFilters.year;
    if (currentFilters.specialty !== "all") params.specialty = currentFilters.specialty;
    if (currentFilters.topic !== "all") params.topic = currentFilters.topic;
    params.limit = parseInt(currentFilters.limit) || 10;
    params.page = 1;

    const response = await questionsApi.getQuestions(params);
    
    if (!response) {
      setQuestions([]);
      setTotalQuestionsCount(0);
      return;
    }

    const responseData = response.data || response;

    const questionsList = Array.isArray(responseData.questions) 
      ? responseData.questions 
      : (Array.isArray(responseData) ? responseData : []);
    
    const total = responseData.pagination?.total || 
                  responseData.total || 
                  questionsList.length;
    
    
    setQuestions(questionsList);
    setTotalQuestionsCount(total);
  } catch (error) {
    console.error("Error fetching questions:", error);
    setQuestions([]);
  } finally {
    setLoading(false);
  }
};

  const handleFilterChange = async (key: string, value: string) => {
  const newFilters = { ...filters, [key]: value };
  
  if (key === "specialty") {
    newFilters.topic = "all";
    
    try {
      // CORREÇÃO: Extrair os dados da resposta
      const response = await fetch(`/api/filters/filtered-topics?specialty=${encodeURIComponent(value)}`);
      
      // 1. Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      // 2. Extrai os dados JSON da resposta
      const result = await response.json();
      
      // 3. CORREÇÃO: Usa 'result' em vez de 'data'
      setAvailableFilters(prev => ({
        ...prev,
        topics: result.topics || []
      }));
      
      
    } catch (err) {
      setAvailableFilters(prev => ({
        ...prev,
        topics: []
      }));
    }
  }
  
  setFilters(newFilters);
  await fetchQuestions(newFilters);
};

  const handleStartQuiz = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
   	 const quizFilters = { ...filters };
    	const limit = parseInt(quizFilters.limit) || 10;
        
    	const params: any = {};
   	 if (quizFilters.source !== "all") params.source = quizFilters.source;
    	if (quizFilters.year !== "all") params.year = quizFilters.year;
   	 if (quizFilters.specialty !== "all") params.specialty = quizFilters.specialty;
    	if (quizFilters.topic !== "all") params.topic = quizFilters.topic;
    
    	params.limit = limit;
    	params.page = 1; 
    
  	  const response = await questionsApi.getQuestions(params);
  	  const responseData = response?.data || response;
    
  	  let questionsList = [];
  	  if (Array.isArray(responseData.questions)) {
   		   questionsList = responseData.questions;
  	  } else if (Array.isArray(responseData)) {
   		   questionsList = responseData;
   	 }
    
    const availableQuestions = Math.min(questionsList.length, limit);
    
    if (availableQuestions === 0) {
      alert("Nenhuma questão encontrada com os filtros atuais!");
      setLoading(false);
      return;
    }
    
    const shuffled = [...questionsList].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, availableQuestions);
    
    
    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setStats({ correct: 0, incorrect: 0 });
    setQuestionStatuses(
      selectedQuestions.map(() => ({
        answered: false,
        marked: false,
      }))
    );
    
    setPageState("quiz");
    
  } catch (error) {
    console.error("❌ Erro ao iniciar simulado:", error);
    alert("Erro ao carregar questões para o simulado. Tente novamente.");
  } finally {
    setLoading(false);
  }
};

  const handleAnswer = (selectedAnswer: string, isCorrect: boolean) => {
  // Salvar a resposta se o usuário estiver logado
  if (user) {
    // Obter o tema da questão atual (ajuste conforme sua estrutura)
    const tema = questions[currentIndex]?.specialty || "Geral";
    saveAnswer(isCorrect, selectedAnswer, questions[currentIndex].id, tema);
  }

  // Atualizar estatísticas
  setStats((prev) => ({
    correct: prev.correct + (isCorrect ? 1 : 0),
    incorrect: prev.incorrect + (isCorrect ? 0 : 1),
  }));

  // Atualizar status da questão
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
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length]);

  const handleToggleMark = useCallback((index: number) => {
    setQuestionStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[index] = {
        ...newStatuses[index],
        marked: !newStatuses[index].marked,
      };
      return newStatuses;
    });
  }, []);

  const handleFinishQuiz = () => {
    setPageState("results");
  };

// ======================================
// FUNÇÕES PARA GRIFAR TEXTO
// ======================================

const normalize = (element: any) => {
  element.normalize();
};

const clearHighlights = () => {
  document.querySelectorAll('.highlighted').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      normalize(parent);
    }
  });
};

// ======================================
// FUNÇÕES PARA USUÁRIO E SALVAR RESPOSTAS
// ======================================

const handleLogout = () => {
  setUser(null);
  localStorage.removeItem('medquestoes_user');
  localStorage.removeItem('medquestoes_token');
};

// Função para salvar resposta (chame essa função quando o usuário responder)
const saveAnswer = (isCorrect: boolean, selectedOption: string, questionId: string, tema: string) => {
  if (!user) return;
  
  const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
  
  const answerData = {
    questao_id: questionId,
    opcao_escolhida: selectedOption,
    acertou: isCorrect,
    tempo_resposta: timeSpent,
    tema: tema,
    data_resposta: new Date().toISOString()
  };
  
  // Salvar no localStorage (modo offline)
  const userAnswers = JSON.parse(localStorage.getItem('medquestoes_answers') || '[]');
  userAnswers.push(answerData);
  localStorage.setItem('medquestoes_answers', JSON.stringify(userAnswers));
  
  // Atualizar desempenho por tema
  updatePerformance(tema, isCorrect);
  
  // Reiniciar o timer para a próxima questão
  setQuestionStartTime(Date.now());
};

const updatePerformance = (tema: string, acertou: boolean) => {
  let performance = JSON.parse(localStorage.getItem('medquestoes_performance') || '[]');
  
  let temaIndex = performance.findIndex((p: any) => p.tema === tema);
  
  if (temaIndex === -1) {
    performance.push({
      tema: tema,
      totalQuestoes: 0,
      acertos: 0,
      erros: 0,
      taxaAcerto: 0
    });
    temaIndex = performance.length - 1;
  }
  
  performance[temaIndex].totalQuestoes += 1;
  if (acertou) {
    performance[temaIndex].acertos += 1;
  } else {
    performance[temaIndex].erros += 1;
  }
  
  performance[temaIndex].taxaAcerto = 
    (performance[temaIndex].acertos / performance[temaIndex].totalQuestoes) * 100;
  
  localStorage.setItem('medquestoes_performance', JSON.stringify(performance));
};

  const handleRestart = () => {
    setPageState("home");
    fetchQuestions();
  };

  if (pageState === "home") {
    return (
      <div className="emed-layout">
        {/* Sidebar Inspirada no Estratégia MED */}
        <aside className="emed-sidebar">
          <div className="mb-10 px-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Stethoscope className="text-[#c5a059]" />
              MED <span className="font-light">Questões</span>
            </h1>
          </div>
          
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white font-medium">
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
              <BookOpen size={20} /> Banco de Questões
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
              <ListChecks size={20} /> Meus Cadernos
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
              <Trophy size={20} /> Simulados
            </button>
            <div className="pt-10">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
                <Settings size={20} /> Configurações
              </button>
            </div>
          </nav>
        </aside>

        <main className="emed-main">
  {/* Painel do usuário */}
  {user && (
    <div className="user-info-panel">
      <div className="flex items-center gap-2">
        <User size={16} />
        <span className="text-sm font-medium">Olá, {user.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLocation('/performance')}
          className="user-action-link flex items-center gap-1"
        >
          <BarChart3 size={14} />
          Desempenho
        </button>
        <button
          onClick={handleLogout}
          className="user-action-link text-destructive flex items-center gap-1"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  )}
  
  {!user && (
    <div className="user-info-panel">
      <button
        onClick={() => setLocation('/login')}
        className="user-action-link flex items-center gap-2"
      >
        <LogIn size={16} />
        Entrar / Cadastrar
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
                {totalQuestionsCount} questões encontradas com os filtros atuais
              </div>
            </header>

            {/* Filters Card Estilo Estratégia */}
            <Card className="emed-card overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#002b5c]">
                  <Filter size={18} /> Filtros Avançados
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400" onClick={() =>{ setFilters({ source: "all", year: "all", specialty: "all", topic: "all", limit: "10" });
fetchFilters(); fetchQuestions();;
}}
>
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
                      {(availableFilters.sources || []).map((s: string) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
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
                      {(availableFilters.years || []).map((y: any) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
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
                      {(availableFilters.specialties || []).map((s: string) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
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
                      {(availableFilters.topics || []).map((t: any) => (
                        <SelectItem key={t} value={String(t)}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Qtd. Questões</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max={totalQuestionsCount}
                    value={filters.limit} 
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                    placeholder="Ex: 15"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
              
              <div className="mt-10 flex justify-center">
                <Button 
                  size="lg" 
                  className="emed-button-primary px-20 py-8 text-xl rounded-xl shadow-xl"
                  onClick={handleStartQuiz}
                  disabled={loading || questions.length === 0}
                >
                  {loading ? "Preparando Questões..." : "Gerar Lista de Questões"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="emed-card p-6 flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-[#002b5c]">
                <Brain size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#002b5c]">Questões Comentadas</h4>
                <p className="text-sm text-gray-500">Milhares de questões com explicações detalhadas.</p>
              </div>
            </Card>
            <Card className="emed-card p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-lg text-[#c5a059]">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#002b5c]">Ranking Nacional</h4>
                <p className="text-sm text-gray-500">Compare seu desempenho com outros alunos.</p>
              </div>
            </Card>
            <Card className="emed-card p-6 flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <ListChecks size={24} />
              </div>
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
      <div className="min-h-screen bg-background py-4 md:py-8">
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
                <Button
                  variant="outline"
                  onClick={() => setPageState("home")}
                >
                  Voltar ao Início
                </Button>

<div className="flex gap-2">
    <Button
      variant="outline"
      onClick={clearHighlights}
      className="flex items-center gap-2"
    >
      <Highlighter size={16} />
      Limpar Grifos
    </Button>


                <Button
                  onClick={handleFinishQuiz}
                  className="elegant-button"
                >
                  Finalizar Simulado
                </Button>
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
    const percentage =
      totalAnswered > 0 ? (stats.correct / totalAnswered) * 100 : 0;
    const markedCount = questionStatuses.filter(s => s.marked).length;

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-2xl">
          <Card className="elegant-card p-12 text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Simulado Concluído!</h1>
              <p className="text-muted-foreground">
                Veja seus resultados abaixo
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-8 border-y border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Corretas</p>
                <p className="text-4xl font-bold text-green-600">
                  {stats.correct}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Incorretas</p>
                <p className="text-4xl font-bold text-red-600">
                  {stats.incorrect}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Taxa</p>
                <p className="text-4xl font-bold text-primary">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {markedCount > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-800">
                  📌 Você marcou <strong>{markedCount}</strong> questão(ões) para revisão
                </p>
              </div>
            )}

            <div className="space-y-2">
              {percentage >= 80 && (
                <p className="text-lg font-semibold text-green-600">
                  ✓ Excelente desempenho! Continue assim!
                </p>
              )}
              {percentage >= 60 && percentage < 80 && (
                <p className="text-lg font-semibold text-yellow-600">
                  ⚠ Bom desempenho. Revise os tópicos com dificuldade.
                </p>
              )}
              {percentage < 60 && (
                <p className="text-lg font-semibold text-red-600">
                  ✗ Recomenda-se revisar os conceitos e tentar novamente.
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={handleRestart}
                className="elegant-button"
              >
                Novo Simulado
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setPageState("quiz");
                  setCurrentIndex(0);
                }}
              >
                Revisar Respostas
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
