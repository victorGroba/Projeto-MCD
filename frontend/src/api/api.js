import axios from "axios";
import { auth } from "../store/auth";

export const api = axios.create({
  // EM PRODUÇÃO: Deixamos vazio.
  // O navegador vai usar o domínio atual (ex: https://mcd.qualigestor.online)
  // e o Nginx interno (configurado no nginx-frontend.conf) vai redirecionar
  // as chamadas para o backend corretamente.
  baseURL: "", 
});

// Interceptor: Antes de enviar, cola o token no cabeçalho
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  
  // --- DEBUG DO TOKEN ---
  // console.log("⚡ [API] Tentando anexar token. Valor encontrado:", token);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Em produção, logs excessivos podem poluir o console, mas pode manter se quiser debug
    // console.warn("⚠️ [API] Requisição enviada SEM token!");
  }
  return config;
});