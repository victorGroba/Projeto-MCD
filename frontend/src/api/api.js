import axios from "axios";
import { auth } from "../store/auth";

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Interceptor: Antes de enviar, cola o token no cabeçalho
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  
  // --- DEBUG DO TOKEN ---
  console.log("⚡ [API] Tentando anexar token. Valor encontrado:", token);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ [API] Requisição enviada SEM token!");
  }
  return config;
});