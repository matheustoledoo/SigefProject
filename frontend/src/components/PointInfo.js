import React from "react";
import { showToast } from "../toast";

export default function PointInfo({ data }) {
  const { point, certificate } = data;

  const copiarCódigo = () => {
    navigator.clipboard.writeText(point.code);
    showToast("Código do ponto copiado!");
  };

  return (
    <div style={{ marginTop: 16, padding: 16, border: "1px solid #4a90e2", borderRadius: 6, background: "#f0f8ff" }}>
      <h3>Detalhes do Ponto</h3>
      <ul>
        <li>
          <strong>Código:</strong> {point.code}{" "}
          <button onClick={copiarCódigo} style={{ marginLeft: 8 }}>Copiar</button>
        </li>
        <li><strong>Prefixo:</strong> {point.prefix}</li>
        <li><strong>Número:</strong> {point.number}</li>
      </ul>

      <h4>Certificação Associada</h4>
      <ul>
        <li><strong>ID Certificação:</strong> {point.certificate_certification_id}</li>
        {/* adicione outros campos que queira exibir */}
      </ul>
    </div>
  );
}
