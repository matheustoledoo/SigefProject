// src/components/Search.js
import React, { useState } from "react";
import API from "../api";
import { showToast } from "../toast";

export default function Search({ onPoint, onCertification, onAll }) {
  const [point, setPoint] = useState("");
  const [cert, setCert] = useState("");

  const buscarPonto = async () => {
    if (!point) return;
    try {
      const res = await API.get(`/search/point/${encodeURIComponent(point)}`);
      console.log("Busca Point – res.data:", res.data);
      onPoint(res.data);
    } catch (e) {
      showToast(e.response?.data?.detail || "Ponto não encontrado");
    }
  };

  const buscarCert = async () => {
    if (!cert) return;
    try {
      const res = await API.get(
        `/search/certification/${encodeURIComponent(cert)}`
      );
      console.log("Busca Certification – res.data:", res.data);
      onCertification(res.data);
    } catch (e) {
      showToast(e.response?.data?.detail || "Certificação não encontrada");
    }
  };

  const buscarTodos = async () => {
    try {
      const res = await API.get("/search/certification/all");
      console.log("Busca Todos – res.data:", res.data);
      onAll(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.detail || "Erro ao buscar certificações"
      );
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 6,
      }}
    >
      <h2>Pesquisar</h2>
      <div style={{ marginBottom: 8 }}>
        <input
          style={{ width: 240, padding: 6 }}
          placeholder="Buscar ponto (ex: D5Y-M-0001)"
          value={point}
          onChange={(e) => setPoint(e.target.value)}
        />
        <button
          onClick={buscarPonto}
          style={{ marginLeft: 8, padding: "6px 12px" }}
        >
          Buscar ponto
        </button>
      </div>
      <div>
        <input
          style={{ width: 240, padding: 6 }}
          placeholder="Buscar certificação (ID)"
          value={cert}
          onChange={(e) => setCert(e.target.value)}
        />
        <button
          onClick={buscarCert}
          style={{ marginLeft: 8, padding: "6px 12px" }}
        >
          Buscar certificação
        </button>
        <button
          onClick={buscarTodos}
          style={{ marginLeft: 8, padding: "6px 12px" }}
        >
          Todos certificados
        </button>
      </div>
    </div>
  );
}
