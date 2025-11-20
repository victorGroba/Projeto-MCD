import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TelaGeral() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ loja: "", regional: "", mes: "" });

  // --- PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20; // Mostra 20 itens por vez

  const carregar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });

      const resp = await api.get(`/api/geral?${params.toString()}`);
      setDados(resp.data.dados || []);
      setColunas(resp.data.colunas || []);
      setPaginaAtual(1); // Reseta para primeira página ao filtrar
    } catch (error) {
      console.error("Erro ao carregar geral:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // Lógica de fatiar os dados para a página atual
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const dadosAtuais = dados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      
      {/* Topo */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/home")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Base de Dados Geral</h1>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Total de Registros</p>
          <p className="text-3xl font-bold text-white">{dados.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Lojas Únicas</p>
          <p className="text-3xl font-bold text-blue-400">
            {new Set(dados.map(d => d.sigla_loja)).size}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Regionais</p>
          <p className="text-3xl font-bold text-purple-400">
            {new Set(dados.map(d => d.regional)).size}
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-800 p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end border border-slate-700">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Loja</label>
          <input 
            className="bg-slate-900 border border-slate-600 rounded p-2 text-sm w-32 focus:border-blue-500 outline-none"
            value={filtros.loja} onChange={e => setFiltros({...filtros, loja: e.target.value})}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Regional</label>
          <input 
            className="bg-slate-900 border border-slate-600 rounded p-2 text-sm w-32 focus:border-blue-500 outline-none"
            value={filtros.regional} onChange={e => setFiltros({...filtros, regional: e.target.value})}
          />
        </div>
        <button 
          onClick={carregar}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Search size={16} /> Filtrar
        </button>
      </div>

      {/* Tabela com Scroll Horizontal e Paginação */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Carregando dados...</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  {/* Mapeia TODAS as colunas agora, sem slice */}
                  {colunas.map(col => (
                    <th key={col} className="px-6 py-3 border-b border-slate-700">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosAtuais.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-750">
                    {colunas.map(col => (
                      <td key={`${i}-${col}`} className="px-6 py-4">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
                {dadosAtuais.length === 0 && (
                  <tr>
                    <td colSpan={colunas.length} className="p-6 text-center">Nenhum dado encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Controles de Paginação */}
        {!loading && dados.length > 0 && (
          <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-800 rounded-b-xl">
            <span className="text-sm text-slate-400">
              Página <strong className="text-white">{paginaAtual}</strong> de <strong>{totalPaginas}</strong> 
              <span className="mx-2">|</span> 
              Total: {dados.length} registros
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => mudarPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
                className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => mudarPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
                className="p-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}