import axios from "axios";
import { auth } from "../store/auth";

export const api = axios.create({
  baseURL: "http://localhost:5000",
});

// intercepta requisições e adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
