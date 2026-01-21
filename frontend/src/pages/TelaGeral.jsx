import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { api } from "../api/api";
import { 
  ArrowLeft, Filter, Table, X, RefreshCw, Check, ChevronDown, 
  BarChart3, Settings2, GripVertical, Search, Siren, Download, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff, Layers,
  ArrowUpAZ, ArrowDownZA, Hash // Usando icone Hash (simples e seguro)
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// --- LISTA NEGRA: TERMOS QUE INDICAM PARÂMETROS (PARA OCULTAR) ---
const TERMOS_PARA_OCULTAR = [
  // Físico-Químicos
  "ph", "turbidez", "cloro", "cor", "gosto", "odor", "sabor", "aspecto", 
  "temperatura", "residual", "livre", "total",
  // Microbiológicos
  "het", "bacterias", "heterotroficas", "ufc",
  "coliformes", "coli", "escherichia", "contagem"
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

// --- COMPONENTE DE FILTRO ESTILO EXCEL ---
const ExcelColumnFilter = ({ column, options, activeFilters, onFilterChange, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedValues = activeFilters || [];
  const hasOptions = options && options.length > 0;
  
  const filteredOptions = hasOptions 
    ? options.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const toggleOption = (val) => {
    const current = [...selectedValues];
    if (current.includes(val)) {
      onFilterChange(column, current.filter(c => c !== val));
    } else {
      onFilterChange(column, [...current, val]);
    }
  };

  const handleSelectAll = () => {
    const allVisibleSelected = filteredOptions.every(opt => selectedValues.includes(opt));
    if (allVisibleSelected) {
      const newSelected = selectedValues.filter(v => !filteredOptions.includes(v));
      onFilterChange(column, newSelected);
    } else {
      const newSelected = [...new Set([...selectedValues, ...filteredOptions])];
      onFilterChange(column, newSelected);
    }
  };

  const isActive = selectedValues.length > 0;
  
  const alignClass = align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right";

  return (
    <div className="relative inline-block ml-1" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`p-1 rounded hover:bg-slate-700 transition-colors ${isActive ? 'text-blue-400 bg-blue-400/10' : 'text-slate-600 hover:text-slate-300'}`}
        title="Filtrar"
      >
        <Filter size={14} fill={isActive ? "currentColor" : "none"} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col text-left font-normal normal-case animate-in fade-in zoom-in-95 duration-100 ${alignClass}`}>
          
          <div className="p-2 border-b border-slate-800 flex flex-col gap-1">
            <button className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded text-left disabled:opacity-50">
              <ArrowUpAZ size={14} className="text-slate-500"/> Classificar A a Z
            </button>
            <button className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded text-left disabled:opacity-50">
              <ArrowDownZA size={14} className="text-slate-500"/> Classificar Z a A
            </button>
          </div>

          {hasOptions && (
            <div className="p-2 border-b border-slate-800 bg-slate-950">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 pl-7 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  placeholder="Pesquisar..."
                  autoFocus
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
             {hasOptions ? (
               <>
                 <div 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 cursor-pointer rounded mb-1 border-b border-slate-800/50"
                 >
                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${filteredOptions.every(o => selectedValues.includes(o)) && filteredOptions.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                      {filteredOptions.every(o => selectedValues.includes(o)) && filteredOptions.length > 0 && <Check size={10} className="text-white"/>}
                    </div>
                    <span className="text-xs text-slate-300 font-bold">(Selecionar Tudo)</span>
                 </div>

                 {filteredOptions.map(opt => {
                   const isChecked = selectedValues.includes(opt);
                   return (
                     <div key={opt} onClick={() => toggleOption(opt)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 cursor-pointer rounded">
                       <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                         {isChecked && <Check size={10} className="text-white"/>}
                       </div>
                       <span className="text-xs text-slate-300 truncate">{opt}</span>
                     </div>
                   )
                 })}
                 {filteredOptions.length === 0 && (
                   <div className="p-2 text-center text-[10px] text-slate-500">Nenhum item encontrado na busca.</div>
                 )}
               </>
             ) : (
               <div className="p-4 text-center text-xs text-slate-500">
                 Sem opções pré-definidas ou muitos dados distintos. <br/>Use a busca principal.
               </div>
             )}
          </div>

          <div className="p-2 border-t border-slate-800 flex justify-between gap-2 bg-slate-950 rounded-b-lg">
            <button 
              onClick={() => { onFilterChange(column, []); setIsOpen(false); }}
              className="px-3 py-1 text-[10px] text-slate-400 hover:text-red-400 border border-slate-700 rounded hover:border-red-400/50 hover:bg-red-400/10 transition-colors"
            >
              Limpar Filtro
            </button>
             <button 
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jaCarregouPadroes, setJaCarregouPadroes] = useState(false);
  
  const [opcoesFiltro, setOpcoesFiltro] = useState({});
  const [nomesColunas, setNomesColunas] = useState({});
  const [filtrosAtivos, setFiltrosAtivos] = useState({});

  const menuColunasRef = useRef(null);

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

  useEffect(() => {
    async function init() {
      try {
        const res = await api.get("/api/filtros-opcoes");
        const opcoes = {}; const nomes = {};
        Object.keys(res.data).forEach(key => {
          if (key.endsWith("_col_name")) {
             nomes[key.replace("_col_name", "")] = res.data[key];
          } else {
             opcoes[key] = res.data[key];
          }
        });
        setOpcoesFiltro(opcoes);
        setNomesColunas(nomes);

        if (location.state?.filtrosIniciais) {
          setFiltrosAtivos(location.state.filtrosIniciais);
          fetchDados(location.state.filtrosIniciais, nomes);
        } else if (location.state?.preset === "pendencias") {
          const chave = Object.keys(nomes).find(k => k.includes("pendencia")) || "pendencia";
          if (opcoes[chave]) {
            const ruins = opcoes[chave].filter(o => !["ok", "na", ""].includes(o?.toLowerCase().trim()));
            setFiltrosAtivos({ [chave]: ruins });
            fetchDados({ [chave]: ruins }, nomes);
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

      if (!jaCarregouPadroes && colsVindas.length > 0) {
        const colunasParaEsconder = colsVindas.filter(col => {
          const nomeLower = col.toLowerCase();
          const temTermoProibido = TERMOS_PARA_OCULTAR.some(termo => nomeLower.includes(termo));
          return temTermoProibido;
        });
        setColunasOcultas(colunasParaEsconder);
        setJaCarregouPadroes(true);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleFiltroChange = (key, vals) => {
    const novos = { ...filtrosAtivos };
    if (vals && vals.length > 0) novos[key] = vals; 
    else delete novos[key];
    setFiltrosAtivos(novos);
    fetchDados(novos);
  };

  const limparFiltros = () => { setFiltrosAtivos({}); fetchDados({}); };

  const getCleanColumnName = (colName, groupName) => {
    if (!groupName) return colName.replace(/_/g, " ");
    const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").trim();
    const cNorm = normalize(colName);
    const gNorm = normalize(groupName);

    if (cNorm.includes(gNorm)) {
      const groupRegex = new RegExp(groupName.replace(/_/g, " "), "i");
      let clean = colName.replace(/_/g, " ").replace(groupRegex, "").trim();
      clean = clean.replace(/^[-–—\s]+/, "");
      if (clean.length > 0) {
        return clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }
    return colName.replace(/_/g, " ");
  };

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
          headerRow2.push({ name: cleanName, originalName: subCol });
          flatColumns.push(subCol);
        }
        i += span - 1;
      }
    }
    return { headerRow1, headerRow2, flatColumns };
  }, [todasColunas, colunasOcultas]);

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
                <p className="text-slate-400 text-sm flex items-center gap-2">
                   Visão Geral
                   {/* CONTADOR NO TÍTULO (BACKUP) */}
                   <span className="inline-block w-1 h-1 bg-slate-500 rounded-full"></span>
                   <span className="text-blue-400 font-medium">{loading ? "..." : dados.length} registros</span>
                </p>
              </div>
            </div>
          )}

          <div className={`flex items-center gap-2 flex-wrap ${isFullscreen ? 'w-full justify-between' : ''}`}>
            {isFullscreen && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Modo Apresentação</div>}

            {/* --- CONTADOR PRINCIPAL EM DESTAQUE --- */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white font-bold shadow-lg shadow-blue-500/10 ring-1 ring-blue-500 mr-2 animate-in slide-in-from-right-4 duration-500">
               <Hash size={16} className="text-blue-200"/>
               <div className="flex flex-col leading-none">
                 <span className="text-[10px] uppercase text-blue-200 font-medium">Total</span>
                 <span className="text-lg">{loading ? "..." : dados.length}</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 ${isFullscreen ? 'bg-slate-800 border-slate-700' : ''}`}>
                <button onClick={() => changeZoom(-0.1)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Diminuir"><ZoomOut size={16}/></button>
                <span className="px-2 text-xs font-medium w-[45px] text-center">{Math.round(zoomLevel*100)}%</span>
                <button onClick={() => changeZoom(0.1)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Aumentar"><ZoomIn size={16}/></button>
              </div>
              
              {Object.keys(filtrosAtivos).length > 0 && (
                <button 
                  onClick={limparFiltros} 
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-all"
                >
                  <X size={16} /> <span className="hidden md:inline">Limpar Filtros</span>
                </button>
              )}

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
                        <th key={`c-${item.name}-${idx}`} rowSpan={item.rowSpan} className="px-4 py-3 border border-slate-800 bg-slate-950 text-xs uppercase align-middle group">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical size={14} className="text-slate-700"/>
                              {item.name.replace(/_/g, " ")}
                            </div>
                            <ExcelColumnFilter 
                              column={item.name}
                              options={opcoesFiltro[item.name] || []}
                              activeFilters={filtrosAtivos[item.name]}
                              onFilterChange={handleFiltroChange}
                              align={idx >= tableStructure.headerRow1.length - 2 ? "right" : "left"}
                            />
                          </div>
                        </th>
                      )
                    ))}
                  </tr>
                  <tr>
                    {tableStructure.headerRow2.map((col, idx) => (
                      <th key={`sub-${col.name}-${idx}`} className="px-4 py-2 border border-slate-800 bg-slate-900/50 text-xs text-slate-300 font-medium top-[30px]">
                        <div className="flex items-center justify-between">
                           <span>{col.name}</span>
                           <ExcelColumnFilter 
                              column={col.originalName}
                              options={opcoesFiltro[col.originalName] || []}
                              activeFilters={filtrosAtivos[col.originalName]}
                              onFilterChange={handleFiltroChange}
                              align={idx >= tableStructure.headerRow2.length - 2 ? "right" : "left"}
                           />
                        </div>
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