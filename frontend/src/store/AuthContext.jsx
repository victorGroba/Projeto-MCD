import { createContext, useState, useContext, useEffect } from "react";
import { auth } from "@/store/auth"; // Importa o gerenciador de localStorage
import { api } from "@/api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = auth.getToken();
    return token ? { logged: true, token: token } : null;
  });
  
  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    setLoading(true);
    try {
      const response = await api.post("/login", { username, password });
      const { access_token, role } = response.data;

      if (access_token) {
        console.log("✅ [AuthContext] Token recebido! Salvando...");
        auth.login(access_token);
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