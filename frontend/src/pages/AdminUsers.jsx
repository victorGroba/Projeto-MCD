import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { Trash2, UserPlus, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "operacional" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Erro ao buscar usuários", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await api.post("/users", newUser);
      setMsg("Usuário criado com sucesso!");
      setNewUser({ username: "", password: "", role: "operacional" });
      fetchUsers();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${username}?`)) return;
    try {
      await api.delete(`/users/${username}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-800 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="text-purple-500" /> Gestão de Usuários
            </h1>
            <p className="text-slate-400 text-sm">Controle de acesso ao sistema</p>
          </div>
        </div>

        {/* Formuário de Criação */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">Adicionar Novo Usuário</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Usuário</label>
              <input 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Senha</label>
              <input 
                required
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Perfil (Role)</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="operacional">Operacional (Apenas Potabilidade)</option>
                <option value="gerente_geral">Gerente Geral (Acesso Total)</option>
                <option value="admin_mattos">Admin LabMattos (Gestão Total)</option>
              </select>
            </div>
            <button 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <UserPlus size={16} /> Criar
            </button>
          </form>
          {msg && <p className="mt-3 text-sm text-green-400">{msg}</p>}
        </div>

        {/* Lista de Usuários */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-white">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${
                      u.role === 'admin_mattos' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' :
                      u.role === 'gerente_geral' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                      'border-slate-500/30 bg-slate-500/10 text-slate-400'
                    }`}>
                      {u.role === 'admin_mattos' ? 'Administrador' : u.role === 'gerente_geral' ? 'Gerente' : 'Operacional'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.username !== "labmattos" && (
                      <button 
                        onClick={() => handleDelete(u.username)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}