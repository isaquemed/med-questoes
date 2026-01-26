import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stethoscope, ArrowLeft } from 'lucide-react';

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
    const usuario = formData.get("usuario") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha: password }),
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
    const usuario = formData.get("usuario") as string;
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
        body: JSON.stringify({ nome: name, usuario, senha: password }),
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
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-12 h-12 bg-[#002b5c] rounded-xl flex items-center justify-center text-white shadow-lg">
          <Stethoscope size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[#002b5c]">MedQuestões</h1>
      </div>

      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'login' ? 'text-[#002b5c] border-b-2 border-[#002b5c] bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('login')}
          >
            LOGIN
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'register' ? 'text-[#002b5c] border-b-2 border-[#002b5c] bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('register')}
          >
            CADASTRO
          </button>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <span className="font-bold">Erro:</span> {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <span className="font-bold">Sucesso:</span> {success}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Usuário</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="text"
                  name="usuario"
                  placeholder="Seu nome de usuário"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full emed-button-primary py-6 text-lg mt-4"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="text"
                  name="name"
                  placeholder="Como quer ser chamado?"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Usuário</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="text"
                  name="usuario"
                  placeholder="Escolha um nome de usuário"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Senha</label>
                <input
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002b5c] transition-all"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repita sua senha"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full emed-button-primary py-6 text-lg mt-4"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Criar Minha Conta'}
              </Button>
            </form>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => setLocation('/')}
              className="text-sm font-bold text-gray-400 hover:text-[#002b5c] transition-colors flex items-center justify-center gap-2 mx-auto"
              disabled={isLoading}
            >
              <ArrowLeft size={16} /> Voltar para as questões
            </button>
          </div>
        </div>
      </Card>
      
      <p className="mt-8 text-gray-400 text-xs">
        &copy; 2026 MedQuestões - Todos os direitos reservados.
      </p>
    </div>
  );
}
