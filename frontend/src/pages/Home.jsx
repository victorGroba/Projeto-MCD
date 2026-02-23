import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Upload, Droplets, LogOut, CheckCircle, AlertCircle, Loader2, Users, ShieldAlert, TestTube, Siren, ChevronRight, ChevronLeft, MapPin, FileText, Clock
} from "lucide-react";
import { useAuth } from "../store/AuthContext";
import { api } from "../api/api";
import logo from "../assets/logo.png"; 

export default function Home() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados Upload
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [uploadType, setUploadType] = useState("geral");
  const [fileStatus, setFileStatus] = useState(null);
  
  const fileInputRef = useRef(null);

  // Estados Carrossel
  const [pendencias, setPendencias] = useState([]);
  const [loadingPendencias, setLoadingPendencias] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [mapaColunas, setMapaColunas] = useState({});
  
  const scrollRef = useRef(null);
  const scrollPosRef = useRef(0);

  const isAdmin = user?.role === "admin_mattos";
  const canViewAll = isAdmin || user?.role === "gerente_geral";

  // Componente VisionCard Simplificado (Usa a classe do index.css)
  const VisionCard = ({ children, className = "", onClick }) => (
    <div 
      onClick={onClick}
      className={`card-vision p-5 ${className}`} // Usa a classe CSS segura
    >
      {children}
    </div>
  );

  // Busca de dados
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await api.get("/api/geral");
        const dados = res.data.dados || [];
        if (dados.length > 0) {
          // Lógica simplificada de colunas
          const keys = Object.keys(dados[0]);
          const findKey = (candidates) => candidates.find(k => keys.includes(k)) || candidates[0];
          
          const mapa = {
            sigla: findKey(["sigla_loja", "sigla", "loja"]),
            regional: findKey(["regional", "regiao"]),
            pendencia: findKey(["pendencia", "status_pendencia", "motivo"])
          };
          setMapaColunas(mapa);

          const ruins = dados.filter(item => {
            const status = String(item[mapa.pendencia] || "").toLowerCase();
            return status !== "" && status !== "ok" && status !== "na" && status !== "n/a";
          });
          setPendencias(ruins);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPendencias(false);
      }

      if (isAdmin) {
        try {
          const res = await api.get("/api/status-arquivos");
          setFileStatus(res.data);
        } catch(e) {}
      }
    }
    fetchDashboardData();
  }, [isAdmin]);

  // Animação do Carrossel
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || pendencias.length === 0) return;

    let animId;
    const animate = () => {
      if (!isPaused && container) {
        scrollPosRef.current += 0.5;
        if (scrollPosRef.current >= container.scrollWidth / 2) {
          scrollPosRef.current = 0;
        }
        container.scrollLeft = scrollPosRef.current;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [pendencias, isPaused]);

  // Upload Handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post(`/upload/${uploadType}`, formData);
      setUploadMsg({ type: "success", text: "Sucesso!" });
      window.location.reload(); 
    } catch (err) {
      setUploadMsg({ type: "error", text: "Erro no envio." });
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    { title: "Potabilidade", icon: Droplets, path: "/potabilidade", color: "text-blue-500", bg: "bg-blue-500/20", visible: true },
    { title: "Pendências", icon: Siren, path: "/potabilidade", state: { preset: "pendencias" }, color: "text-red-500", bg: "bg-red-500/20", visible: true },
    { title: "HACCP", icon: ShieldAlert, path: "/haccp", color: "text-orange-500", bg: "bg-orange-500/20", visible: canViewAll },
    { title: "Coleta VISA", icon: TestTube, path: "/visa", color: "text-green-500", bg: "bg-green-500/20", visible: canViewAll },
    { title: "Usuários", icon: Users, path: "/admin-users", color: "text-purple-500", bg: "bg-purple-500/20", visible: isAdmin }
  ];

  return (
    <div className="flex h-screen bg-[#0F1535] text-white overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className={`fixed md:relative z-50 w-72 h-full bg-[#0F1535] transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 border-r border-white/10`}>
        <div className="flex flex-col h-full p-4">
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-4 py-6 mb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <img src={logo} className="w-6 h-6 invert brightness-0" alt="Logo" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">QualiView</h1>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Dashboard</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.filter(i => i.visible).map((item, idx) => (
              <button 
                key={idx}
                onClick={() => navigate(item.path, { state: item.state })}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
              >
                <div className={`p-2 rounded-lg ${item.bg} ${item.color} shadow-md`}>
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{item.title}</span>
              </button>
            ))}
          </nav>

          {/* User Info Card */}
          <div className="mt-auto pt-4">
            <VisionCard className="!p-4 bg-gradient-to-br from-blue-600 to-blue-800 border-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{user?.username}</p>
                  <p className="text-[10px] text-white/70 uppercase">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={() => { logout(); navigate("/login"); }}
                className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sair
              </button>
            </VisionCard>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-full overflow-y-auto relative p-4 md:p-8">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <img src={logo} className="w-8 h-8" alt="Logo" />
            <span className="font-bold">QualiView</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu /></button>
        </div>

        {/* Cabeçalho Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <p className="text-gray-400 text-sm font-medium">Visão Geral</p>
            <h2 className="text-3xl font-bold text-white">Painel de Controle</h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1F2749] rounded-xl border border-white/5">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs text-gray-300">Atualizado: Hoje</span>
          </div>
        </div>

        {/* --- TICKER DE PENDÊNCIAS --- */}
        {!loadingPendencias && pendencias.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4 px-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                Lojas com Pendências ({pendencias.length})
              </h3>
            </div>

            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-hidden pb-4"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {[...pendencias, ...pendencias].map((item, i) => (
                <VisionCard 
                  key={i} 
                  className="min-w-[300px] group hover:border-red-500/50 cursor-pointer transition-all"
                  onClick={() => navigate("/potabilidade", { state: { filtrosIniciais: { [mapaColunas.sigla]: [item[mapaColunas.sigla]] } } })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                      <Siren size={20} />
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{item[mapaColunas.sigla]}</h4>
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <MapPin size={12} /> {item[mapaColunas.regional]}
                  </p>
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Motivo</p>
                    <p className="text-xs text-red-300 font-medium truncate">{item[mapaColunas.pendencia]}</p>
                  </div>
                </VisionCard>
              ))}
            </div>
          </div>
        )}

        {/* --- CARDS DE ACESSO RÁPIDO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {menuItems.filter(i => i.visible).map((item, idx) => (
            <VisionCard 
              key={idx} 
              onClick={() => navigate(item.path, { state: item.state })}
              className="cursor-pointer hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Acessar Módulo</p>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={24} />
                </div>
              </div>
              <div className="mt-8 flex items-center gap-1 text-xs font-bold text-white/80 group-hover:text-white">
                Entrar agora <ChevronRight size={14} />
              </div>
            </VisionCard>
          ))}
        </div>

        {/* --- ÁREA ADMIN (UPLOAD) --- */}
        {isAdmin && (
          <VisionCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                    <Upload size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Central de Dados</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["geral", "visa", "haccp"].map(key => {
                    const info = fileStatus?.[key];
                    const labels = { geral: "Potabilidade", visa: "Coleta VISA", haccp: "HACCP" };
                    return (
                      <div key={key} className="bg-[#0F1535]/50 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400">{labels[key]}</span>
                          {info?.existe ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
                        </div>
                        <div className="text-xs text-white truncate" title={info?.nome_arquivo}>
                          {info?.nome_arquivo || "Sem arquivo"}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{info?.ultima_modificacao || "--"}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
                <p className="text-sm text-gray-400 mb-4">Selecione uma base para atualizar:</p>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx" className="hidden" />
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => { setUploadType('geral'); fileInputRef.current?.click(); }}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    {uploading && uploadType === 'geral' ? <Loader2 className="animate-spin" size={16}/> : <Droplets size={16}/>}
                    POTABILIDADE
                  </button>
                  <button 
                    onClick={() => { setUploadType('visa'); fileInputRef.current?.click(); }}
                    disabled={uploading}
                    className="flex-1 bg-[#0F1535] border border-green-500 text-green-500 hover:bg-green-500 hover:text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {uploading && uploadType === 'visa' ? <Loader2 className="animate-spin" size={16}/> : <TestTube size={16}/>}
                    VISA
                  </button>
                </div>
                {uploadMsg && (
                  <div className={`mt-4 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${uploadMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {uploadMsg.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                    {uploadMsg.text}
                  </div>
                )}
              </div>
            </div>
          </VisionCard>
        )}
      </main>
    </div>
  );
}