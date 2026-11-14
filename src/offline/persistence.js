import { get, put } from "./db.js";
const mapping = {
  "titipandoa.palette": "preferences",
  "titipandoa.reader.resume": "preferences",
  "titipandoa.reader.size": "preferences",
  "titipandoa.tasbih.v1": "tasbih",
  "titipandoa.library.v1": "libraryState",
  "titipandoa.theme": "preferences",
  "titipandoa.dashboard": "preferences",
};
const memory = new Map();
const pending = new Set();
const failedKeys = new Set();
function externalMirrorChanged(event) {
  if (mapping[event.key] && typeof event.newValue === "string")
    memory.set(event.key, event.newValue);
}
if (typeof window !== "undefined")
  window.addEventListener("storage", externalMirrorChanged);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener("storage", externalMirrorChanged),
  );
export function readPersisted(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function savePersisted(key, value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  const updatedAt = Date.now();
  memory.set(key, raw);
  let mirrored = false;
  try {
    localStorage.setItem(key, raw);
    localStorage.setItem(key + ".updatedAt", String(updatedAt));
    mirrored = true;
  } catch {
    /* IndexedDB remains the primary store. */
  }
  window.dispatchEvent(
    new CustomEvent("titipandoa:persisted", { detail: { key, value: raw } }),
  );
  const operation = put(mapping[key] || "preferences", {
    id: key,
    value: raw,
    updatedAt,
  })
    .then(() => {
      failedKeys.delete(key);
      return true;
    })
    .catch(() => {
      if (!mirrored) failedKeys.add(key);
      return mirrored;
    });
  pending.add(operation);
  operation.finally(() => pending.delete(operation));
  return operation;
}
export async function flushPersistence() {
  while (pending.size) await Promise.all([...pending]);
  if (failedKeys.size) throw new Error("Perubahan belum dapat disimpan.");
}
export async function bootstrapPersistence() {
  for (const [key, store] of Object.entries(mapping)) {
    try {
      const record = await get(store, key);
      let legacy = null,
        time = 0;
      try {
        legacy = localStorage.getItem(key);
        time = Number(localStorage.getItem(key + ".updatedAt")) || 0;
      } catch {
        /* Private mode may block localStorage. */
      }
      if (
        record &&
        (!legacy ||
          record.updatedAt > time ||
          (record.updatedAt === time && record.value === legacy))
      ) {
        memory.set(key, record.value);
        try {
          localStorage.setItem(key, record.value);
        } catch {}
      } else if (legacy) {
        memory.set(key, legacy);
        await put(store, {
          id: key,
          value: legacy,
          updatedAt: time || Date.now(),
        });
      }
    } catch {
      /* Allow the existing localStorage fallback and show storage errors on writes. */
    }
  }
}
