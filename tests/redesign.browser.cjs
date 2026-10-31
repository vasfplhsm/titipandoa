const { clickDestination } = require("./navigation.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:5173/titipandoa/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
  });
  let rejectSubmit = true;
  const writes = [];
  const errors = [];
  const records = Array.from({ length: 4 }, (_, i) => ({
    id: `test-${i}`,
    sender_name: `Private sender ${i}`,
    category: ["Kesihatan", "Pendidikan", "Rezeki", "Umum"][i],
    message: "Rekod ujian sahaja. Semoga dipermudahkan segala urusan.",
    amin_count: i,
    created_at: "2026-10-31T07:00:00Z",
    is_read: false,
    is_bookmarked: false,
  }));
  if (c.routeWebSocket)
    await c.routeWebSocket("**", (socket) => socket.close());
  await c.route("**/*", async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === "127.0.0.1") return route.continue();
    if (!u.pathname.includes("/rest/v1/")) return route.abort();
    const table = u.pathname.split("/").pop();
    const method = req.method();
    const respond = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (method === "GET") {
      if (table === "doas") return respond(records);
      if (
        table === "app_settings" &&
        u.searchParams.get("key")?.startsWith("in.")
      )
        return respond(
          ["seeded_doas", "seeded_checklist", "seeded_itinerary"].map(
            (key) => ({ key }),
          ),
        );
      return respond([]);
    }
    writes.push({ table, method, body: req.postDataJSON() });
    if (table === "doas" && method === "POST") {
      if (rejectSubmit)
        return respond(
          { message: "Test unavailable", code: "test_error" },
          503,
        );
      const body = req.postDataJSON();
      return respond(Array.isArray(body) ? body[0] : body, 201);
    }
    if (table === "doas" && method === "PATCH") {
      const id = u.searchParams.get("id")?.replace("eq.", "");
      const found = records.find((row) => row.id === id);
      if (found) Object.assign(found, req.postDataJSON());
      return respond(found ? [found] : []);
    }
    return respond(req.postDataJSON() || {});
  });
  const p = await c.newPage();
  p.on("dialog", (dialog) => dialog.accept());
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url);
  await p.evaluate(() => document.fonts.ready);
  assert.match(
    await p.getByRole("heading", { level: 1 }).innerText(),
    /Setiap doa/,
  );
  assert.equal(
    await p.getByText("Private sender 0", { exact: true }).count(),
    0,
  );
  assert.equal(await p.locator(".community-card").count(), 0);
  await p.screenshot({ path: "/tmp/redesign-desktop.png", fullPage: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `home overflow ${width}`,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: "/tmp/redesign-mobile.png", fullPage: true });
  await p.getByRole("button", { name: "Gunakan tema gelap" }).click();
  assert.equal(await p.locator(".td-app").getAttribute("data-theme"), "dark");
  await p.reload();
  assert.equal(await p.locator(".td-app").getAttribute("data-theme"), "dark");
  await p.getByRole("button", { name: "Gunakan tema cerah" }).click();
  await p.getByRole("button", { name: "Baca Doa", exact: true }).click();
  assert.equal(await p.locator(".library-result-card").count(), 54);
  assert.equal(await p.locator(".library-result-card [lang=ar]").count(), 54);
  await clickDestination(p, "Tentang Kami");
  assert.match(
    await p.getByRole("heading", { level: 1 }).innerText(),
    /Tentang Titipan/,
  );
  await clickDestination(p, "Titip Doa");
  await p
    .getByRole("button", { name: "Titipkan doa anda di sini", exact: true })
    .click();
  await p
    .getByPlaceholder("e.g. Ahmad & Family / Sahabat Kolej")
    .fill("Pengirim ujian");
  await p
    .getByPlaceholder("Tuliskan titipan doa khusus anda di sini...")
    .fill("Semoga diberikan ketenangan dan kemudahan.");
  await p.getByRole("button", { name: /Titip Doa Kepada/ }).click();
  await p
    .getByRole("status")
    .filter({ hasText: /belum disahkan server/ })
    .waitFor();
  assert.equal(
    await p
      .getByPlaceholder("e.g. Ahmad & Family / Sahabat Kolej")
      .inputValue(),
    "Pengirim ujian",
  );
  rejectSubmit = false;
  await p.getByRole("button", { name: /Titip Doa Kepada/ }).click();
  await p.getByText("Alhamdulillah! 🌸", { exact: true }).waitFor();
  assert.equal(
    writes.filter((w) => w.table === "doas" && w.method === "POST").length,
    2,
  );
  await p.getByRole("button", { name: "Akses Jemaah", exact: true }).click();
  const pin = p.locator("input[type=password]").first();
  await pin.fill("1234");
  await p.getByRole("button", { name: "Buka Akses", exact: true }).click();
  await clickDestination(p, "Utama");
  await p.setViewportSize({ width: 1440, height: 1050 });
  await p.waitForFunction(
    () => document.querySelectorAll(".community-card").length === 4,
  );
  assert.equal(await p.locator(".community-card").count(), 4);
  const patched = p.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" && r.url().includes("/rest/v1/doas"),
  );
  await p
    .locator(".community-card")
    .first()
    .getByRole("button", { name: /Amin untuk/ })
    .click();
  await patched;
  assert.equal(
    writes.some((w) => w.table === "doas" && w.method === "PATCH"),
    true,
  );
  await p.setViewportSize({ width: 1440, height: 1050 });
  await p.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await p.screenshot({
    path: "/tmp/redesign-owner-desktop.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: responsive home at 320/390/768/1024/1440; private records hidden publicly; navigation and Quran collection; persisted theme; mocked Supabase reads, failed/successful submissions, and owner Amin write.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
