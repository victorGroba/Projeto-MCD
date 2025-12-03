const TOKEN_KEY = "mcd_token";
const USER_KEY = "mcd_user"; // Chave para salvar dados do usuário (role, username)

export const auth = {
  // Salva Token e Dados do Usuário
  login(token, userData) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    console.log(`[AUTH] Login salvo. Token: ${token.substring(0, 10)}...`);
  },

  // Limpa tudo no Logout
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Recupera o objeto do usuário (para persistir o cargo no F5)
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Erro ao ler usuário do cache:", e);
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};