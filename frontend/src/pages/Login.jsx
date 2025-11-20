import { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import logo from '../assets/logo.png'

export default function Login() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await login(username, password);

    if (!res.success) {
      setError(res.message);
      return;
    }

    // --- CORREÇÃO AQUI: Redireciona para o novo Hub ---
    navigate("/home"); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">

      {/* GRID PATTERN ANIMADO */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)] bg-[size:40px_40px] animate-gridMove"></div>
      </div>

      {/* GRADIENTES RADIAIS MÚLTIPLOS */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] animate-floatSlow"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] animate-floatSlower"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[130px] animate-pulse"></div>

      {/* PARTÍCULAS FLUTUANTES MELHORADAS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 6 + 2;
          const isLarge = size > 5;
          return (
            <div
              key={i}
              className="absolute rounded-full animate-particleFloat"
              style={{
                width: size + "px",
                height: size + "px",
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 10 + "s",
                animationDuration: Math.random() * 20 + 15 + "s",
                background: isLarge
                  ? 'radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(34, 211, 238, 0.6))'
                  : 'radial-gradient(circle, rgba(147, 197, 253, 0.4), rgba(167, 139, 250, 0.4))',
                boxShadow: isLarge ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
              }}
            ></div>
          );
        })}
      </div>

      {/* LINHAS DECORATIVAS ANIMADAS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-lineSlide"></div>
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-lineSlideReverse"></div>
      </div>

      {/* CONTAINER PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md mx-4">

        {/* CARD DE LOGIN */}
        <div className="bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 animate-slideUp relative overflow-hidden">

          {/* BRILHO INTERNO DO CARD */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

          {/* LOGO/ÍCONE */}
          <div className="flex justify-center mb-6 relative">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200/50 animate-iconFloat relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <img
                src={logo}
                alt="QualiView"
                className="w-full h-full object-contain p-2 relative z-10"
              />
            </div>
          </div>

          {/* TÍTULO */}
          <div className="text-center mb-8 relative">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-slate-400 text-sm">
              Faça login para continuar
            </p>
          </div>

          {/* MENSAGEM DE ERRO */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-shake backdrop-blur-sm">
              <p className="text-red-400 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}

          {/* FORMULÁRIO */}
          <div className="space-y-5 relative">

            {/* CAMPO USUÁRIO */}
            <div className="relative">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Usuário
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-400" />
                <input
                  type="text"
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-950/50 text-white border rounded-xl 
                    focus:outline-none focus:ring-2 placeholder-slate-500 transition-all duration-300
                    ${focusedField === 'username'
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700/50 hover:border-slate-600'}`}
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* CAMPO SENHA */}
            <div className="relative">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-950/50 text-white border rounded-xl 
                    focus:outline-none focus:ring-2 placeholder-slate-500 transition-all duration-300
                    ${focusedField === 'password'
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700/50 hover:border-slate-600'}`}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* BOTÃO DE LOGIN */}
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="group w-full mt-6 p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500
                text-white rounded-xl font-semibold shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60
                transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:translate-y-0 flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                </>
              )}
            </button>
          </div>

          {/* LINKS ADICIONAIS */}
          <div className="mt-6 text-center relative">
            <button className="text-slate-400 text-sm hover:text-blue-400 transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            © GROBATECH 2025 - Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ANIMAÇÕES PERSONALIZADAS */}
      <style>{`
        @keyframes particleFloat {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.4; 
          }
          25% { 
            transform: translate(30px, -50px) scale(1.2); 
            opacity: 0.8; 
          }
          50% { 
            transform: translate(-20px, -100px) scale(0.9); 
            opacity: 1; 
          }
          75% { 
            transform: translate(40px, -70px) scale(1.1); 
            opacity: 0.6; 
          }
        }

        @keyframes floatSlow {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
          }
          50% { 
            transform: translate(50px, 30px) scale(1.1); 
          }
        }

        @keyframes floatSlower {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
          }
          50% { 
            transform: translate(-40px, -50px) scale(1.15); 
          }
        }

        @keyframes gridMove {
          0% { 
            background-position: 0 0; 
          }
          100% { 
            background-position: 40px 40px; 
          }
        }

        @keyframes lineSlide {
          0% { 
            transform: translateX(-100%); 
            opacity: 0; 
          }
          50% { 
            opacity: 1; 
          }
          100% { 
            transform: translateX(100%); 
            opacity: 0; 
          }
        }

        @keyframes lineSlideReverse {
          0% { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          50% { 
            opacity: 1; 
          }
          100% { 
            transform: translateX(-100%); 
            opacity: 0; 
          }
        }

        @keyframes slideUp {
          0% { 
            opacity: 0; 
            transform: translateY(40px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes iconFloat {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-10px) rotate(5deg); 
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        .animate-particleFloat {
          animation: particleFloat ease-in-out infinite;
        }

        .animate-floatSlow {
          animation: floatSlow 20s ease-in-out infinite;
        }

        .animate-floatSlower {
          animation: floatSlower 25s ease-in-out infinite;
        }

        .animate-gridMove {
          animation: gridMove 20s linear infinite;
        }

        .animate-lineSlide {
          animation: lineSlide 8s ease-in-out infinite;
        }

        .animate-lineSlideReverse {
          animation: lineSlideReverse 10s ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }

        .animate-iconFloat {
          animation: iconFloat 3s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}