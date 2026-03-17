import { useState, useEffect } from "react";
import { storeGet, storeSet } from "../store";

interface LogRow {
  id: string;
  date: string;
  fra: string;
  til: string;
  notat: string;
}

const STORE_KEY = "dagslogg-rows";

const NO_DAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
const NO_MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateNorwegian(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${NO_DAYS[date.getDay()]} ${d}. ${NO_MONTHS[m - 1]}`;
}

// Generate time options from 06:00 to 22:00 in 15 min steps
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break;
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

function formatRowAsText(row: LogRow): string {
  const dayLabel = formatDateNorwegian(row.date);
  const timeRange = `${row.fra || "—"} til ${row.til || "—"}`;
  const notat = row.notat.trim() ? ` — ${row.notat.trim()}` : "";
  return `${dayLabel} · ${timeRange}${notat}`;
}

export default function Dagslogg() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [generated, setGenerated] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    storeGet<LogRow[]>(STORE_KEY).then((data) => {
      if (data && Array.isArray(data)) {
        setRows(data);
      } else {
        setRows([{ id: uid(), date: todayStr(), fra: "09:00", til: "17:00", notat: "" }]);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      storeSet(STORE_KEY, rows);
    }
  }, [rows, loaded]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: uid(), date: todayStr(), fra: "09:00", til: "17:00", notat: "" },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof Omit<LogRow, "id">, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function genererOgKopier() {
    if (rows.length === 0) return;
    const text = rows.map(formatRowAsText).join("\n");
    setGenerated(text);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyGenerated() {
    if (!generated) return;
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!loaded) return <div style={s.loading}>Laster...</div>;

  return (
    <div style={s.root}>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Dato</th>
              <th style={s.th}>Fra</th>
              <th style={s.th}>Til</th>
              <th style={{ ...s.th, flex: 1 }}>Notat</th>
              <th style={{ ...s.th, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={s.tr}>
                <td style={s.td}>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, "date", e.target.value)}
                    style={s.dateInput}
                  />
                </td>
                <td style={s.td}>
                  <select
                    value={row.fra}
                    onChange={(e) => updateRow(row.id, "fra", e.target.value)}
                    style={s.select}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td style={s.td}>
                  <select
                    value={row.til}
                    onChange={(e) => updateRow(row.id, "til", e.target.value)}
                    style={s.select}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td style={{ ...s.td, width: "100%" }}>
                  <input
                    type="text"
                    value={row.notat}
                    placeholder="Notater..."
                    onChange={(e) => updateRow(row.id, "notat", e.target.value)}
                    style={s.notatInput}
                  />
                </td>
                <td style={s.td}>
                  <button
                    style={s.removeBtn}
                    onClick={() => removeRow(row.id)}
                    title="Fjern rad"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.actions}>
        <button style={s.addBtn} onClick={addRow}>
          + Legg til rad
        </button>
        <button style={s.genBtn} onClick={genererOgKopier}>
          Generer &amp; kopier
        </button>
      </div>

      {generated && (
        <div style={s.outputWrap}>
          <div style={s.outputHeader}>
            <span style={s.outputLabel}>Generert tekst</span>
            <button style={s.copyBtn} onClick={copyGenerated}>
              {copied ? "Kopiert!" : "Kopier"}
            </button>
          </div>
          <pre style={s.outputPre}>{generated}</pre>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 860,
  },
  loading: {
    color: "#444",
    fontSize: 13,
  },
  tableWrap: {
    border: "1px solid #161616",
    borderRadius: 6,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11,
    color: "#444",
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: "#0d0d0d",
    borderBottom: "1px solid #161616",
  },
  tr: {
    borderBottom: "1px solid #111",
  },
  td: {
    padding: "6px 12px",
    verticalAlign: "middle",
  },
  dateInput: {
    background: "transparent",
    border: "1px solid #1e1e1e",
    borderRadius: 3,
    color: "#e8e8e8",
    padding: "4px 8px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    width: 140,
  },
  select: {
    background: "#0d0d0d",
    border: "1px solid #1e1e1e",
    borderRadius: 3,
    color: "#e8e8e8",
    padding: "4px 8px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    width: 90,
    cursor: "pointer",
  },
  notatInput: {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #1a1a1a",
    color: "#e8e8e8",
    padding: "4px 0",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    width: "100%",
    minWidth: 200,
  },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#333",
    fontSize: 18,
    lineHeight: 1,
    padding: "0 4px",
    transition: "color 0.15s",
  },
  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  addBtn: {
    background: "transparent",
    border: "1px solid #222",
    color: "#555",
    padding: "8px 16px",
    fontSize: 12,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.15s, color 0.15s",
  },
  genBtn: {
    background: "#e8e8e8",
    border: "none",
    color: "#080808",
    padding: "8px 20px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.04em",
    transition: "background 0.15s",
  },
  outputWrap: {
    border: "1px solid #161616",
    borderRadius: 6,
    overflow: "hidden",
  },
  outputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#0d0d0d",
    borderBottom: "1px solid #161616",
  },
  outputLabel: {
    fontSize: 11,
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'DM Mono', monospace",
  },
  copyBtn: {
    background: "transparent",
    border: "1px solid #222",
    color: "#888",
    padding: "4px 12px",
    fontSize: 11,
    borderRadius: 3,
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.15s, color 0.15s",
  },
  outputPre: {
    padding: "14px",
    fontSize: 13,
    lineHeight: 1.7,
    color: "#c0c0c0",
    fontFamily: "'DM Mono', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#080808",
  },
};
