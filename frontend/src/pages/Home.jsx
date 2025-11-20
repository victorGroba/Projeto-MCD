import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Table, LogOut } from "lucide-react";
import { useAuth } from "../store/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">QualiView</h1>
          <p className="text-slate-400">Bem-vindo, {user?.username || "Usuário"}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
        >
          <LogOut size={20} /> Sair
        </button>
      </header>

      {/* Grid de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Card Visão Geral */}
        <div 
          onClick={() => navigate("/geral")}
          className="bg-slate-800 p-8 rounded-2xl border border-slate-700 cursor-pointer hover:bg-slate-750 hover:border-blue-500 hover:scale-105 transition-all group"
        >
          <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
            <Table size={32} className="text-blue-400 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Visão Geral</h2>
          <p className="text-slate-400">
            Acesse a tabela completa de dados, aplique filtros por loja, regional e visualize os KPIs detalhados.
          </p>
        </div>

        {/* Card Gráficos */}
        <div 
          onClick={() => navigate("/graficos-novo")}
          className="bg-slate-800 p-8 rounded-2xl border border-slate-700 cursor-pointer hover:bg-slate-750 hover:border-purple-500 hover:scale-105 transition-all group"
        >
          <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
            <BarChart3 size={32} className="text-purple-400 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Gráficos e Indicadores</h2>
          <p className="text-slate-400">
            Visualize dashboards estratégicos sobre pendências anuais, performance por regional, Backroom e Gelo.
          </p>
        </div>

      </div>
    </div>
  );
}