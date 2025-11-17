import { api } from "./api";

export async function loginRequest(username, password) {
  const res = await api.post("/auth/login", {
    username,
    password,
  });
  return res.data;
}
