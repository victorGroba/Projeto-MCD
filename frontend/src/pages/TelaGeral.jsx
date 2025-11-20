import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { ArrowLeft, Filter, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TelaGeral() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Opções para os dropdowns
  const [opcoesFiltros, setOpcoesFiltros] = useState({});
  
  // Nomes reais das colunas no Excel (recebidos do backend)
  const [nomesColunas, setNomesColunas] = useState({});

  // Estado dos filtros selecionados (valores)
  const [filtros, setFiltros] = useState({
    regional: "",
    estado: "",
    sigla_loja: "",
    mes: "",
    consultor: "",
    gm: "",
    tipo_restaurante: "",
    pendencia: "",
    reincidencia: ""
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  // 1. Inicialização: Carrega opções e dados
  useEffect(() => {
    async function init() {
      try {
        // Busca as opções e descobre os nomes reais das colunas
        const resOpcoes = await api.get("/api/filtros-opcoes");
        setOpcoesFiltros(resOpcoes.data);
        
        // Salva os nomes reais das colunas para usar na filtragem
        // Ex: filtro 'sigla_loja' vai filtrar na coluna 'sigla' se for isso que veio do excel
        setNomesColunas({
          regional: resOpcoes.data.regional_col_name || "regional",
          estado: resOpcoes.data.estado_col_name || "estado",
          sigla_loja: resOpcoes.data.sigla_loja_col_name || "sigla_loja",
          mes: resOpcoes.data.mes_col_name || "mes",
          consultor: resOpcoes.data.consultor_col_name || "consultor",
          gm: resOpcoes.data.gm_col_name || "gm",
          tipo_restaurante: resOpcoes.data.tipo_restaurante_col_name || "tipo_restaurante",
          pendencia: resOpcoes.data.pendencia_col_name || "pendencia",
          reincidencia: resOpcoes.data.reincidencia_col_name || "reincidencia",
        });

      } catch (err) {
        console.error("Erro ao iniciar:", err);
      }
    }
    init();
  }, []);

  // Carrega dados sempre que os nomes das colunas estiverem prontos ou filtros mudarem
  useEffect(() => {
    if (Object.keys(nomesColunas).length > 0) {
      carregarDados();
    }
  }, [filtros, nomesColunas]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Mapeia o filtro genérico para o nome real da coluna no Excel
      Object.entries(filtros).forEach(([key, valor]) => { 
        if (valor && nomesColunas[key]) {
          params.append(nomesColunas[key], valor); 
        }
      });

      const resp = await api.get(`/api/geral?${params.toString()}`);
      setDados(resp.data.dados || []);
      setColunas(resp.data.colunas || []);
      setPaginaAtual(1);
    } catch (error) {
      console.error("Erro ao carregar tabela:", error);
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      regional: "", estado: "", sigla_loja: "", mes: "",
      consultor: "", gm: "", tipo_restaurante: "",
      pendencia: "", reincidencia: ""
    });
  };

  // Componente de Select Reutilizável
  const renderSelect = (label, key, options) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-bold uppercase">{label}</label>
      <select 
        className="bg-slate-900 border border-slate-600 text-sm rounded-lg p-2 focus:border-blue-500 outline-none text-slate-200 w-full"
        value={filtros[key]}
        onChange={e => setFiltros({...filtros, [key]: e.target.value})}
        disabled={!options || options.length === 0}
      >
        <option value="">Todos</option>
        {options && options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  // Paginação do Front
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const dadosAtuais = dados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Base de Dados Geral</h1>
            <p className="text-xs text-slate-400">Visualize e filtre todos os dados da planilha mestre</p>
          </div>
        </div>
        <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-sm border border-blue-500/30">
          Total: <strong>{dados.length}</strong> registros
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800 p-5 rounded-xl mb-6 border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Filter size={18} />
            <span className="font-semibold uppercase text-sm tracking-wide">Filtros Disponíveis</span>
          </div>
          <button onClick={limparFiltros} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition">
            <X size={14} /> Limpar
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {renderSelect("Regional", "regional", opcoesFiltros.regional)}
          {renderSelect("Estado", "estado", opcoesFiltros.estado)}
          {renderSelect("Loja", "sigla_loja", opcoesFiltros.sigla_loja)}
          {renderSelect("Mês", "mes", opcoesFiltros.mes)}
          {renderSelect("Tipo Rest.", "tipo_restaurante", opcoesFiltros.tipo_restaurante)}
          
          {renderSelect("Consultor", "consultor", opcoesFiltros.consultor)}
          {renderSelect("Gerente (GM)", "gm", opcoesFiltros.gm)}
          {renderSelect("Pendência", "pendencia", opcoesFiltros.pendencia)}
          {renderSelect("Reincidência", "reincidencia", opcoesFiltros.reincidencia)}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
              Carregando dados...
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 sticky top-0 z-10">
                <tr>
                  {colunas.map(col => (
                    <th key={col} className="px-6 py-4 border-b border-slate-700 font-bold tracking-wider min-w-[150px]">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {dadosAtuais.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                    {colunas.map(col => (
                      <td key={`${i}-${col}`} className="px-6 py-3 border-b border-slate-700/30">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
                {dadosAtuais.length === 0 && (
                  <tr>
                    <td colSpan={colunas.length || 1} className="p-12 text-center text-slate-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
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