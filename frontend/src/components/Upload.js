import React, { useState } from "react";
import API from "../api";

export default function Upload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setLoading(true);
    try {
      const res = await API.post("/upload-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro no upload");
    } finally {
      setLoading(false);
      setFile(null);
      // opcional: limpar o input
      document.getElementById("file-input").value = "";
    }
  };

  return (
    <div className="card upload-form">
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleChange}
      />
      <button
        className="upload-button"
        disabled={!file || loading}
        onClick={handleUpload}
      >
        {loading ? "Enviando…" : "Enviar PDF"}
      </button>
    </div>
  );
}
