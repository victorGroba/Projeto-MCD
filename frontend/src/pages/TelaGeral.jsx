import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { api } from "../api/api";
import { 
  ArrowLeft, Filter, Table, X, RefreshCw, Check, ChevronDown, 
  BarChart3, Settings2, GripVertical, Search, Siren, Download, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff, Layers 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// --- LISTA NEGRA: TERMOS QUE INDICAM PARÂMETROS (PARA OCULTAR) ---
// Removido "bac" para não ocultar "Back Room".
// Usamos "het" para pegar "Bac Het" e "bacterias" para o extenso.
const TERMOS_PARA_OCULTAR = [
  // Físico-Químicos
  "ph", "turbidez", "cloro", "cor", "gosto", "odor", "sabor", "aspecto", 
  "temperatura", "residual", "livre", "total",
  // Microbiológicos
  "het", "bacterias", "heterotroficas", "ufc", // "het" pega Bac Het
  "coliformes", "coli", "escherichia", "contagem"
];

// --- LISTA BRANCA: TERMOS QUE NUNCA DEVEM SER OCULTOS ---
// Se a coluna tiver APENAS esses nomes (ou for Status/Pendência), ela fica.
const TOPICOS_PRINCIPAIS = [
  "back room", "torre de suco", "gelo pool", "maquina de gelo", "bin cafe", "bin bebidas", "bin bebida",
  "loja", "data", "uf", "cidade", "regional", "responsavel",
  "status", "pendencia", "analise", "conclusao"
];

// --- GRUPOS VISUAIS ---
const CONFIG_GRUPOS = {
  "Back Room": ["back", "room"], 
  "Torre de Suco": ["torre", "suco"],
  "Gelo Pool": ["gelo", "pool"],
  "Máquina de Gelo": ["maquina", "gelo"],
  "Bin Café": ["bin", "cafe"],
  "Bin Bebidas": ["bin", "bebida"],
  "Controle Interno": ["status", "pendencia", "analise", "conclusao"]
};

// --- COMPONENTE MULTI-SELECT ---
const MultiSelect = React.memo(({ label, options, selectedValues = [], onChange }) => {
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
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value) => {
    const current = selectedValues || [];
    let updated;
    if (current.includes(value)) updated = current.filter((item) => item !== value);
    else updated = [...current, value];
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1 relative min-w-[140px]" ref={containerRef}>
      <label className="text-[10px] text-slate-500 font-bold uppercase truncate" title={label}>
        {label.replace(/_/g, " ")}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-slate-950 border text-xs rounded-lg p-2.5 text-left transition-all duration-200 w-full ${selectedValues.length > 0 ? 'border-blue-500 ring-1 ring-blue-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
      >
        <span className="truncate">{selectedValues.length === 0 ? "Todos" : `${selectedValues.length} selecionados`}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-64 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                ref={inputRef} type="text" className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
                placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <button onClick={() => onChange(filteredOptions)} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors">(Marcar Todos)</button>
              <button onClick={() => onChange([])} className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors">(Limpar)</button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-60 p-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredOptions.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-xs transition-all duration-150 mb-0.5 ${isSelected ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>
                  <span className="truncate">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// --- LINHA DA TABELA ---
const TableRow = React.memo(({ row, columns, index }) => (
  <tr className="hover:bg-slate-800/50 transition-colors group">
    {columns.map((col) => {
      const valor = row[col];
      const isAlert = (col.toLowerCase().includes("pendencia") || col.toLowerCase().includes("status")) 
                      && valor && !["ok", "normal", "conforme", "na", ""].includes(String(valor).toLowerCase().trim());
      
      return (
        <td key={`${index}-${col}`} className={`px-4 py-2 border-b border-slate-800/50 group-hover:text-white transition-colors whitespace-nowrap ${isAlert ? 'text-orange-400 font-medium bg-orange-500/5' : 'text-slate-300'}`}>
          {isAlert && <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-2 mb-0.5"></span>}
          {valor}
        </td>
      );
    })}
  </tr>
));

// --- TELA GERAL ---
export default function TelaGeral() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dados, setDados] = useState([]);
  const [todasColunas, setTodasColunas] = useState([]);
  const [colunasOcultas, setColunasOcultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(50);

  const [menuColunasAberto, setMenuColunasAberto] = useState(false);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jaCarregouPadroes, setJaCarregouPadroes] = useState(false);
  
  const [opcoesFiltro, setOpcoesFiltro] = useState({});
  const [nomesColunas, setNomesColunas] = useState({});
  const [filtrosAtivos, setFiltrosAtivos] = useState({});

  const menuColunasRef = useRef(null);

  // --- FULLSCREEN ---
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) { console.error(err); }
  };

  // --- INIT ---
  useEffect(() => {
    async function init() {
      try {
        const res = await api.get("/api/filtros-opcoes");
        const opcoes = {}; const nomes = {};
        Object.keys(res.data).forEach(key => {
          if (key.endsWith("_col_name")) nomes[key.replace("_col_name", "")] = res.data[key];
          else opcoes[key] = res.data[key];
        });
        setOpcoesFiltro(opcoes);
        setNomesColunas(nomes);

        if (location.state?.filtrosIniciais) {
          setFiltrosAtivos(location.state.filtrosIniciais);
          fetchDados(location.state.filtrosIniciais, nomes);
          setFiltrosVisiveis(true);
        } else if (location.state?.preset === "pendencias") {
          const chave = Object.keys(nomes).find(k => k.includes("pendencia")) || "pendencia";
          if (opcoes[chave]) {
            const ruins = opcoes[chave].filter(o => !["ok", "na", ""].includes(o?.toLowerCase().trim()));
            setFiltrosAtivos({ [chave]: ruins });
            fetchDados({ [chave]: ruins }, nomes);
            setFiltrosVisiveis(true);
          } else fetchDados({}, nomes);
        } else {
          fetchDados({}, nomes);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    
    document.addEventListener("mousedown", (e) => {
      if (menuColunasRef.current && !menuColunasRef.current.contains(e.target)) setMenuColunasAberto(false);
    });
    
    init();
  }, [location.state]);

  const fetchDados = async (filtros = {}, mapNomes = nomesColunas) => {
    setLoading(true);
    setVisibleRows(50);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, val]) => {
        const col = mapNomes[key] || key;
        if (Array.isArray(val) && val.length > 0) params.append(col, val.join("|"));
        else if (val) params.append(col, val);
      });

      const res = await api.get(`/api/geral?${params.toString()}`);
      setDados(res.data.dados || []);
      const colsVindas = res.data.colunas || [];
      setTodasColunas(colsVindas);

      // --- LÓGICA DE OCULTAÇÃO CORRIGIDA ---
      if (!jaCarregouPadroes && colsVindas.length > 0) {
        const colunasParaEsconder = colsVindas.filter(col => {
          const nomeLower = col.toLowerCase();

          // 1. PRIORIDADE TOTAL: SE FOR TÓPICO PRINCIPAL, NUNCA ESCONDE
          // Verifica se o nome da coluna contém termos como "Back Room", "Gelo Pool" etc.
          // MAS APENAS SE FOR A COLUNA DE IDENTIFICAÇÃO (sem parâmetros junto)
          // Como sabemos? Geralmente colunas de identificação são só "Back Room" ou "Status Back Room"
          // Colunas de parâmetro são "Back Room pH", "Back Room Cloro".
          
          // Melhor abordagem: Verificar se contém termo proibido.
          const temTermoProibido = TERMOS_PARA_OCULTAR.some(termo => nomeLower.includes(termo));

          if (temTermoProibido) {
            return true; // É parâmetro (pH, Cloro, Het), esconde.
          }

          // Se não tem termo proibido, é coluna segura (Back Room, Torre, Status, etc).
          return false;
        });
        
        setColunasOcultas(colunasParaEsconder);
        setJaCarregouPadroes(true);
      }

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleFiltroChange = (key, vals) => {
    const novos = { ...filtrosAtivos };
    if (vals.length) novos[key] = vals; else delete novos[key];
    setFiltrosAtivos(novos);
    fetchDados(novos);
  };

  const limparFiltros = () => { setFiltrosAtivos({}); fetchDados({}); };

  const aplicarFiltroPendenciasManual = () => {
    const chave = Object.keys(nomesColunas).find(k => k.includes("pendencia")) || "pendencia";
    if (opcoesFiltro[chave]) {
      const ruins = opcoesFiltro[chave].filter(o => !["ok", "na", ""].includes(o?.toLowerCase().trim()));
      handleFiltroChange(chave, ruins);
      setFiltrosVisiveis(true);
    }
  };

  // --- LIMPEZA DE NOMES NO HEADER ---
  const getCleanColumnName = (colName, groupName) => {
    if (!groupName) return colName.replace(/_/g, " ");
    
    // Normalização
    const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").trim();
    const cNorm = normalize(colName);
    const gNorm = normalize(groupName);

    // Se o nome da coluna contiver o nome do grupo
    if (cNorm.includes(gNorm)) {
      // Cria regex para remover o nome do grupo (case insensitive)
      const groupRegex = new RegExp(groupName.replace(/_/g, " "), "i");
      let clean = colName.replace(/_/g, " ").replace(groupRegex, "").trim();
      
      // Limpa hífens/traços no início
      clean = clean.replace(/^[-–—\s]+/, "");

      // Se sobrou algo (ex: "Cloro"), retorna limpo.
      // Se não sobrou nada (ex: a coluna era só "Gelo Pool"), retorna "Status" ou o original para não ficar vazio.
      if (clean.length > 0) {
        return clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }
    
    return colName.replace(/_/g, " ");
  };

  // --- ESTRUTURA TABLE ---
  const tableStructure = useMemo(() => {
    const visiveis = todasColunas.filter(c => !colunasOcultas.includes(c));
    const colToGroup = {};
    visiveis.forEach(col => {
      for (const [groupName, keywords] of Object.entries(CONFIG_GRUPOS)) {
        if (keywords.every(k => col.toLowerCase().includes(k.toLowerCase()))) {
          colToGroup[col] = groupName;
          break;
        }
      }
    });

    const headerRow1 = [];
    const headerRow2 = [];
    const flatColumns = [];
    
    for (let i = 0; i < visiveis.length; i++) {
      const col = visiveis[i];
      const groupName = colToGroup[col];

      if (!groupName) {
        headerRow1.push({ type: 'single', name: col, rowSpan: 2 });
        flatColumns.push(col);
      } else {
        let span = 1;
        while (i + span < visiveis.length && colToGroup[visiveis[i + span]] === groupName) {
          span++;
        }
        
        headerRow1.push({ type: 'group', name: groupName, colSpan: span, rowSpan: 1 });
        
        for (let j = 0; j < span; j++) {
          const subCol = visiveis[i + j];
          const cleanName = getCleanColumnName(subCol, groupName);
          headerRow2.push({ name: cleanName });
          flatColumns.push(subCol);
        }
        i += span - 1;
      }
    }
    return { headerRow1, headerRow2, flatColumns };
  }, [todasColunas, colunasOcultas]);

  // --- ACTIONS ---
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      setVisibleRows(prev => Math.min(prev + 50, dados.length));
    }
  }, [dados.length]);

  const changeZoom = (delta) => setZoomLevel(prev => Math.max(0.5, Math.min(1.8, prev + delta)));
  
  const handleDownloadExcel = async () => {
    try {
      const response = await api.get("/download/geral", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Potabilidade_Geral.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { alert("Erro ao baixar planilha."); }
  };

  return (
    <div className={`h-screen flex flex-col bg-slate-950 text-white overflow-hidden transition-all duration-300`}>
      
      {/* HEADER */}
      <div className={`shrink-0 border-slate-800/50 transition-all duration-300 ${isFullscreen ? 'p-2 border-b-0 bg-slate-900/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50' : 'p-4 md:p-6 border-b'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {!isFullscreen && (
            <div className="flex items-center gap-4 animate-in fade-in duration-300">
              <button onClick={() => navigate("/home")} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-800 transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Table className="text-blue-500" /> Controle de Potabilidade
                </h1>
                <p className="text-slate-400 text-sm">Visão Geral</p>
              </div>
            </div>
          )}

          <div className={`flex items-center gap-2 flex-wrap ${isFullscreen ? 'w-full justify-between' : ''}`}>
            {isFullscreen && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Modo Apresentação</div>}

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 ${isFullscreen ? 'bg-slate-800 border-slate-700' : ''}`}>
                <button onClick={() => changeZoom(-0.1)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Diminuir"><ZoomOut size={16}/></button>
                <span className="px-2 text-xs font-medium w-[45px] text-center">{Math.round(zoomLevel*100)}%</span>
                <button onClick={() => changeZoom(0.1)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Aumentar"><ZoomIn size={16}/></button>
              </div>
              
              <button 
                onClick={() => setFiltrosVisiveis(!filtrosVisiveis)} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${filtrosVisiveis ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                title="Filtros"
              >
                <Filter size={16} />
                {!isFullscreen && <span className="hidden md:inline">Filtros</span>}
              </button>

              <div className="relative" ref={menuColunasRef}>
                <button onClick={() => setMenuColunasAberto(!menuColunasAberto)} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-lg text-sm font-medium text-slate-300 transition-colors">
                  <Settings2 size={16} /> {!isFullscreen && <span className="hidden md:inline">Colunas</span>}
                </button>
                {menuColunasAberto && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                     <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase mb-1">Colunas Visíveis</div>
                     {todasColunas.map(col => (
                        <button key={col} onClick={() => setColunasOcultas(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])} className="flex items-center w-full gap-3 p-2 hover:bg-slate-800 rounded text-left group">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${!colunasOcultas.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                            {!colunasOcultas.includes(col) && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-xs truncate ${colunasOcultas.includes(col) ? 'text-slate-500' : 'text-slate-200'}`}>{col.replace(/_/g, " ")}</span>
                        </button>
                     ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className={`p-2 rounded-lg transition-all ${isFullscreen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 hover:bg-slate-800 border border-slate-800'}`} title="Tela Cheia (F11)">
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {!isFullscreen && (
                <>
                  <div className="w-[1px] h-6 bg-slate-800 mx-1"></div>
                  <button onClick={handleDownloadExcel} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white shadow-lg"><Download size={18} /></button>
                  <button onClick={() => navigate("/graficos-novo")} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-purple-400"><BarChart3 size={18}/></button>
                  <button onClick={() => fetchDados(filtrosAtivos)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg"><RefreshCw size={18} /></button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ÁREA DE FILTROS */}
        {filtrosVisiveis && (
          <div className="mt-4 bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-4 animate-in slide-in-from-top-2 fade-in duration-200 relative z-40">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                <Search size={14} className="text-blue-400"/> Filtrar Registros ({dados.length})
              </div>
              <div className="flex gap-2">
                 <button onClick={aplicarFiltroPendenciasManual} className="text-[10px] flex items-center gap-1 text-orange-400 hover:text-orange-300 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded-full"><Siren size={12} /> Só Pendências</button>
                 {Object.keys(filtrosAtivos).length > 0 && <button onClick={limparFiltros} className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-full"><X size={12} /> Limpar Todos</button>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {Object.keys(opcoesFiltro).map((key) => (
                <MultiSelect key={key} label={key} options={opcoesFiltro[key]} selectedValues={filtrosAtivos[key]} onChange={(vals) => handleFiltroChange(key, vals)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ÁREA DA TABELA */}
      <div className={`flex-1 overflow-hidden px-4 md:px-6 pb-6 ${isFullscreen ? 'pt-16' : 'pt-2'}`}>
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl h-full flex flex-col overflow-hidden relative">
          <div className="overflow-auto flex-1 w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-950" onScroll={handleScroll}>
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>Carregando...</div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap border-collapse origin-top-left" style={{ zoom: zoomLevel }}>
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-bold sticky top-0 z-20 shadow-md">
                  <tr>
                    {tableStructure.headerRow1.map((item, idx) => (
                      item.type === 'group' ? (
                        <th key={`g-${idx}`} colSpan={item.colSpan} className="px-4 py-2 border border-slate-800 bg-slate-900 text-center text-blue-400 uppercase tracking-wider text-xs border-b-2 border-b-slate-800">
                          {item.name}
                        </th>
                      ) : (
                        <th key={`c-${item.name}-${idx}`} rowSpan={item.rowSpan} className="px-4 py-3 border border-slate-800 bg-slate-950 text-xs uppercase align-middle">
                          <div className="flex items-center gap-2"><GripVertical size={14} className="text-slate-700"/>{item.name.replace(/_/g, " ")}</div>
                        </th>
                      )
                    ))}
                  </tr>
                  <tr>
                    {tableStructure.headerRow2.map((col, idx) => (
                      <th key={`sub-${col.name}-${idx}`} className="px-4 py-2 border border-slate-800 bg-slate-900/50 text-xs text-slate-300 font-medium top-[30px]">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dados.length > 0 ? dados.slice(0, visibleRows).map((row, i) => (
                    <TableRow key={i} row={row} columns={tableStructure.flatColumns} index={i} />
                  )) : (
                    <tr><td colSpan="100%" className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                  )}
                  {visibleRows < dados.length && (
                    <tr><td colSpan="100%" className="text-center py-4 text-slate-500 text-xs">Carregando mais...</td></tr>
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