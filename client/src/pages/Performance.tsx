import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface PerformanceData {
  tema: string;
  totalQuestoes: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
}

export default function Performance() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('medquestoes_user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setLocation('/login');
      return;
    }

    // Carregar desempenho do localStorage
    const savedPerformance = localStorage.getItem('medquestoes_performance');
    if (savedPerformance) {
      setPerformance(JSON.parse(savedPerformance));
    }
    
    setLoading(false);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('medquestoes_user');
    localStorage.removeItem('medquestoes_token');
    setLocation('/login');
  };

const loadPerformance = async () => {
  const token = localStorage.getItem("medquestoes_token");
  const user = JSON.parse(localStorage.getItem("medquestoes_user") || "null");

  if (!token || !user) {
    setLocation("/login");
    return;
  }

  try {
    const response = await fetch("/api/performance", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();
    setPerformanceData(data);
  } catch (error) {
    console.error("Erro ao carregar desempenho:", error);
    // Fallback para dados locais
    const localPerformance = localStorage.getItem("medquestoes_performance");
    if (localPerformance) {
      setPerformanceData(JSON.parse(localPerformance));
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="performance-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalQuestoes = performance.reduce((sum, item) => sum + item.totalQuestoes, 0);
  const totalAcertos = performance.reduce((sum, item) => sum + item.acertos, 0);
  const taxaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

  return (
    <div className="performance-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Meu Desempenho
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Acompanhe seu progresso nos diferentes temas
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={() => setLocation('/')}>
            Voltar às questões
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
          Olá, <strong>{user.name}</strong>!
        </p>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
          {user.email}
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalQuestoes}</div>
          <div className="stat-label">Total de questões</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{totalAcertos}</div>
          <div className="stat-label">Acertos</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{totalQuestoes - totalAcertos}</div>
          <div className="stat-label">Erros</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{taxaGeral.toFixed(1)}%</div>
          <div className="stat-label">Taxa de acerto</div>
          <div className="theme-progress">
            <div 
              className="theme-progress-bar" 
              style={{ width: `${taxaGeral}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desempenho por Tema */}
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Desempenho por Tema
        </h2>
        
        {performance.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {performance.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '1rem', 
                  background: 'var(--background)', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: '600' }}>{item.tema}</h3>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    {item.taxaAcerto.toFixed(1)}%
                  </span>
                </div>
                
                <div className="theme-progress">
                  <div 
                    className="theme-progress-bar" 
                    style={{ width: `${item.taxaAcerto}%` }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                  <span>Acertos: {item.acertos}/{item.totalQuestoes}</span>
                  <span>Erros: {item.erros}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Nenhum dado de desempenho disponível ainda.
            </p>
            <Button variant="outline" onClick={() => setLocation('/')}>
              Começar a responder questões
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}