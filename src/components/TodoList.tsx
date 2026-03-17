import { useState, useEffect, useRef } from "react";
import { storeGet, storeSet } from "../store";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface DayEntry {
  id: string;
  date: string; // YYYY-MM-DD
  tasks: Task[];
}

const STORE_KEY = "todo-days";

const NO_DAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
const NO_MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "Ingen dato";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${NO_DAYS[date.getDay()]} ${d}. ${NO_MONTHS[m - 1]}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TodoList() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  // track new task input per day
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    storeGet<DayEntry[]>(STORE_KEY).then((data) => {
      if (data && Array.isArray(data)) {
        setDays(data);
      } else {
        // default: one day entry for today
        setDays([{ id: uid(), date: todayStr(), tasks: [] }]);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      storeSet(STORE_KEY, days);
    }
  }, [days, loaded]);

  const totalTasks = days.reduce((s, d) => s + d.tasks.length, 0);
  const doneTasks = days.reduce((s, d) => s + d.tasks.filter((t) => t.done).length, 0);
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  function addDay() {
    setDays((prev) => [...prev, { id: uid(), date: todayStr(), tasks: [] }]);
  }

  function removeDay(dayId: string) {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
  }

  function updateDate(dayId: string, date: string) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, date } : d)));
  }

  function toggleTask(dayId: string, taskId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              tasks: d.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : d
      )
    );
  }

  function addTask(dayId: string) {
    const text = (newTaskText[dayId] ?? "").trim();
    if (!text) return;
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, tasks: [...d.tasks, { id: uid(), text, done: false }] }
          : d
      )
    );
    setNewTaskText((prev) => ({ ...prev, [dayId]: "" }));
  }

  function removeTask(dayId: string, taskId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) }
          : d
      )
    );
  }

  function handleTaskKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    dayId: string
  ) {
    if (e.key === "Enter") {
      addTask(dayId);
    }
  }

  function handleNewTaskKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    dayId: string,
    taskId: string,
    currentText: string
  ) {
    if (e.key === "Backspace" && currentText === "") {
      removeTask(dayId, taskId);
    }
  }

  function updateTaskText(dayId: string, taskId: string, text: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              tasks: d.tasks.map((t) =>
                t.id === taskId ? { ...t, text } : t
              ),
            }
          : d
      )
    );
  }

  if (!loaded) return <div style={s.loading}>Laster...</div>;

  return (
    <div style={s.root}>
      {/* Progress bar */}
      <div style={s.progressWrap}>
        <div style={s.progressMeta}>
          <span style={s.progressLabel}>
            {doneTasks} / {totalTasks} oppgaver fullført
          </span>
          <span style={s.progressPct}>{progress}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${progress}%` }} />
        </div>
      </div>

      {/* Day entries */}
      <div style={s.dayList}>
        {days.map((day) => (
          <div key={day.id} style={s.dayCard}>
            {/* Day header */}
            <div style={s.dayHeader}>
              <div style={s.dayHeaderLeft}>
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDate(day.id, e.target.value)}
                  style={s.dateInput}
                />
                <span style={s.dayName}>{formatDate(day.date)}</span>
              </div>
              <button
                style={s.removeDayBtn}
                onClick={() => removeDay(day.id)}
                title="Fjern dag"
              >
                ×
              </button>
            </div>

            {/* Tasks */}
            <div style={s.taskList}>
              {day.tasks.map((task) => (
                <div key={task.id} style={s.taskRow}>
                  <button
                    style={{
                      ...s.checkbox,
                      ...(task.done ? s.checkboxDone : {}),
                    }}
                    onClick={() => toggleTask(day.id, task.id)}
                    title={task.done ? "Merk som ikke gjort" : "Merk som gjort"}
                  >
                    {task.done && <span style={s.checkmark}>✓</span>}
                  </button>
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) =>
                      updateTaskText(day.id, task.id, e.target.value)
                    }
                    onKeyDown={(e) =>
                      handleNewTaskKeyDown(e, day.id, task.id, task.text)
                    }
                    style={{
                      ...s.taskInput,
                      ...(task.done ? s.taskInputDone : {}),
                    }}
                  />
                  <button
                    style={s.removeTaskBtn}
                    onClick={() => removeTask(day.id, task.id)}
                    title="Fjern oppgave"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* New task input */}
              <div style={s.taskRow}>
                <div style={s.checkboxPlaceholder} />
                <input
                  type="text"
                  placeholder="+ Ny oppgave (Enter)"
                  value={newTaskText[day.id] ?? ""}
                  onChange={(e) =>
                    setNewTaskText((prev) => ({
                      ...prev,
                      [day.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => handleTaskKeyDown(e, day.id)}
                  ref={(el) => {
                    inputRefs.current[day.id] = el;
                  }}
                  style={s.newTaskInput}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={s.addDayBtn} onClick={addDay}>
        + Legg til dag
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    maxWidth: 680,
  },
  loading: {
    color: "#444",
    fontSize: 13,
  },
  progressWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 11,
    color: "#555",
    fontFamily: "'DM Mono', monospace",
  },
  progressPct: {
    fontSize: 11,
    color: "#444",
    fontFamily: "'DM Mono', monospace",
  },
  progressTrack: {
    height: 2,
    background: "#161616",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "#e8e8e8",
    borderRadius: 1,
    transition: "width 0.3s ease",
  },
  dayList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  dayCard: {
    border: "1px solid #161616",
    borderRadius: 6,
    overflow: "hidden",
  },
  dayHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "#0d0d0d",
    borderBottom: "1px solid #161616",
  },
  dayHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dateInput: {
    background: "transparent",
    border: "1px solid #222",
    borderRadius: 3,
    color: "#e8e8e8",
    padding: "3px 7px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
  },
  dayName: {
    fontSize: 13,
    color: "#888",
    fontFamily: "'DM Mono', monospace",
  },
  removeDayBtn: {
    background: "transparent",
    border: "none",
    color: "#333",
    fontSize: 18,
    lineHeight: 1,
    padding: "0 4px",
    transition: "color 0.15s",
  },
  taskList: {
    padding: "8px 14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 0,
    transition: "border-color 0.15s, background 0.15s",
  },
  checkboxDone: {
    background: "#e8e8e8",
    borderColor: "#e8e8e8",
  },
  checkmark: {
    fontSize: 10,
    color: "#080808",
    lineHeight: 1,
  },
  checkboxPlaceholder: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  taskInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    borderBottom: "1px solid transparent",
    color: "#e8e8e8",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    padding: "3px 0",
    transition: "border-color 0.15s",
  },
  taskInputDone: {
    color: "#444",
    textDecoration: "line-through",
  },
  removeTaskBtn: {
    background: "transparent",
    border: "none",
    color: "#2a2a2a",
    fontSize: 16,
    lineHeight: 1,
    padding: "0 2px",
    flexShrink: 0,
    transition: "color 0.15s",
  },
  newTaskInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #1a1a1a",
    color: "#555",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    padding: "3px 0",
  },
  addDayBtn: {
    alignSelf: "flex-start",
    background: "transparent",
    border: "1px solid #222",
    color: "#555",
    padding: "8px 16px",
    fontSize: 12,
    borderRadius: 4,
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.15s, color 0.15s",
  },
};
