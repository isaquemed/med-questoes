import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  setSuccess("");

  const formData = new FormData(e.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao fazer login");
    }

    localStorage.setItem("medquestoes_user", JSON.stringify(data.user));
    localStorage.setItem("medquestoes_token", data.token);

    setSuccess("Login realizado com sucesso!");
    setTimeout(() => {
      setLocation("/");
    }, 1500);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  setSuccess("");

  const formData = new FormData(e.currentTarget);
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    setError("As senhas não coincidem");
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: name, email, senha: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao cadastrar");
    }

    localStorage.setItem("medquestoes_user", JSON.stringify(data.user));
    localStorage.setItem("medquestoes_token", data.token);

    setSuccess("Cadastro realizado com sucesso!");
    setTimeout(() => {
      setLocation("/");
    }, 1500);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </div>
          <div 
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Cadastro
          </div>
        </div>
        
        <div className="auth-form">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="E-mail"
                required
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Senha"
                required
                disabled={isLoading}
              />
              <button
                className="auth-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input
                className="auth-input"
                type="text"
                name="name"
                placeholder="Nome completo"
                required
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="E-mail"
                required
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Senha (mínimo 6 caracteres)"
                required
                minLength={6}
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="password"
                name="confirmPassword"
                placeholder="Confirmar senha"
                required
                disabled={isLoading}
              />
              <button
                className="auth-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              disabled={isLoading}
            >
              ← Voltar às questões
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}