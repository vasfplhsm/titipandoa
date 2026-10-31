export const STORES = [
  "publicContent",
  "privateRecords",
  "preferences",
  "tasbih",
  "libraryState",
  "outbox",
  "meta",
  "drafts",
  "notes",
];
let connection;
export function database() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB)
        return reject(new Error("IndexedDB tidak tersedia"));
      const request = indexedDB.open("titipandoa-offline", 1);
      request.onupgradeneeded = () => {
        for (const name of STORES)
          if (!request.result.objectStoreNames.contains(name))
            request.result.createObjectStore(name, { keyPath: "id" });
      };
      let blocked = false;
      request.onsuccess = () => {
        if (blocked) {
          request.result.close();
          return;
        }
        request.result.onversionchange = () => {
          request.result.close();
          connection = null;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        connection = null;
        reject(request.error);
      };
      request.onblocked = () =>
        reject(new Error("Tutup tab lama untuk menaik taraf simpanan."));
    });
  return connection;
}
const activeTransactions = new Set();
export function transaction(names, mode, work) {
  const operation = database().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(names, mode);
        const stores = Object.fromEntries(
          names.map((n) => [n, tx.objectStore(n)]),
        );
        let result;
        try {
          result = work(stores, tx);
        } catch (error) {
          tx.abort();
          reject(error);
          return;
        }
        tx.oncomplete = () =>
          resolve(typeof result === "function" ? result() : result);
        tx.onerror = () => reject(tx.error || new Error("Simpanan gagal"));
        tx.onabort = () => reject(tx.error || new Error("Simpanan dibatalkan"));
      }),
  );
  activeTransactions.add(operation);
  operation.then(
    () => activeTransactions.delete(operation),
    () => activeTransactions.delete(operation),
  );
  return operation;
}
export async function flushDatabase() {
  while (activeTransactions.size) await Promise.all([...activeTransactions]);
}

export async function get(store, id) {
  let value;
  await transaction([store], "readonly", (s) => {
    s[store].get(id).onsuccess = (e) => {
      value = e.target.result;
    };
  });
  return value;
}
export async function all(store) {
  let values = [];
  await transaction([store], "readonly", (s) => {
    s[store].getAll().onsuccess = (e) => {
      values = e.target.result;
    };
  });
  return values;
}
export const put = (store, value) =>
  transaction([store], "readwrite", (s) => s[store].put(value));
export const remove = (store, id) =>
  transaction([store], "readwrite", (s) => s[store].delete(id));
export function emitOffline() {
  window.dispatchEvent(new Event("titipandoa:offline-change"));
}
export async function storageEstimate() {
  return navigator.storage?.estimate?.() || {};
}
