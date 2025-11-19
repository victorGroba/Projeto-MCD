const TOKEN_KEY = "mcd_token"; // <--- Chave unificada

export const auth = {
  login(token) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    console.log(`[AUTH] Token salvo em '${TOKEN_KEY}':`, token.substring(0, 10) + "...");
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }
};