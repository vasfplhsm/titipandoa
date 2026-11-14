const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:4177/titipandoa/";
const authKey =
  "sb-" +
  new URL(process.env.VITE_SUPABASE_URL).hostname.split(".")[0] +
  "-auth-token";
const owner = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "owner@example.invalid",
  app_metadata: { titipandoa_role: "owner" },
  user_metadata: {},
};
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const lateProfile = process.env.SETTINGS_LATE_PROFILE === "1";
    let releaseProfile, releaseSave;
    const profileGate = new Promise((resolve) => {
      releaseProfile = resolve;
    });
    const saveGate = new Promise((resolve) => {
      releaseSave = resolve;
    });
    const existing = {
      id: "default",
      display_name: "Nama sedia ada",
      announcement: "Pesanan asal pada server yang mesti dikekalkan.",
      welcome_message: "Alu-aluan sedia ada.",
      departure_date: "2026-11-23",
      return_date: "2026-12-05",
      accepting_submissions: true,
      sharing_text: "Teks perkongsian sedia ada.",
      public_theme: "coastal",
      public_appearance: "system",
    };
    const writes = [];
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(
      ({ authKey, owner }) =>
        localStorage.setItem(
          authKey,
          JSON.stringify({
            access_token: "fixture-token",
            refresh_token: "fixture-refresh",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: "bearer",
            user: owner,
          }),
        ),
      { authKey, owner },
    );
    if (context.routeWebSocket)
      await context.routeWebSocket("**", (socket) => socket.close());
    await context.route("**/*", async (route) => {
      const req = route.request(),
        u = new URL(req.url());
      if (u.hostname === "127.0.0.1") return route.continue();
      const reply = (body, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      if (u.pathname.endsWith("/auth/v1/user")) return reply(owner);
      if (!u.pathname.includes("/rest/v1/")) return route.abort();
      if (u.pathname.endsWith("/tumpangdoa_public_profile")) {
        if (req.method() === "GET") {
          const snapshot = structuredClone(existing);
          await profileGate;
          return reply(snapshot);
        }
        if (req.method() === "PATCH") {
          const changes = req.postDataJSON();
          writes.push(changes);
          await saveGate;
          Object.assign(existing, changes);
          return reply(existing);
        }
      }
      if (req.method() === "GET") return reply([]);
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(url + "#owner");
    await page.getByRole("button", { name: "Tetapan", exact: true }).click();
    await page.locator(".owner-settings form").waitFor();
    // A typed field must survive the late arrival of unrelated server fields.
    await page
      .getByLabel("Nama paparan jemaah", { exact: true })
      .fill("Nama yang sedang disunting");
    await page
      .getByLabel("Teks perkongsian", { exact: true })
      .fill("Teks yang dihantar");
    const request = page.waitForRequest(
      (req) =>
        req.method() === "PATCH" &&
        req.url().includes("/tumpangdoa_public_profile"),
    );
    await page
      .getByRole("button", { name: "Simpan Tetapan", exact: true })
      .click();
    await request;
    // A newer edit while saving must remain editable after the old request completes.
    await page
      .getByLabel("Teks perkongsian", { exact: true })
      .fill("Suntingan baharu ketika permintaan berjalan");
    // Saving before initial hydration may update only the explicitly edited fields.
    if (lateProfile) releaseSave();
    else releaseProfile();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-label="Pesanan peribadi"]').value ===
        "Pesanan asal pada server yang mesti dikekalkan.",
    );
    assert.equal(
      await page
        .getByLabel("Nama paparan jemaah", { exact: true })
        .inputValue(),
      "Nama yang sedang disunting",
    );
    assert.equal(
      await page.getByLabel("Tarikh berangkat", { exact: true }).inputValue(),
      "2026-11-23",
    );
    if (!lateProfile) releaseSave();
    await page
      .getByText("Tetapan disahkan dan disimpan.", { exact: true })
      .waitFor();
    if (lateProfile) {
      const lateResponse = page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          r.url().includes("/tumpangdoa_public_profile"),
      );
      releaseProfile();
      await lateResponse;
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(
        await page
          .getByLabel("Nama paparan jemaah", { exact: true })
          .inputValue(),
        "Nama yang sedang disunting",
      );
    }
    assert.equal(writes.length, 1);
    assert.equal(writes[0].announcement, undefined);
    assert.equal(writes[0].departure_date, undefined);
    assert.equal(
      existing.announcement,
      "Pesanan asal pada server yang mesti dikekalkan.",
    );
    assert.equal(existing.departure_date, "2026-11-23");
    assert.equal(writes[0].display_name, "Nama yang sedang disunting");
    assert.equal(writes[0].sharing_text, "Teks yang dihantar");
    assert.equal(writes[0].public_theme, undefined);
    assert.equal(writes[0].public_appearance, undefined);
    assert.equal(
      await page.getByLabel("Teks perkongsian", { exact: true }).inputValue(),
      "Suntingan baharu ketika permintaan berjalan",
    );
    console.log(
      "PASS: delayed profile hydration preserves existing server fields and intentional edits; saving omits public theme defaults and retains newer in-flight edits.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
