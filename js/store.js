// Everything lives in this browser's IndexedDB. Nothing is sent to a server
// except the prompts that go to the Anthropic API with the viewer's own key.
const DB_NAME = "small-talk-ladder";
const STORES = ["kv", "plans", "sessions", "phrases", "recordings", "videos", "speeches"];
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}
function tx(store, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => resolve(out?.result ?? out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const get = (store, id) => tx(store, "readonly", s => s.get(id));
export const all = (store) => tx(store, "readonly", s => s.getAll());
export const put = (store, doc) => tx(store, "readwrite", s => { s.put(doc); });
export const del = (store, id) => tx(store, "readwrite", s => { s.delete(id); });
export async function kvGet(key, fallback = null) { const r = await get("kv", key); return r ? r.value : fallback; }
export const kvSet = (key, value) => put("kv", { id: key, value });

// Backup: every store except the video blobs (those are downloaded one by one).
export async function exportAll() {
  const out = { app: "small-talk-ladder", version: 1, exportedAt: new Date().toISOString() };
  for (const s of STORES) if (s !== "videos") out[s] = await all(s);
  out.kv = out.kv.filter(r => r.id !== "apiKey");
  return out;
}
export async function importAll(data) {
  if (data?.app !== "small-talk-ladder") throw new Error("That file isn't a Small Talk Ladder backup.");
  for (const s of STORES) {
    if (s === "videos" || !Array.isArray(data[s])) continue;
    await tx(s, "readwrite", st => { for (const doc of data[s]) if (doc && doc.id != null && doc.id !== "apiKey") st.put(doc); });
  }
}
export const uid = (prefix) => prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
