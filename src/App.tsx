import { useState } from "react";
import TodoList from "./components/TodoList";
import Dagslogg from "./components/Dagslogg";
import { storeDelete } from "./store";

type Tab = "todo" | "dagslogg";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("todo");
  const [resetKey, setResetKey] = useState(0);

  async function handleReset() {
    const confirmed = window.confirm(
      activeTab === "todo"
        ? "Nullstill alle todos?"
        : "Nullstill alle dagslogg-rader?"
    );
    if (!confirmed) return;
    const key = activeTab === "todo" ? "todo-days" : "dagslogg-rows";
    await storeDelete(key);
    setResetKey((k) => k + 1);
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.brand}>Studio Wallin</span>
          <h1 style={styles.title}>Produktivitetsverktøy</h1>
        </div>
        <button style={styles.resetBtn} onClick={handleReset}>
          Nullstill
        </button>
      </header>

      <nav style={styles.tabBar}>
        {(["todo", "dagslogg"] as Tab[]).map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "todo" ? "Todo" : "Dagslogg"}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === "todo" ? (
          <TodoList key={resetKey} />
        ) : (
          <Dagslogg key={resetKey} />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#080808",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px 16px",
    borderBottom: "1px solid #161616",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  brand: {
    fontSize: 11,
    letterSpacing: "0.12em",
    color: "#444",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e8e8e8",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "-0.01em",
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid #222",
    color: "#555",
    padding: "6px 14px",
    fontSize: 12,
    borderRadius: 4,
    transition: "border-color 0.15s, color 0.15s",
    fontFamily: "'DM Mono', monospace",
  },
  tabBar: {
    display: "flex",
    gap: 0,
    padding: "0 32px",
    borderBottom: "1px solid #161616",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#444",
    padding: "12px 20px",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.04em",
    transition: "color 0.15s, border-color 0.15s",
    marginBottom: -1,
  },
  tabBtnActive: {
    color: "#e8e8e8",
    borderBottom: "2px solid #e8e8e8",
  },
  main: {
    flex: 1,
    padding: "28px 32px",
    overflowY: "auto",
  },
};
