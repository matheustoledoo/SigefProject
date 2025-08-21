import React, { useState } from "react";
import API from "./api";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333'
        }}>Login</h2>
        {error && <div style={{
          color: 'red',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <input
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              ':focus': {
                borderColor: '#1877f2'
              }
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              ':focus': {
                borderColor: '#1877f2'
              }
            }}
          />
          <button type="submit" style={{
            padding: '0.75rem',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            ':hover': {
              backgroundColor: '#166fe5'
            }
          }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}