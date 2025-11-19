import { createContext, useState, useContext, useEffect } from "react";
import { auth } from "./auth"; // Importa o gerenciador de localStorage
import { api } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Ao carregar a página, verifica se já existe um token salvo no disco
  const [user, setUser] = useState(() => {
    return auth.isAuthenticated() ? { logged: true } : null;
  });
  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    setLoading(true);
    try {
      // 1. Envia usuário/senha para o Backend
      const response = await api.post("/login", { username, password });
      
      // 2. Recebe o token
      const { access_token, role } = response.data;

      if (access_token) {
        console.log("✅ [AuthContext] Token recebido! Salvando...");
        
        // 3. SALVA NO DISCO (Isso faltava no seu código antigo!)
        auth.login(access_token);
        
        // 4. Atualiza o estado do React para liberar o acesso imediato
        setUser({ username, role, token: access_token });
        
        return { success: true };
      } else {
        return { success: false, message: "Erro: Servidor não enviou token." };
      }

    } catch (error) {
      console.error("Erro no login:", error);
      return { 
        success: false, 
        message: "Usuário ou senha incorretos." 
      };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    auth.logout(); // Limpa do disco
    setUser(null); // Limpa da memória
  }

  return (
    <AuthContext.Provider value={{ 
  user, 
  token: user?.token,
  login, 
  logout, 
  loading, 
  isAuthenticated: !!user 
}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}