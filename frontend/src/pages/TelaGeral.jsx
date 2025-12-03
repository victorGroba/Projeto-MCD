import React, { useEffect, useState, useRef } from "react";
import { api } from "../api/api";
import { ArrowLeft, Filter, Table, X, RefreshCw, Check, ChevronDown, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- COMPONENTE MULTI-SELECT (Versão Azul Padrão) ---
function MultiSelect({ label, options, selectedValues = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const current = selectedValues || [];
    let updated;
    if (current.includes(value)) {
      updated = current.filter((item) => item !== value);
    } else {
      updated = [...current, value];
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      <label className="text-[10px] text-slate-500 font-bold uppercase truncate" title={label}>
        {label.replace(/_/g, " ")}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between bg-slate-950 border text-xs rounded-lg p-2.5 text-left transition-colors w-full
          ${selectedValues.length > 0 ? 'border-blue-500 ring-1 ring-blue-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}
        `}
      >
        <span className="truncate">
          {selectedValues.length === 0 ? "Todos" : `${selectedValues.length} selecionados`}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-1">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt);
            return (
              <div 
                key={opt} 
                onClick={() => toggleOption(opt)}
                className={`
                  flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-xs transition-colors
                  ${isSelected ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-800'}
                `}
              >
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}
                `}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- TELA POTABILIDADE (ANTIGA GERAL) ---
export default function TelaGeral() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  
  const [opcoesFiltro, setOpcoesFiltro] = useState({});
  const [nomesColunas, setNomesColunas] = useState({});
  
  const [filtrosAtivos, setFiltrosAtivos] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Inicialização
  useEffect(() => {
    async function carregarOpcoes() {
      try {
        const res = await api.get("/api/filtros-opcoes");
        
        const opcoes = {};
        const nomes = {};
        
        Object.keys(res.data).forEach(key => {
          if (key.endsWith("_col_name")) {
            const nomeFiltro = key.replace("_col_name", "");
            nomes[nomeFiltro] = res.data[key];
          } else {
            opcoes[key] = res.data[key];
          }
        });

        setOpcoesFiltro(opcoes);
        setNomesColunas(nomes);
        fetchDados({}, nomes); 
      } catch (err) {
        console.error("Erro ao iniciar Geral:", err);
        setLoading(false);
      }
    }
    carregarOpcoes();
  }, []);

  // 2. Busca Dados
  const fetchDados = async (filtros = {}, mapNomes = nomesColunas) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filtros).forEach(([key, val]) => {
        const colunaReal = mapNomes[key] || key;
        
        if (Array.isArray(val) && val.length > 0) {
          params.append(colunaReal, val.join(","));
        } else if (val && !Array.isArray(val)) {
          params.append(colunaReal, val);
        }
      });

      const res = await api.get(`/api/geral?${params.toString()}`);
      setDados(res.data.dados || []);
      setColunas(res.data.colunas || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (chaveFiltro, novosValores) => {
    const novoEstado = { ...filtrosAtivos };
    if (novosValores.length === 0) {
      delete novoEstado[chaveFiltro];
    } else {
      novoEstado[chaveFiltro] = novosValores;
    }
    setFiltrosAtivos(novoEstado);
    fetchDados(novoEstado);
  };

  const limparFiltros = () => {
    setFiltrosAtivos({});
    fetchDados({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-800 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Table className="text-blue-500" />
              Controle de Potabilidade
            </h1>
            <p className="text-slate-400 text-sm">Base de dados geral</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÃO PARA VER GRÁFICOS */}
          <button 
            onClick={() => navigate("/graficos-novo")} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <BarChart3 size={18} className="text-purple-400"/>
            Ver Gráficos
          </button>

          <div className="text-sm text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <strong>{dados.length}</strong> registros
          </div>
          <button onClick={() => fetchDados(filtrosAtivos)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase">
            <Filter size={16} /> Filtros Múltiplos
          </div>
          {Object.keys(filtrosAtivos).length > 0 && (
            <button onClick={limparFiltros} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition">
              <X size={14} /> Limpar Filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.keys(opcoesFiltro).map((key) => (
            <MultiSelect
              key={key}
              label={key}
              options={opcoesFiltro[key]}
              selectedValues={filtrosAtivos[key]}
              onChange={(vals) => handleFiltroChange(key, vals)}
            />
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              Carregando...
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  {colunas.map(col => (
                    <th key={col} className="px-6 py-4 border-b border-slate-800">{col.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dados.length > 0 ? dados.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    {colunas.map(col => (
                      <td key={`${i}-${col}`} className="px-6 py-3 border-b border-slate-800/50">{row[col]}</td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={colunas.length || 1} className="p-12 text-center text-slate-500">Nada encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}