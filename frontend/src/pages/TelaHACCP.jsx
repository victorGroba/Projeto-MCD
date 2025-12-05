import React, { useEffect, useState, useRef } from "react";
import { api } from "../api/api";
import { ArrowLeft, Filter, ShieldAlert, X, RefreshCw, Check, ChevronDown, BarChart3, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- COMPONENTE MULTI-SELECT MELHORADO ---
function MultiSelect({ label, options, selectedValues = [], onChange, color = "orange" }) {
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

  const borderActive = color === "orange" ? "border-orange-500 ring-orange-500/20" : "border-blue-500 ring-blue-500/20";
  const bgActive = color === "orange" ? "bg-orange-500/20" : "bg-blue-500/20";
  const checkBg = color === "orange" ? "bg-orange-500 border-orange-500" : "bg-blue-500 border-blue-500";

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      <label className="text-[10px] text-slate-500 font-bold uppercase truncate" title={label}>
        {label.replace(/_/g, " ")}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between bg-slate-950 border text-xs rounded-lg p-2.5 text-left transition-colors w-full
          ${selectedValues.length > 0 ? `${borderActive} ring-1 text-white` : 'border-slate-700 text-slate-400 hover:border-slate-600'}
        `}
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? "Todos" 
            : selectedValues.length === 1 
              ? selectedValues[0] 
              : `${selectedValues.length} selecionados`}
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
                  ${isSelected ? `${bgActive} text-white` : 'text-slate-400 hover:bg-slate-800'}
                `}
              >
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${isSelected ? checkBg : 'border-slate-600'}
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

// --- TELA HACCP ---
export default function TelaHACCP() {
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [opcoesFiltro, setOpcoesFiltro] = useState({});
  const [filtrosAtivos, setFiltrosAtivos] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDados = async (filtros = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, val]) => {
        if (Array.isArray(val) && val.length > 0) {
          params.append(key, val.join(","));
        } else if (val && !Array.isArray(val)) {
          params.append(key, val);
        }
      });

      const res = await api.get(`/api/haccp?${params.toString()}`);
      
      setDados(res.data.dados || []);
      setColunas(res.data.colunas || []);
      
      if (Object.keys(filtros).length === 0) {
        setOpcoesFiltro(res.data.opcoes_filtro || {});
      }

    } catch (err) {
      console.error("Erro HACCP:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleFiltroChange = (coluna, novosValores) => {
    const novoEstado = { ...filtrosAtivos };
    if (novosValores.length === 0) {
      delete novoEstado[coluna];
    } else {
      novoEstado[coluna] = novosValores;
    }
    setFiltrosAtivos(novoEstado);
    fetchDados(novoEstado);
  };

  const limparFiltros = () => {
    setFiltrosAtivos({});
    fetchDados({});
  };

  // --- FUNÇÃO DE DOWNLOAD ---
  const handleDownloadExcel = async () => {
    try {
      const response = await api.get("/download/haccp", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Planilha_HACCP_Original.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erro ao baixar", error);
      alert("Erro ao baixar planilha. Verifique se existe no servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-800 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <ShieldAlert className="text-orange-500" />
              Controle HACCP
            </h1>
            <p className="text-slate-400 text-sm">Consolidado de Segurança Alimentar</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÃO DOWNLOAD */}
          <button 
            onClick={handleDownloadExcel} 
            className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition text-white shadow-lg shadow-green-900/20"
            title="Baixar Planilha Original"
          >
            <Download size={18} />
          </button>

          <button 
            onClick={() => navigate("/graficos-haccp")} 
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

      {/* Filtros */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm uppercase">
            <Filter size={16} /> Filtros Disponíveis
          </div>
          {Object.keys(filtrosAtivos).length > 0 && (
            <button onClick={limparFiltros} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition">
              <X size={14} /> Limpar Filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Object.keys(opcoesFiltro).map((col) => (
            <MultiSelect
              key={col}
              label={col}
              options={opcoesFiltro[col]}
              selectedValues={filtrosAtivos[col]}
              onChange={(vals) => handleFiltroChange(col, vals)}
              color="orange"
            />
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
              Carregando...
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  {colunas.map(col => (
                    <th key={col} className="px-6 py-4 border-b border-slate-800 tracking-wider">
                      {col.replace(/_/g, " ")}
                    </th>
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
                    <td colSpan={colunas.length || 1} className="p-12 text-center text-slate-500">Nenhum registro encontrado.</td>
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