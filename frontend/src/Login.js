import React, { useState } from "react";
import API from "./api";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await API.post("/register", { username, password });
      }
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);
      const r = await API.post("/login", params);
      localStorage.setItem("token", r.data.access_token);
      setError(null);
      onSuccess();
    } catch {
      setError("Falha na autenticação");
    }
  };

  return (
    <div className="container">
      <h2>{isRegister ? "Registrar" : "Login"}</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">
          {isRegister ? "Registrar" : "Entrar"}
        </button>
      </form>
      <button onClick={() => setIsRegister((v) => !v)}>
        {isRegister ? "Já possui conta? Entrar" : "Registrar"}
      </button>
    </div>
  );
}