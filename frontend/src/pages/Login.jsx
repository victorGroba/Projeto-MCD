import React, { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message || "Credenciais inválidas.");
      return;
    }
    navigate("/home"); 
  }

  return (
    <div className="min-h-screen w-full flex text-slate-300 bg-[#0B0F19] selection:bg-blue-500 selection:text-white">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative z-10">
        
        {/* Container principal do formulário */}
        <div className="w-full max-w-md animate-fade-in-up">
          
          {/* Cabeçalho / Logo */}
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6 shadow-xl backdrop-blur-sm inline-block">
              <img 
                src="/images/logo_mattos.png" 
                alt="Mattos" 
                className="h-16 object-contain"
                onError={(e) => {
                  e.target.style.display='none'; 
                  e.target.parentElement.innerHTML='<div class="text-white font-bold text-2xl px-4">MATTOS</div>';
                }}
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Portal de Controle</h1>
            <p className="text-slate-400 mt-2">Acesse o painel de indicadores e segurança alimentar.</p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-bold text-sm">!</span>
              </div>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-[#131825] p-8 rounded-2xl border border-white/5 shadow-2xl">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                E-mail ou Usuário
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="Seu usuário"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Senha
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Autenticando...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Entrar no Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer do formulário */}
          <div className="mt-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <p>Acesso restrito a colaboradores e clientes autorizados.</p>
            <p>© {new Date().getFullYear()} Mattos. Todos os direitos reservados.</p>
          </div>

        </div>
      </div>

      {/* LADO DIREITO: IMAGEM DE FUNDO */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
        {/* Overlay Escuro/Gradiente para dar mais elegância */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#0B0F19]/40 to-[#0B0F19]/80 z-10"></div>
        
        <img 
          src="/images/background-login.png" 
          alt="Dashboard Background" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        
        {/* Opcional: Algum texto corporativo ou slogan no canto inferior da imagem */}
        <div className="absolute bottom-12 left-12 right-12 z-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3">Inteligência em Qualidade</h2>
            <p className="text-blue-200 text-lg">
              Monitoramento contínuo de Potabilidade da Água, Segurança Alimentar e Controle de Pragas.
            </p>
          </div>
        </div>
      </div>

      {/* STYLES (Animacoes inline) */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .animate-fade-in-up { animation: fadeInUp 0.7s ease-out backwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

    </div>
  );
}