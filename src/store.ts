import { load, Store } from "@tauri-apps/plugin-store";

let storeInstance: Store | null = null;
let initPromise: Promise<Store | null> | null = null;

export async function getStore(): Promise<Store | null> {
  if (storeInstance) return storeInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const s = await load("store.json", { autoSave: true });
      storeInstance = s;
      return s;
    } catch (e) {
      console.warn("Store not available (browser mode?):", e);
      return null;
    }
  })();

  return initPromise;
}

export async function storeGet<T>(key: string): Promise<T | undefined> {
  const s = await getStore();
  if (!s) return undefined;
  try {
    return await s.get<T>(key);
  } catch {
    return undefined;
  }
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  const s = await getStore();
  if (!s) return;
  try {
    await s.set(key, value);
  } catch (e) {
    console.warn("Store set failed:", e);
  }
}

export async function storeDelete(key: string): Promise<void> {
  const s = await getStore();
  if (!s) return;
  try {
    await s.delete(key);
  } catch (e) {
    console.warn("Store delete failed:", e);
  }
}
