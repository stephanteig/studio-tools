// In Tauri: uses plugin-store (file-based). In browser/PWA: falls back to localStorage.

let tauriStore: import("@tauri-apps/plugin-store").Store | null = null;
let tauriInitDone = false;

async function getTauriStore() {
  if (tauriInitDone) return tauriStore;
  tauriInitDone = true;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    tauriStore = await load("store.json", { autoSave: true, defaults: {} });
  } catch {
    tauriStore = null;
  }
  return tauriStore;
}

export async function storeGet<T>(key: string): Promise<T | undefined> {
  const s = await getTauriStore();
  if (s) {
    try { return await s.get<T>(key); } catch { return undefined; }
  }
  const raw = localStorage.getItem(key);
  if (raw == null) return undefined;
  try { return JSON.parse(raw) as T; } catch { return undefined; }
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  const s = await getTauriStore();
  if (s) {
    try { await s.set(key, value); } catch {}
    return;
  }
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export async function storeDelete(key: string): Promise<void> {
  const s = await getTauriStore();
  if (s) {
    try { await s.delete(key); } catch {}
    return;
  }
  localStorage.removeItem(key);
}
