import axios from "./axios"; // ✅ use axios instance

export const getMe = async () => {
  const res = await axios.get("/auth/me");
  return res.data;
};

export const login = async (data: { email: string; password: string }) => {
  const res = await axios.post("/auth/login", data);
  return res.data;
};

export const logout = async () => {
  const res = await axios.post("/auth/logout");
  return res.data;
};