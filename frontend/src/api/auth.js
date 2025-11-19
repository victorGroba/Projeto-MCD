import { api } from "./api";

export async function loginRequest(username, password) {
  const res = await api.post("/login", { username, password });
  return res.data; // deve conter { token }
}
