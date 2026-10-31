import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { all, get, put } from "./db.js";
import {
  queueDoa,
  localPatch,
  pendingOperations,
  overlayPending,
  acceptServer,
  retryOperation,
  classifyError,
} from "./sync.js";
globalThis.window = new EventTarget();
test("doa queue uses durable stable IDs and refuses a different payload under the same ID", async () => {
  const payload = {
    id: crypto.randomUUID(),
    sender_name: "Fixture",
    message: "Fixture message",
    category: "Umum",
  };
  const a = await queueDoa(payload);
  await queueDoa(payload);
  assert.equal((await all("outbox")).filter((op) => op.id === a.id).length, 1);
  assert.equal((await get("outbox", a.id)).status, "queued");
  await assert.rejects(() => queueDoa({ ...payload, message: "different" }));
  await put("outbox", { ...a, status: "synced", payload: null });
  await queueDoa(payload);
  assert.equal((await get("outbox", a.id)).status, "synced");
});
test("offline checklist update and outbox are atomic and unsent edits coalesce", async () => {
  await put("privateRecords", {
    id: "checklist",
    ownerId: "owner-fixture",
    rows: [
      {
        id: "c1",
        text: "Fixture",
        completed: false,
        updated_at: "2026-10-31T00:00:00Z",
      },
    ],
  });
  const first = await localPatch("checklist", "c1", { completed: true });
  const second = await localPatch("checklist", "c1", { completed: false });
  assert.equal(first.id, second.id);
  assert.equal(
    (await get("privateRecords", "checklist")).rows[0].completed,
    false,
  );
  assert.equal(second.baseVersion, "2026-10-31T00:00:00Z");
  assert.equal(second.ownerId, "owner-fixture");
  await assert.rejects(() =>
    localPatch("itinerary", "missing", { notes: "No downloaded row" }),
  );
  assert((await pendingOperations()).some((op) => op.id === first.id));
});
test("new server reads do not erase pending local edits; conflicts cannot be blindly retried", async () => {
  const op = (await pendingOperations()).find(
    (op) => op.entity === "checklist",
  );
  await put("outbox", {
    ...op,
    status: "conflict",
    payload: { completed: true },
    serverRow: { id: "c1", completed: false, updated_at: "new-version" },
  });
  assert.equal(
    (await overlayPending("checklist", [{ id: "c1", completed: false }]))[0]
      .completed,
    true,
  );
  await retryOperation(op.id);
  assert.equal((await get("outbox", op.id)).status, "conflict");
  await acceptServer(op.id);
  assert.equal(
    (await get("privateRecords", "checklist")).rows[0].completed,
    false,
  );
  assert.equal((await get("outbox", op.id)).payload, null);
});
test("authorization, schema errors and transient failures remain distinct", () => {
  assert.equal(classifyError({ code: "42501", message: "denied" }), "blocked");
  assert.equal(classifyError({ code: "PGRST202" }), "blocked");
  assert.equal(classifyError({ message: "Failed to fetch" }), "retry");
  assert.equal(classifyError({ code: "23505" }), "blocked");
  assert.equal(
    classifyError({ message: "unexpected invalid value" }),
    "failed",
  );
});
