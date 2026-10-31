import { supabase } from "../supabaseClient.js";
import { all, get, put, remove, transaction, emitOffline } from "./db.js";
let syncing;
let active = false;
export const syncIsActive = () => active;
export async function verifiedOwner() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (
    error ||
    !data?.user ||
    data.user.app_metadata?.titipandoa_role !== "owner"
  )
    return null;
  return data.user;
}
export async function queueDoa(payload) {
  const id = payload.id || crypto.randomUUID();
  const fingerprint = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
          JSON.stringify([
            payload.sender_name,
            payload.message,
            payload.category,
          ]),
        ),
      ),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  const existing = await get("outbox", "doa-" + id);
  if (existing && existing.status !== "discarded") {
    if (existing.fingerprint && existing.fingerprint !== fingerprint)
      throw new Error(
        "ID titipan terdahulu tidak boleh digunakan untuk pesanan berbeza.",
      );
    if (existing.status === "synced") return existing;
    if (
      ["sender_name", "message", "category"].some(
        (key) => existing.payload?.[key] !== payload[key],
      )
    )
      throw new Error(
        "Titipan terdahulu masih tertunda. Selesaikan atau gugurkannya sebelum menghantar draf berbeza.",
      );
    return existing;
  }
  const op = {
    fingerprint,
    id: "doa-" + id,
    kind: "doa",
    entity: "doas",
    recordId: id,
    payload: { ...payload, id },
    ownerId: null,
    status: "queued",
    attempts: 0,
    createdAt: Date.now(),
  };
  await put("outbox", op);
  emitOffline();
  return op;
}
export async function cachePrivate(entity, rows, ownerId) {
  const settings = await get("preferences", "private-download");
  if (!settings?.entities?.includes(entity)) return;
  const pending = await all("outbox");
  const merged = rows.map((row) => {
    const changes = pending
      .filter(
        (op) =>
          op.entity === entity &&
          String(op.recordId) === String(row.id) &&
          !["synced", "discarded"].includes(op.status),
      )
      .reduce((value, op) => ({ ...value, ...op.payload }), {});
    return { ...row, ...changes };
  });
  await put("privateRecords", {
    id: entity,
    rows: merged,
    ownerId,
    updatedAt: Date.now(),
  });
}
export async function localPatch(entity, recordId, changes) {
  if (!["checklist", "itinerary"].includes(entity))
    throw new Error("Perubahan ini tidak disokong luar talian.");
  let output;
  await transaction(["privateRecords", "outbox"], "readwrite", (stores) => {
    stores.privateRecords.get(entity).onsuccess = (event) => {
      const cached = event.target.result;
      if (!cached) {
        output = { error: "Muat turun data ini dahulu." };
        return;
      }
      const row = cached.rows.find((r) => String(r.id) === String(recordId));
      if (!row) {
        output = { error: "Rekod setempat tidak dijumpai." };
        return;
      }
      stores.outbox.getAll().onsuccess = (e) => {
        const existing = e.target.result.find(
          (op) =>
            op.entity === entity &&
            String(op.recordId) === String(recordId) &&
            op.status === "queued" &&
            op.attempts === 0,
        );
        const op = existing
          ? { ...existing, payload: { ...existing.payload, ...changes } }
          : {
              id: crypto.randomUUID(),
              kind: "owner-patch",
              entity,
              recordId,
              payload: changes,
              baseVersion: row.updated_at || null,
              ownerId: cached.ownerId,
              status: "queued",
              attempts: 0,
              createdAt: Date.now(),
            };
        stores.outbox.put(op);
        stores.privateRecords.put({
          ...cached,
          rows: cached.rows.map((r) =>
            String(r.id) === String(recordId) ? { ...r, ...changes } : r,
          ),
        });
        output = op;
      };
    };
  });
  if (output?.error) throw new Error(output.error);
  emitOffline();
  return output;
}
export async function pendingOperations() {
  return (await all("outbox"))
    .filter((op) => !["synced", "discarded"].includes(op.status))
    .sort((a, b) => a.createdAt - b.createdAt);
}
export async function overlayPending(entity, rows) {
  const operations = await pendingOperations();
  return rows.map((row) => ({
    ...row,
    ...operations
      .filter(
        (op) => op.entity === entity && String(op.recordId) === String(row.id),
      )
      .reduce((value, op) => ({ ...value, ...op.payload }), {}),
  }));
}
export async function retryOperation(id) {
  const op = await get("outbox", id);
  if (!op || op.status === "conflict") return;
  await put("outbox", { ...op, status: "queued", retryAt: 0, error: null });
  emitOffline();
}
export async function acceptServer(id) {
  const op = await get("outbox", id);
  if (!op) return;
  if (op.serverRow) {
    const cached = await get("privateRecords", op.entity);
    if (cached)
      await put("privateRecords", {
        ...cached,
        rows: cached.rows.map((r) =>
          String(r.id) === String(op.recordId) ? op.serverRow : r,
        ),
      });
  }
  await put("outbox", {
    ...op,
    status: "discarded",
    payload: null,
    serverRow: null,
  });
  emitOffline();
}
export async function clearPrivate() {
  const pending = await pendingOperations();
  if (pending.some((op) => op.kind === "owner-patch"))
    throw new Error(
      "Selesaikan atau gugurkan perubahan peribadi tertunda dahulu.",
    );
  for (const table of ["doas", "checklist", "itinerary", "flights"])
    await remove("privateRecords", table);
  for (const note of await all("notes")) await remove("notes", note.id);
  await remove("preferences", "private-download");
  await remove("meta", "private-owner");
  emitOffline();
}
export function classifyError(error) {
  const code = String(error?.code || "");
  if (code === "23505") return "blocked";
  if (
    ["42501", "PGRST301", "PGRST302", "PGRST202", "42883"].includes(code) ||
    /permission|unauthor|JWT|row-level/i.test(error?.message || "")
  )
    return "blocked";
  if (/fetch|network|offline|timeout/i.test(error?.message || ""))
    return "retry";
  return "failed";
}
async function sendDoa(op) {
  if (!supabase)
    throw {
      code: "PGRST301",
      message: "Sambungan server belum dikonfigurasi.",
    };
  const { error, status } = await supabase.from("doas").insert(op.payload);
  if (!error && status >= 200 && status < 300) return { status: "applied" };
  if (error?.code === "23505") {
    const { data, error: readError } = await supabase
      .from("doas")
      .select("id,sender_name,message,category")
      .eq("id", op.recordId)
      .single();
    if (
      !readError &&
      data &&
      ["sender_name", "message", "category"].every(
        (key) => data[key] === op.payload[key],
      )
    )
      return { status: "applied" };
    throw {
      code: "23505",
      message:
        "ID telah wujud tetapi pengesahan tidak tersedia. Tiada salinan baharu dihantar.",
    };
  }
  throw error || new Error("Server tidak mengesahkan penghantaran.");
}
async function runSync(force = false) {
  if (navigator.onLine === false) return;
  active = true;
  emitOffline();
  try {
    const operations = await pendingOperations();
    let owner;
    for (const snapshot of operations) {
      const op = await get("outbox", snapshot.id);
      if (
        !["queued", "retry", "running"].includes(op?.status) ||
        (!force && op.retryAt > Date.now())
      )
        continue;
      if (navigator.onLine === false) break;
      await put("outbox", {
        ...op,
        status: "running",
        attempts: op.attempts + 1,
      });
      emitOffline();
      try {
        let response;
        if (op.kind === "doa") response = await sendDoa(op);
        else {
          owner ??= await verifiedOwner();
          if (!owner || owner.id !== op.ownerId)
            throw {
              code: "42501",
              message:
                "Log masuk pemilik yang sama diperlukan untuk penyegerakan peribadi.",
            };
          if (!op.baseVersion)
            throw {
              code: "PGRST202",
              message:
                "Versi rekod server belum tersedia. Muat turun selepas persediaan penyegerakan selamat.",
            };
          const { data, error } = await supabase.rpc(
            "titipandoa_apply_offline_operation",
            {
              p_operation_id: op.id,
              p_entity: op.entity,
              p_record_id: String(op.recordId),
              p_expected_updated_at: op.baseVersion,
              p_changes: op.payload,
            },
          );
          if (error) throw error;
          response = data;
        }
        if (response?.status === "conflict") {
          await put("outbox", {
            ...op,
            status: "conflict",
            attempts: op.attempts + 1,
            error:
              "Versi server berubah. Perubahan setempat tidak menimpa server.",
            serverRow: response.row,
          });
        } else if (response?.status === "applied") {
          await put("outbox", {
            ...op,
            status: "synced",
            payload: null,
            attempts: op.attempts + 1,
            syncedAt: Date.now(),
            error: null,
          });
          if (response.row) {
            const cached = await get("privateRecords", op.entity);
            if (cached)
              await put("privateRecords", {
                ...cached,
                rows: await overlayPending(
                  op.entity,
                  cached.rows.map((r) =>
                    String(r.id) === String(op.recordId) ? response.row : r,
                  ),
                ),
              });
          }
          await put("meta", { id: "last-sync", value: Date.now() });
        } else throw new Error("Server tidak mengesahkan perubahan.");
      } catch (error) {
        const status = classifyError(error);
        await put("outbox", {
          ...op,
          status,
          attempts: op.attempts + 1,
          error: error.message || "Penyegerakan gagal.",
          retryAt:
            status === "retry"
              ? Date.now() +
                Math.min(900000, 30000 * 2 ** Math.min(op.attempts, 5))
              : 0,
        });
      }
      emitOffline();
    }
  } finally {
    active = false;
    emitOffline();
  }
}
export function synchronize({ force = false } = {}) {
  if (syncing) return syncing;
  syncing = (
    navigator.locks
      ? navigator.locks.request("titipandoa-sync", () => runSync(force))
      : runSync(force)
  ).finally(() => {
    syncing = null;
  });
  return syncing;
}
export function startSyncTriggers() {
  const trigger = () => {
    if (document.visibilityState === "visible" && navigator.onLine)
      synchronize({ force: true }).catch(() => emitOffline());
  };
  window.addEventListener("online", trigger);
  document.addEventListener("visibilitychange", trigger);
  trigger();
  return () => {
    window.removeEventListener("online", trigger);
    document.removeEventListener("visibilitychange", trigger);
  };
}
