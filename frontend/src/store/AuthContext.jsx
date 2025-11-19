import { createContext, useState, useContext, useEffect } from "react";
import { auth } from "./auth"; // Importa o gerenciador de localStorage
import { api } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // CORREÇÃO AQUI: Recuperamos o token real do disco ao iniciar
  const [user, setUser] = useState(() => {
    const token = auth.getToken(); // Pega a string do token
    // Se tiver token, recria o objeto de usuário completo
    return token ? { logged: true, token: token } : null;
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
        
        // 3. SALVA NO DISCO
        auth.login(access_token);
        
        // 4. Atualiza o estado do React (incluindo o token!)
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
      token: user?.token, // Agora isso sempre terá valor se estiver logado
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