import React, { useState, useMemo, useCallback } from "react";
import { showToast } from "../toast"; // precisa existir conforme abaixo

export default function IntervalRow({
  prefix,
  missingIntervals = [],
  currentInterval,
  nextInterval,
}) {
  const findInitialIndex = () => {
    if (!currentInterval || !currentInterval.from) return -1;
    const idx = missingIntervals.findIndex(
      (m) => m.from === currentInterval.from && m.to === currentInterval.to
    );
    return idx >= 0 ? idx : -1;
  };

  const initialIndex = findInitialIndex();
  const [activeGapIndex, setActiveGapIndex] = useState(initialIndex);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [history, setHistory] = useState([initialIndex]);
  const [historyPos, setHistoryPos] = useState(0);

  const pushHistory = useCallback(
    (newIndex) => {
      const newHist = history.slice(0, historyPos + 1);
      newHist.push(newIndex);
      setHistory(newHist);
      setHistoryPos(newHist.length - 1);
    },
    [history, historyPos]
  );

  const setActive = (idx) => {
    setActiveGapIndex(idx);
    pushHistory(idx);
    setShowAll(false);
  };

  const goPrevHistory = () => {
    if (historyPos - 1 >= 0) {
      setHistoryPos((pos) => pos - 1);
      setActiveGapIndex(history[historyPos - 1]);
      setShowAll(false);
    }
  };

  const reset = () => {
    setActiveGapIndex(initialIndex);
    setHistory([initialIndex]);
    setHistoryPos(0);
    setShowAll(false);
  };

  const activeInterval = useMemo(() => {
    if (activeGapIndex === -1) {
      return currentInterval || {};
    }
    return missingIntervals[activeGapIndex] || currentInterval || {};
  }, [activeGapIndex, missingIntervals, currentInterval]);

  const isSuggested =
    activeGapIndex === -1 ||
    (currentInterval &&
      activeInterval &&
      !missingIntervals.some(
        (m) => m.from === activeInterval.from && m.to === activeInterval.to
      ));

  const computeHasNext = () => {
    if (activeGapIndex === -1) return missingIntervals.length > 0;
    return activeGapIndex + 1 < missingIntervals.length;
  };

  const computeHasPrev = () => {
    return historyPos > 0;
  };

  const handleNext = () => {
    if (activeGapIndex === -1) {
      if (missingIntervals.length > 0) setActive(0);
    } else if (activeGapIndex + 1 < missingIntervals.length) {
      setActive(activeGapIndex + 1);
    }
  };

  const handlePrev = () => {
    if (computeHasPrev()) {
      goPrevHistory();
    }
  };

  const extractNumber = (code) => {
    if (!code) return NaN;
    const parts = code.split("-");
    const last = parts[parts.length - 1];
    return parseInt(last, 10);
  };

  const generateCodes = (from, to) => {
    if (!from || !to) return [];
    const a = extractNumber(from);
    const b = extractNumber(to);
    if (isNaN(a) || isNaN(b) || b < a) return [];
    const codes = [];
    for (let i = a; i <= b; i++) {
      codes.push(`${prefix}-${String(i).padStart(4, "0")}`);
    }
    return codes;
  };

  const handleCopyActive = () => {
    const codes = generateCodes(activeInterval?.from, activeInterval?.to).join("\n");
    navigator.clipboard.writeText(codes);
    showToast("Intervalo ativo copiado!");
  };

  const handleCopyGap = (from, to) => {
    const codes = generateCodes(from, to).join("\n");
    navigator.clipboard.writeText(codes);
    showToast("Códigos do gap copiados!");
  };

  const activeCodes = useMemo(
    () => generateCodes(activeInterval?.from, activeInterval?.to),
    [activeInterval, prefix]
  );
  const tooBig = activeCodes.length > 500;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 12,
        marginBottom: 12,
        borderRadius: 6,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <strong>{prefix}</strong> disponíveis: {activeInterval?.from || "—"} até {activeInterval?.to || "—"}{" "}
          {isSuggested && (
            <em style={{ marginLeft: 4, fontStyle: "normal", color: "#555" }}>
              (próximo disponível)
            </em>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={handlePrev} disabled={!computeHasPrev()} style={{ padding: "6px 10px" }}>
            Voltar
          </button>
          {computeHasNext() && (
            <button onClick={handleNext} style={{ padding: "6px 10px" }}>
              Próximo
            </button>
          )}
          <button onClick={reset} style={{ padding: "6px 10px" }}>
            Reset
          </button>
          <button onClick={() => setExpanded((e) => !e)} style={{ padding: "6px 10px" }}>
            {expanded ? "Ocultar" : "Expandir"}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 10,
            background: "#f2f8ff",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #cddce7",
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <div>
              <strong>Gaps reais:</strong>{" "}
              {missingIntervals.length === 0 && (
                <span style={{ fontStyle: "italic" }}>Nenhum gap real.</span>
              )}
            </div>
            {missingIntervals.map((g, idx) => (
              <div
                key={`${g.from}-${g.to}`}
                style={{
                  padding: 8,
                  marginTop: 6,
                  background: activeGapIndex === idx ? "#d8eaff" : "#fff",
                  border: "1px solid #c0cdd8",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  {g.from} até {g.to} {idx === 0 && <em>(current)</em>} {idx === 1 && <em>(next)</em>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setActive(idx)}>Usar</button>
                  <button onClick={() => handleCopyGap(g.from, g.to)}>Copiar</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <strong>Intervalo ativo:</strong>
              <button onClick={handleCopyActive} style={{ padding: "4px 10px" }}>
                Copiar tudo
              </button>
              {activeInterval?.from && activeInterval?.to && (
                <span style={{ fontSize: 12, color: "#555" }}>
                  ({activeCodes.length} códigos)
                </span>
              )}
            </div>



            {tooBig && !showAll ? (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontStyle: "italic" }}>
                  Intervalo com {activeCodes.length} códigos.{" "}
                  <button
                    onClick={() => setShowAll(true)}

                  >
                    Mostrar todos
                  </button>
                </div>
                <textarea
                  readOnly
                  style={{
                    width: "100%",
                    height: 100,
                    fontFamily: "monospace",
                    padding: 8,
                    borderRadius: 4,
                  }}
                  value={activeCodes.slice(0, 10).join("\n") + "\n..."}
                />
              </div>
            ) : (
              <textarea
                readOnly
                style={{
                  width: "100%",
                  height: 140,
                  fontFamily: "monospace",
                  padding: 8,
                  borderRadius: 4,
                  whiteSpace: "pre-wrap",
                }}
                value={activeCodes.join("\n")}
              />
            )}
            {tooBig && showAll && (
              <div style={{ marginTop: 4 }}>
                <button onClick={() => setShowAll(false)} style={{ padding: "4px 8px" }}>
                  Mostrar menos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
