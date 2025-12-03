import { createContext, useState, useContext } from "react";
import { auth } from "@/store/auth"; 
import { api } from "@/api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Inicializa o estado lendo do LocalStorage
  const [user, setUser] = useState(() => {
    const token = auth.getToken();
    const savedUser = auth.getUser();
    
    // Se tiver token e dados salvos, restaura a sessão completa
    if (token && savedUser) {
      return { ...savedUser, token, logged: true };
    }
    // Se tiver só o token (legado), restaura sessão parcial
    if (token) {
      return { logged: true, token };
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    setLoading(true);
    try {
      const response = await api.post("/login", { username, password });
      
      // O backend deve retornar: { access_token, role, username }
      const { access_token, role, username: returnedUser } = response.data;

      if (access_token) {
        console.log("✅ [AuthContext] Login sucesso! Cargo:", role);
        
        const userData = { 
          username: returnedUser || username, 
          role: role 
        };

        // 1. Salva no Storage (Persistência)
        auth.login(access_token, userData);
        
        // 2. Atualiza Estado (Reatividade)
        setUser({ ...userData, token: access_token, logged: true });
        
        return { success: true };
      } else {
        return { success: false, message: "Erro: Servidor não enviou token." };
      }

    } catch (error) {
      console.error("Erro no login:", error);
      const msg = error.response?.data?.msg || "Usuário ou senha incorretos.";
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    auth.logout();
    setUser(null);
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