// src/api.js
import axios from "axios";

// Em produção (Railway, mesmo domínio do backend) usamos /api.
// Em desenvolvimento, se você rodar o frontend em 3000 e o backend em 8080,
const baseURL =
  process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== ""
    ? process.env.REACT_APP_API_URL
    : "/api";

const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default API;
