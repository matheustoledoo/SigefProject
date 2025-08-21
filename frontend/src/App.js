// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import Upload from "./components/Upload";
import IntervalRow from "./components/IntervalRow";
import Search from "./components/Search";
import PointInfo from "./components/PointInfo";
import CertificateDetail from "./components/CertificateDetail";
import API from "./api";
import Login from "./Login";

export default function App() {
  const prefixes = ["D5Y-M", "D5Y-P", "D5Y-V"];
  const [stats, setStats] = useState(null);
  const [intervals, setIntervals] = useState({});
  const [pointResult, setPointResult] = useState(null);
  const [certResult, setCertResult] = useState(null);
  const [certList, setCertList] = useState(null);
  const [expandedCerts, setExpandedCerts] = useState({});
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("token"));

  const fetchStats = useCallback(async () => {
    try {
      const r = await API.get("/stats");
      setStats(r.data);
    } catch {}
  }, []);

  const fetchIntervals = useCallback(async () => {
    const res = {};
    for (const p of prefixes) {
      try {
        const r = await API.get(`/intervals/${p}`);
        res[p] = r.data;
      } catch {
        res[p] = null;
      }
    }
    setIntervals(res);
  }, []);

  useEffect(() => {
if (authed) {
      fetchStats();
      fetchIntervals();
    }
  }, [authed, fetchStats, fetchIntervals]);

  const handleUploaded = async () => {
    setPointResult(null);
    setCertResult(null);
    setCertList(null);
    await Promise.all([fetchStats(), fetchIntervals()]);
  };

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
  };

  return (
    <div className="container">
      <header>
        <h1>SIGEF Manager</h1>
        <button onClick={handleLogout}>Sair</button>
      </header>

      <Upload onUploaded={handleUploaded} />

      <div style={{ margin: "16px 0" }}>
        <strong>Número de certificados:</strong>{" "}
        {stats?.total_certificados ?? stats?.certificates_count ?? 0}
      </div>

      <div>
        {prefixes.map((p) =>
          intervals[p] ? (
            <IntervalRow
              key={p}
              prefix={p}
              missingIntervals={intervals[p].missing_intervals}
              currentInterval={intervals[p].current_interval}
              nextInterval={intervals[p].next_interval}
            />
          ) : null
        )}
      </div>

      <Search
        onPoint={(data) => {
          setPointResult(data);
          setCertResult(null);
          setCertList(null);
        }}
        onCertification={(data) => {
          setCertResult(data);
          setPointResult(null);
          setCertList(null);
           }}
        onAll={(data) => {
          if (data) {
            setCertList(data.certificates || []);
            setExpandedCerts({});
          } else {
            setCertList(null);
            setExpandedCerts({});
          }
          setPointResult(null);
          setCertResult(null);
        }}
        allVisible={!!certList}
      />

      {pointResult && <PointInfo data={pointResult} />}
      {certResult && <CertificateDetail data={certResult} />}
 {certList &&
  certList.map((c) => {
    const id = c.certificate?.certification_id;
    const expanded = !!expandedCerts[id];

    const cardStyle = {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "14px 16px",
      boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      marginBottom: 12,
    };

    const toggleStyle = {
      cursor: "pointer",
      textDecoration: "none",
      color: "#111827",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    };

    const titleWrapStyle = {
      display: "flex",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: 10,
    };

    const idStyle = {
      fontWeight: 700,
      fontSize: "16px",
      letterSpacing: ".2px",
    };

    const metaStyle = {
      color: "#6b7280",
      fontSize: "14px",
    };

    const chevronStyle = {
      width: 18,
      height: 18,
      transition: "transform .2s ease, opacity .2s",
      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      opacity: expanded ? 1 : 0.8,
      flexShrink: 0,
    };

    const bodyStyle = {
      borderTop: "1px dashed #e5e7eb",
      marginTop: 12,
      paddingTop: 12,
    };

    return (
      <div key={id} style={cardStyle}>
        <div
          style={toggleStyle}
          onClick={() =>
            setExpandedCerts((prev) => ({ ...prev, [id]: !prev[id] }))
          }
          aria-expanded={expanded}
          aria-controls={`cert-body-${id}`}
        >
          <div style={titleWrapStyle}>
            <span style={idStyle}>{id}</span>
            {c.certificate?.["denominação"] && (
              <span style={metaStyle}>{c.certificate["denominação"]}</span>
            )}
          </div>
          <svg
            style={chevronStyle}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {expanded && (
          <div id={`cert-body-${id}`} style={bodyStyle}>
            <CertificateDetail data={c} />
          </div>
        )}
      </div>
    );
  })}
    </div>
  );
}
