import React, { useEffect, useState, useRef } from "react";
import { api } from "../api/api";
import { ArrowLeft, Filter, Table, X, RefreshCw, Check, ChevronDown, BarChart3, Settings2, GripVertical, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- COMPONENTE MULTI-SELECT MELHORADO ---
function MultiSelect({ label, options, selectedValues = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const selectAll = () => {
    const visibleValues = filteredOptions;
    const newSelection = Array.from(new Set([...selectedValues, ...visibleValues]));
    onChange(newSelection);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-1 relative min-w-[140px]" ref={containerRef}>
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
        <div className="absolute top-full left-0 w-64 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <button onClick={selectAll} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">(Marcar Todos)</button>
              <button onClick={clearAll} className="text-[10px] text-red-400 hover:text-red-300 font-medium">(Limpar)</button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-60 p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-xs transition-colors mb-0.5 ${isSelected ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-[10px] text-slate-500">Nenhuma opção encontrada.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- TELA GERAL ---
export default function TelaGeral() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [todasColunas, setTodasColunas] = useState([]);
  const [colunasOrdenadas, setColunasOrdenadas] = useState([]);
  const [colunasOcultas, setColunasOcultas] = useState([]);
  const [menuColunasAberto, setMenuColunasAberto] = useState(false);
  const [colunaArrastada, setColunaArrastada] = useState(null);
  const [opcoesFiltro, setOpcoesFiltro] = useState({});
  const [nomesColunas, setNomesColunas] = useState({});
  const [filtrosAtivos, setFiltrosAtivos] = useState({});
  const [loading, setLoading] = useState(true);
  const menuColunasRef = useRef(null);

  useEffect(() => {
    async function carregarOpcoes() {
      try {
        const res = await api.get("/api/filtros-opcoes");
        const opcoes = {};
        const nomes = {};
        Object.keys(res.data).forEach(key => {
          if (key.endsWith("_col_name")) {
            nomes[key.replace("_col_name", "")] = res.data[key];
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
    
    function handleClickOutside(event) {
      if (menuColunasRef.current && !menuColunasRef.current.contains(event.target)) {
        setMenuColunasAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    carregarOpcoes();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDados = async (filtros = {}, mapNomes = nomesColunas) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, val]) => {
        const colunaReal = mapNomes[key] || key;
        if (Array.isArray(val) && val.length > 0) {
          params.append(colunaReal, val.join("|"));
        } else if (val && !Array.isArray(val)) {
          params.append(colunaReal, val);
        }
      });

      const res = await api.get(`/api/geral?${params.toString()}`);
      setDados(res.data.dados || []);
      const cols = res.data.colunas || [];
      setTodasColunas(cols);
      if (colunasOrdenadas.length === 0) setColunasOrdenadas(cols);

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (chaveFiltro, novosValores) => {
    const novoEstado = { ...filtrosAtivos };
    if (novosValores.length === 0) delete novoEstado[chaveFiltro];
    else novoEstado[chaveFiltro] = novosValores;
    setFiltrosAtivos(novoEstado);
    fetchDados(novoEstado);
  };

  const limparFiltros = () => {
    setFiltrosAtivos({});
    fetchDados({});
  };

  const onDragStart = (e, colNome) => {
    setColunaArrastada(colNome);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, colAlvo) => {
    e.preventDefault();
    if (!colunaArrastada || colunaArrastada === colAlvo) return;
    const novaOrdem = [...colunasOrdenadas];
    const idxOrigem = novaOrdem.indexOf(colunaArrastada);
    const idxAlvo = novaOrdem.indexOf(colAlvo);
    novaOrdem.splice(idxOrigem, 1);
    novaOrdem.splice(idxAlvo, 0, colunaArrastada);
    setColunasOrdenadas(novaOrdem);
    setColunaArrastada(null);
  };

  const toggleColuna = (col) => {
    if (colunasOcultas.includes(col)) setColunasOcultas(colunasOcultas.filter(c => c !== col));
    else setColunasOcultas([...colunasOcultas, col]);
  };

  const colunasVisiveis = colunasOrdenadas.filter(col => !colunasOcultas.includes(col));

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="p-4 md:p-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/home")} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-800 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-white"><Table className="text-blue-500" />Controle de Potabilidade</h1>
              <p className="text-slate-400 text-sm">Base de dados geral</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/graficos-novo")} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"><BarChart3 size={18} className="text-purple-400"/>Gráficos</button>
            <button onClick={() => fetchDados(filtrosAtivos)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition text-white shadow-lg shadow-blue-900/20"><RefreshCw size={18} /></button>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg mb-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex-1 w-full lg:w-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                <Filter size={14} /> Filtros de Dados
                
                {/* --- CONTADOR DE LINHAS (NOVIDADE) --- */}
                <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-normal normal-case">
                  {loading ? 'Carregando...' : `${dados.length} ${dados.length === 1 ? 'registro encontrado' : 'registros encontrados'}`}
                </span>
                
              </div>
              {Object.keys(filtrosAtivos).length > 0 && (
                <button onClick={limparFiltros} className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-300 transition bg-red-400/10 px-2 py-1 rounded-full"><X size={12} /> Limpar</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
              {Object.keys(opcoesFiltro).map((key) => (
                <MultiSelect key={key} label={key} options={opcoesFiltro[key]} selectedValues={filtrosAtivos[key]} onChange={(vals) => handleFiltroChange(key, vals)} />
              ))}
            </div>
          </div>

          <div className="relative shrink-0 self-end lg:self-auto" ref={menuColunasRef}>
            <button onClick={() => setMenuColunasAberto(!menuColunasAberto)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-blue-500 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all">
              <Settings2 size={16} />Configurar Colunas<span className="ml-1 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">{colunasVisiveis.length}/{todasColunas.length}</span>
            </button>
            {menuColunasAberto && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-3 border-b border-slate-800 bg-slate-950/50 backdrop-blur"><h3 className="text-xs font-bold text-slate-400 uppercase">Exibir/Ocultar</h3></div>
                <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {colunasOrdenadas.map(col => (
                    <button key={col} onClick={() => toggleColuna(col)} className="flex items-center w-full gap-3 p-2 rounded hover:bg-slate-800 transition text-left group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!colunasOcultas.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                        {!colunasOcultas.includes(col) && <Check size={10} className="text-white" />}
                      </div>
                      <span className={`text-xs truncate ${colunasOcultas.includes(col) ? 'text-slate-500' : 'text-slate-200'}`}>{col.replace(/_/g, " ")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl h-full flex flex-col overflow-hidden relative">
          <div className="overflow-auto flex-1 w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>Carregando...</div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap border-collapse">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-bold sticky top-0 z-20 shadow-md">
                  <tr>
                    {colunasVisiveis.map((col) => (
                      <th key={col} draggable onDragStart={(e) => onDragStart(e, col)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} className={`px-4 py-3 border-b border-slate-800 bg-slate-950 select-none cursor-grab active:cursor-grabbing hover:bg-slate-900 transition-colors group relative ${colunaArrastada === col ? 'opacity-50 border-2 border-dashed border-blue-500' : ''}`}>
                        <div className="flex items-center gap-2"><GripVertical size={14} className="text-slate-700 group-hover:text-slate-500" /><span>{col.replace(/_/g, " ")}</span></div>
                        <div className="absolute right-0 top-1/4 bottom-1/4 w-[1px] bg-slate-800 group-hover:bg-slate-600"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dados.length > 0 ? dados.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                      {colunasVisiveis.map(col => (
                        <td key={`${i}-${col}`} className="px-4 py-2 border-b border-slate-800/50 group-hover:text-white transition-colors">{row[col]}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr><td colSpan={colunasVisiveis.length || 1} className="p-12 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}