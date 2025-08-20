// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import Upload from "./components/Upload";
import IntervalRow from "./components/IntervalRow";
import Search from "./components/Search";
import PointInfo from "./components/PointInfo";
import CertificateDetail from "./components/CertificateDetail";
import API from "./api";

export default function App() {
  const prefixes = ["D5Y-M", "D5Y-P", "D5Y-V"];
  const [stats, setStats] = useState(null);
  const [intervals, setIntervals] = useState({});
  const [pointResult, setPointResult] = useState(null);
  const [certResult, setCertResult] = useState(null);
  const [certList, setCertList] = useState(null);
  const [expandedCerts, setExpandedCerts] = useState({});

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
    fetchStats();
    fetchIntervals();
  }, [fetchStats, fetchIntervals]);

  const handleUploaded = async () => {
    setPointResult(null);
    setCertResult(null);
    setCertList(null);
    await Promise.all([fetchStats(), fetchIntervals()]);
  };

  return (
    <div className="container">
      <header>
        <h1>SIGEF Manager</h1>
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
          const id = c.certificate.certification_id;
          const expanded = expandedCerts[id];
          return (
            <div key={id} style={{ marginBottom: 8 }}>
              <div
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  color: "#007bff",
                }}
                onClick={() =>
                  setExpandedCerts((prev) => ({ ...prev, [id]: !prev[id] }))
                }
              >
                {id}
              </div>
              {expanded && <CertificateDetail data={c} />}
            </div>
          );
        })}
    </div>
  );
}
