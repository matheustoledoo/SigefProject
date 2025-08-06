// src/components/CertificateDetail.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api";

export default function CertificateDetail({ data: propData }) {
  // extrai o objeto certificate e o array points, se vierem inline
  const inlineCert   = propData?.certificate;
  const inlinePoints = propData?.points || [];

  // para rota
  const { id: routeId } = useParams();
  const certId = inlineCert?.certification_id ?? routeId;

  // estados
  const [cert,   setCert]   = useState(inlineCert   || null);
  const [points, setPoints] = useState(inlinePoints || []);
  const [err,    setErr]    = useState(false);

  useEffect(() => {
    // se já veio via prop, não refaz fetch
    if (inlineCert) return;

    API.get(`/search/certification/${certId}`)
      .then((r) => {
        setCert(r.data.certificate);
        setPoints(r.data.points || []);
      })
      .catch(() => setErr(true));
  }, [certId, inlineCert]);

  if (err)   return <p>Certificação não encontrada.</p>;
  if (!cert) return <p>Carregando...</p>;

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <h2>Detalhes da Certificação</h2>

      <p><strong>ID:</strong> {cert.certification_id}</p>
      <p><strong>Denominação:</strong> {cert["denominação"]}</p>
      <p><strong>Proprietário(a):</strong> {cert.proprietario}</p>
      <p><strong>Matrícula:</strong> {cert.matricula_imovel}</p>
      <p><strong>Natureza:</strong> {cert.natureza_area}</p>
      <p><strong>CNPJ:</strong> {cert.cnpj}</p>
      <p><strong>Município/UF:</strong> {cert.municipio_uf}</p>
      <p><strong>Código INCRA/SNCR:</strong> {cert.codigo_incra}</p>
      <p><strong>Responsável Técnico:</strong> {cert.responsavel_tecnico}</p>
      <p><strong>Formação:</strong> {cert.formacao}</p>
      <p><strong>Cód. credenciamento:</strong> {cert.codigo_credenciamento}</p>
      <p><strong>Sis. Geodésico ref.:</strong> {cert.sistema_geodesico}</p>
      <p><strong>Doc. RT:</strong> {cert.documento_rt}</p>
      <p><strong>Área (local):</strong> {cert.area_local}</p>
      <p><strong>Perímetro:</strong> {cert.perimetro}</p>
      <p><strong>Azimutes:</strong> {cert.azimutes}</p>
      <p><strong>Data Certif.:</strong> {cert.data_certificacao}</p>
      <p><strong>Data Geração:</strong> {cert.data_geracao}</p>

      <h3 style={{ marginTop: 24 }}>Pontos Associados</h3>
      {points.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {points.map((pt) => (
            <li key={pt.code} style={{ marginBottom: 8 }}>
              <strong>{pt.code}</strong>{" "}
            </li>
          ))}
        </ul>
      ) : (
        <p>Não há pontos cadastrados para esta certificação.</p>
      )}

      {/* botão “voltar” só em modo rota */}
      {!inlineCert && (
        <Link to="/certificates">
          <button style={{ marginTop: 16 }}>Voltar à lista</button>
        </Link>
      )}
    </div>
  );
}
