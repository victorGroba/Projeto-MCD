import { createContext, useContext, useState, useEffect } from "react";
import { auth as authStore } from "./auth"; 
import { loginRequest } from "../api/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(authStore.getToken());
  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    setLoading(true);
    try {
      const res = await loginRequest(username, password);
      authStore.login(res.token);
      setToken(res.token);
      return { success: true };
    } catch (err) {
      return { success: false, message: "Credenciais inválidas" };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authStore.logout();
    setToken(null);
  }

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
