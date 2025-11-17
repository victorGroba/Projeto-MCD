export const auth = {
  login(token) {
    localStorage.setItem("token", token);
  },

  logout() {
    localStorage.removeItem("token");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isLogged() {
    return !!localStorage.getItem("token");
  }
};
