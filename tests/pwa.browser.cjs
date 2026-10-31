const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const { clickDestination } = require("./navigation.cjs");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:4177/titipandoa/";
async function rows(page, store) {
  return page.evaluate(
    (store) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("titipandoa-offline");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(store),
            request = tx.objectStore(store).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          tx.oncomplete = () => db.close();
        };
      }),
    store,
  );
}
async function seed(page, store, data) {
  return page.evaluate(
    ({ store, data }) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("titipandoa-offline");
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(store, "readwrite");
          for (const row of data) tx.objectStore(store).put(row);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    { store, data },
  );
}
async function until(check) {
  for (let i = 0; i < 80; i++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Expected durable state was not reached");
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const serverDoas = new Map();
  let ownerAllowed = false;
  let conflict = true,
    loseResponse = true;
  let mutations = 0;
  const receipts = new Map();
  const rpcIds = [];
  const ownerId = "11111111-1111-4111-8111-111111111111";
  let serverRow = {
    id: "fixture-checklist",
    text: "Pasport ujian",
    category: "Dokumen & Kewangan",
    completed: false,
    updated_at: "2026-10-31T01:00:00Z",
  };
  if (c.routeWebSocket)
    await c.routeWebSocket("**", (socket) => socket.close());
  await c.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (u.hostname === "127.0.0.1") return route.continue();
    const respond = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (u.pathname.endsWith("/auth/v1/user"))
      return ownerAllowed
        ? respond({
            id: ownerId,
            aud: "authenticated",
            role: "authenticated",
            email: "owner@example.invalid",
            app_metadata: { titipandoa_role: "owner" },
            user_metadata: {},
          })
        : respond({ message: "unauthorized" }, 401);
    if (
      u.pathname.includes("/rest/v1/rpc/titipandoa_apply_offline_operation")
    ) {
      const body = req.postDataJSON();
      rpcIds.push(body.p_operation_id);
      if (!ownerAllowed)
        return respond({ code: "42501", message: "denied" }, 403);
      if (receipts.has(body.p_operation_id))
        return respond(receipts.get(body.p_operation_id));
      if (conflict)
        return respond({
          status: "conflict",
          row: { ...serverRow, updated_at: "2026-10-31T02:00:00Z" },
        });
      mutations++;
      serverRow = {
        ...serverRow,
        ...body.p_changes,
        updated_at: "2026-10-31T03:00:00Z",
      };
      const result = { status: "applied", row: serverRow };
      receipts.set(body.p_operation_id, result);
      if (loseResponse) {
        loseResponse = false;
        return route.abort();
      }
      return respond(result);
    }
    if (u.pathname.endsWith("/rest/v1/doas") && req.method() === "POST") {
      const data = req.postDataJSON();
      if (serverDoas.has(data.id))
        return respond({ code: "23505", message: "duplicate" }, 409);
      serverDoas.set(data.id, data);
      return respond(null, 201);
    }
    if (u.pathname.includes("/rest/v1/") && req.method() === "GET") {
      if (u.pathname.endsWith("/checklist")) return respond([serverRow]);
      if (u.pathname.endsWith("/doas"))
        return respond([...serverDoas.values()]);
      return respond([]);
    }
    return route.abort();
  });
  let p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("dialog", (d) => d.accept());
  await p.goto(url);
  await p
    .getByRole("heading", { name: "Assalamualaikum", exact: true })
    .waitFor();
  await p.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((r) =>
        navigator.serviceWorker.addEventListener("controllerchange", r, {
          once: true,
        }),
      );
  });
  const manifest = await p.evaluate(async () => ({
    data: await (
      await fetch(new URL("manifest.webmanifest", location.href))
    ).json(),
    scope: (await navigator.serviceWorker.getRegistration()).scope,
  }));
  assert.equal(manifest.data.display, "standalone");
  assert.equal(manifest.scope, url);
  assert.equal(manifest.data.icons.length, 3);
  await p.getByRole("button", { name: "Tab Lain-lain", exact: true }).click();
  await p
    .getByRole("button", { name: "Luar Talian & Pemasangan", exact: true })
    .click();
  await p
    .getByRole("button", {
      name: "Muat Turun untuk Kegunaan Offline",
      exact: true,
    })
    .click();
  await p.locator(".offline-ready").waitFor();
  assert.equal((await rows(p, "publicContent"))[0].entries.length, 54);
  await clickDestination(p, "Tasbih Digital");
  await p.evaluate(() => {
    for (let i = 0; i < 37; i++)
      document.querySelector(".tasbih-counter").click();
  });
  await until(
    async () =>
      JSON.parse((await rows(p, "tasbih"))[0].value).sessions.subhanallah
        .count === 37,
  );
  await c.setOffline(true);
  await p.close();
  p = await c.newPage();
  p.on("dialog", (d) => d.accept());
  await p.goto(url);
  await p
    .getByRole("heading", { name: "Assalamualaikum", exact: true })
    .waitFor();
  assert.equal(await p.locator(".widget-counter-row strong").innerText(), "37");
  await p.getByRole("button", { name: "Tambah tasbih pada widget" }).click();
  await until(
    async () =>
      JSON.parse((await rows(p, "tasbih"))[0].value).sessions.subhanallah
        .count === 38,
  );
  await p.close();
  p = await c.newPage();
  p.on("dialog", (d) => d.accept());
  await p.goto(url + "#doa/h-tidur");
  await p
    .getByRole("heading", { name: "Doa sebelum tidur", exact: true })
    .waitFor();
  await clickDestination(p, "Titip Doa");
  await p
    .getByRole("button", { name: "Titipkan doa anda di sini", exact: true })
    .click();
  await p
    .getByPlaceholder("e.g. Ahmad & Family / Sahabat Kolej")
    .fill("Fixture offline");
  await p
    .getByPlaceholder("Tuliskan titipan doa khusus anda di sini...")
    .fill("Titipan ujian luar talian.");
  await p.getByRole("button", { name: /Titip Doa Kepada/ }).click();
  await until(
    async () =>
      (await rows(p, "outbox")).filter((o) => o.kind === "doa").length === 1,
  );
  await p.getByRole("button", { name: /Titip Doa Kepada/ }).click();
  assert.equal(
    (await rows(p, "outbox")).filter((o) => o.kind === "doa").length,
    1,
  );
  await c.setOffline(false);
  await until(
    async () =>
      (await rows(p, "outbox")).find((o) => o.kind === "doa")?.status ===
      "synced",
  );
  assert.equal(serverDoas.size, 1);
  assert.equal(
    (await rows(p, "outbox")).find((o) => o.kind === "doa").payload,
    null,
  );
  await seed(p, "privateRecords", [
    { id: "checklist", ownerId, rows: [serverRow], updatedAt: Date.now() },
    {
      id: "itinerary",
      ownerId,
      rows: [
        {
          id: "fixture-itinerary",
          activity: "Ziarah ujian",
          date: "2026-11-01",
          notes: "",
          updated_at: serverRow.updated_at,
        },
      ],
      updatedAt: Date.now(),
    },
  ]);
  await seed(p, "preferences", [
    { id: "private-download", entities: ["checklist", "itinerary"] },
  ]);
  await p.evaluate(() =>
    localStorage.setItem("titipandoa_owner_authenticated", "true"),
  );
  await c.setOffline(true);
  await p.reload();
  await p.getByRole("button", { name: "Tab Umrah", exact: true }).click();
  await p
    .getByRole("button", { name: "Senarai Semak Umrah", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Tandakan Pasport ujian", exact: true })
    .click();
  await until(async () =>
    (await rows(p, "outbox")).some(
      (o) => o.kind === "owner-patch" && o.status === "queued",
    ),
  );
  await c.setOffline(false);
  await until(async () =>
    (await rows(p, "outbox")).some(
      (o) => o.kind === "owner-patch" && o.status === "blocked",
    ),
  );
  assert.equal(mutations, 0);
  if (process.env.VITE_SUPABASE_URL) {
    const authKey =
      "sb-" +
      new URL(process.env.VITE_SUPABASE_URL).hostname.split(".")[0] +
      "-auth-token";
    ownerAllowed = true;
    await p.evaluate(
      ({ key, ownerId }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            access_token: "test-session-token",
            refresh_token: "test-refresh-token",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: ownerId,
              aud: "authenticated",
              role: "authenticated",
              email: "owner@example.invalid",
              app_metadata: { titipandoa_role: "owner" },
              user_metadata: {},
            },
          }),
        ),
      { key: authKey, ownerId },
    );
    await p.reload();
    await p.getByRole("button", { name: "Tab Lain-lain", exact: true }).click();
    await p
      .getByRole("button", { name: "Luar Talian & Pemasangan", exact: true })
      .click();
    await p.getByRole("button", { name: "Cuba semula", exact: true }).click();
    await until(async () =>
      (await rows(p, "outbox")).some((o) => o.status === "conflict"),
    );
    assert.equal(mutations, 0);
    await p
      .getByRole("button", {
        name: "Gunakan versi server / gugurkan",
        exact: true,
      })
      .click();
    await until(
      async () =>
        (await rows(p, "outbox")).filter(
          (o) => !["synced", "discarded"].includes(o.status),
        ).length === 0,
    );
    serverRow = { ...serverRow, updated_at: "2026-10-31T02:00:00Z" };
    conflict = false;
    await p.getByRole("button", { name: "Tab Umrah", exact: true }).click();
    await p
      .getByRole("button", { name: "Senarai Semak Umrah", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Tandakan Pasport ujian", exact: true })
      .click();
    await until(async () =>
      (await rows(p, "outbox")).some((o) => o.status === "retry"),
    );
    await p.getByRole("button", { name: "Tab Lain-lain", exact: true }).click();
    await p
      .getByRole("button", { name: "Luar Talian & Pemasangan", exact: true })
      .click();
    await p.getByRole("button", { name: "Cuba semula", exact: true }).click();
    await until(
      async () =>
        (await rows(p, "outbox")).filter(
          (o) => !["synced", "discarded"].includes(o.status),
        ).length === 0,
    );
    assert.equal(mutations, 1);
    assert.equal(rpcIds.at(-1), rpcIds.at(-2));
  }
  const cachedURLs = await p.evaluate(async () => {
    const result = [];
    for (const key of await caches.keys())
      for (const req of await (await caches.open(key)).keys())
        result.push(req.url);
    return result;
  });
  assert(
    cachedURLs.every((value) => new URL(value).origin === new URL(url).origin),
  );
  assert(!cachedURLs.some((value) => /rest\/v1|auth\/v1/.test(value)));
  await p.getByRole("button", { name: "Tab Utama", exact: true }).click();
  for (const width of [320, 390, 430, 844]) {
    await p.setViewportSize({ width, height: 844 });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `PWA overflow ${width}`,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: "/tmp/pwa-dashboard-final.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: manifest/scope; cached offline reopen; IndexedDB count recovery; offline reading; stable queued submission; private authorization block; mocked conflict and lost-ack recovery; no private HTTP cache; mobile/landscape layouts.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
