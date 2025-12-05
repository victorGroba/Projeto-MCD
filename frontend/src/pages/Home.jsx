import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Upload, Droplets, LogOut, CheckCircle, AlertCircle, Loader2, Users, ShieldAlert, TestTube, Siren
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
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadMsg({ type: "success", text: "Atualizado com sucesso!" });
      setTimeout(() => setUploadMsg(null), 3000);
    } catch (error) {
      setUploadMsg({ type: "error", text: error.response?.data?.msg || "Erro no upload." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // --- REGRAS DE ACESSO ---
  const role = user?.role || "operacional";
  const isAdmin = role === "admin_mattos";
  const isGerente = role === "gerente_geral";
  
  const canViewAll = isAdmin || isGerente; 

  // Função para navegar com Filtro Presetado
  const irParaPendencias = () => {
    navigate("/potabilidade", { state: { preset: "pendencias" } });
  };

  const menuItems = [
    { 
      title: "Potabilidade",
      icon: Droplets,
      path: "/potabilidade",
      desc: "Controle de qualidade da água",
      color: "text-blue-400", 
      bgHover: "group-hover:bg-blue-500", 
      borderHover: "hover:border-blue-500", 
      bgIcon: "bg-blue-500/20", glow: "bg-blue-500/10",
      visible: true 
    },
    { 
      title: "Pendências",
      icon: Siren, // Ícone de Alerta
      action: irParaPendencias, // Ação personalizada
      desc: "Lojas com 'Não OK'",
      color: "text-red-400", 
      bgHover: "group-hover:bg-red-600", 
      borderHover: "hover:border-red-600", 
      bgIcon: "bg-red-500/20", glow: "bg-red-500/10",
      visible: true // Todos podem ver o que está ruim
    },
    { 
      title: "HACCP", 
      icon: ShieldAlert, 
      path: "/haccp", 
      desc: "Segurança alimentar",
      color: "text-orange-400", 
      bgHover: "group-hover:bg-orange-500", 
      borderHover: "hover:border-orange-500", 
      bgIcon: "bg-orange-500/20", glow: "bg-orange-500/10",
      visible: canViewAll 
    },
    { 
      title: "Coleta VISA", 
      icon: TestTube, 
      path: "/visa", 
      desc: "Resultados laboratoriais",
      color: "text-green-400", 
      bgHover: "group-hover:bg-green-500", 
      borderHover: "hover:border-green-500", 
      bgIcon: "bg-green-500/20", glow: "bg-green-500/10",
      visible: canViewAll 
    },
    {
      title: "Gestão de Usuários",
      icon: Users,
      path: "/admin-users",
      desc: "Criar e editar acessos",
      color: "text-purple-400",
      bgHover: "group-hover:bg-purple-500",
      borderHover: "hover:border-purple-500",
      bgIcon: "bg-purple-500/20", glow: "bg-purple-500/10",
      visible: isAdmin 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">QualiView</h1>
              <p className="text-xs text-slate-500">Sistema Integrado</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.filter(i => i.visible).map((item, idx) => (
              <button 
                key={idx} 
                onClick={item.action ? item.action : () => navigate(item.path)} 
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group"
              >
                <item.icon size={20} className={`transition-colors ${item.color}`} />
                <span className="font-medium">{item.title}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium truncate w-32">{user?.username}</p>
                <p className="text-[10px] text-slate-500 uppercase">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950 relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
          <div className="flex items-center gap-3"><img src={logo} alt="Logo" className="w-8 h-8" /><span className="font-bold">QualiView</span></div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-300"><Menu size={24} /></button>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Painel de Controle</h2>
            <p className="text-slate-400">Bem-vindo, {user?.username}. Selecione um módulo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.filter(i => i.visible).map((item, idx) => (
              <div 
                key={idx} 
                onClick={item.action ? item.action : () => navigate(item.path)} 
                className={`bg-slate-900/50 p-6 rounded-2xl border border-slate-800 ${item.borderHover} hover:bg-slate-800/80 cursor-pointer transition-all group relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${item.glow} rounded-full -mr-10 -mt-10 blur-2xl transition-all`}></div>
                <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700 ${item.bgIcon} group-hover:shadow-lg transition-all`}>
                  <item.icon className={`${item.color} group-hover:text-white transition-colors`} size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 group-hover:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* UPLOAD - SOMENTE ADMIN */}
          {isAdmin && (
            <div className="mt-12">
              <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 p-8 rounded-3xl border border-blue-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-blue-100 mb-2">Administração de Dados</h3>
                  <p className="text-blue-200/60 mb-6 text-sm max-w-md">Atualizar planilha consolidada.</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx" className="hidden" />
                      <button onClick={triggerFileInput} disabled={uploading} className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {uploading ? "Enviando..." : "Fazer Upload"}
                      </button>
                    </div>
                    {uploadMsg && (
                      <div className={`flex items-center gap-2 text-sm p-3 rounded-lg max-w-md ${uploadMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {uploadMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {uploadMsg.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}