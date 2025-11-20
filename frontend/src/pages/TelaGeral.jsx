import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { ArrowLeft, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TelaGeral() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros e opções
  const [opcoesFiltros, setOpcoesFiltros] = useState({});
  const [filtros, setFiltros] = useState({
    sigla_loja: "",
    regional: "",
    estado: "",
    mes: "",
    pendencia: ""
  });

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  // 1. Carrega as opções dos dropdowns ao iniciar
  useEffect(() => {
    api.get("/filtros-opcoes")
      .then(res => setOpcoesFiltros(res.data))
      .catch(err => console.error("Erro ao carregar opções:", err));
    
    carregarDados();
  }, []);

  // 2. Carrega dados da tabela
  const carregarDados = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Adiciona apenas filtros preenchidos
      Object.entries(filtros).forEach(([k, v]) => { 
        if (v) params.append(k, v); 
      });

      const resp = await api.get(`/api/geral?${params.toString()}`);
      setDados(resp.data.dados || []);
      setColunas(resp.data.colunas || []);
      setPaginaAtual(1);
    } catch (error) {
      console.error("Erro ao carregar geral:", error);
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({ sigla_loja: "", regional: "", estado: "", mes: "", pendencia: "" });
    window.location.reload(); 
  };

  // Atualiza tabela sempre que mudar um filtro (efeito automático com delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 300); 
    return () => clearTimeout(timer);
  }, [filtros]);

  // Paginação
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const dadosAtuais = dados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Base de Dados Geral</h1>
        </div>
        <div className="text-sm text-slate-400">
          Total: <strong>{dados.length}</strong> registros
        </div>
      </div>

      {/* --- ÁREA DE FILTROS (DROPDOWNS) --- */}
      <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4 text-blue-400">
          <Filter size={18} />
          <span className="font-semibold uppercase text-xs tracking-wide">Filtros Avançados</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Filtro Regional */}
          <select 
            className="bg-slate-900 border border-slate-600 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-blue-500 outline-none"
            value={filtros.regional}
            onChange={e => setFiltros({...filtros, regional: e.target.value})}
          >
            <option value="">Todas Regionais</option>
            {opcoesFiltros.regional?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Filtro Estado */}
          <select 
            className="bg-slate-900 border border-slate-600 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-blue-500 outline-none"
            value={filtros.estado}
            onChange={e => setFiltros({...filtros, estado: e.target.value})}
          >
            <option value="">Todos Estados</option>
            {opcoesFiltros.estado?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Filtro Loja */}
          <select 
            className="bg-slate-900 border border-slate-600 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-blue-500 outline-none"
            value={filtros.sigla_loja}
            onChange={e => setFiltros({...filtros, sigla_loja: e.target.value})}
          >
            <option value="">Todas Lojas</option>
            {opcoesFiltros.sigla_loja?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Filtro Mês */}
          <select 
            className="bg-slate-900 border border-slate-600 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-blue-500 outline-none"
            value={filtros.mes}
            onChange={e => setFiltros({...filtros, mes: e.target.value})}
          >
            <option value="">Todos Meses</option>
            {opcoesFiltros.mes?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Botão Limpar */}
          <button 
            onClick={limparFiltros}
            className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          >
            <X size={16} /> Limpar
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Carregando dados...</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  {colunas.map(col => (
                    <th key={col} className="px-6 py-3 border-b border-slate-700 font-semibold">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosAtuais.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-750 transition-colors">
                    {colunas.map(col => (
                      <td key={`${i}-${col}`} className="px-6 py-4">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
                {dadosAtuais.length === 0 && (
                  <tr><td colSpan={colunas.length || 1} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {!loading && dados.length > 0 && (
          <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-800">
            <span className="text-xs text-slate-400">
              Página <strong className="text-white">{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}