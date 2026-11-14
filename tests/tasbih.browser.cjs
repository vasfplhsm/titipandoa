const { clickDestination } = require("./navigation.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  // No remote requests, so existing app initialization cannot write to a live database.
  if (context.routeWebSocket)
    await context.routeWebSocket("**", (socket) => socket.close());
  await context.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  await page.goto(
    process.env.TASBIH_TEST_URL || "http://127.0.0.1:5173/titipandoa/",
  );
  await clickDestination(page, "Tasbih Digital");
  const counter = page.getByRole("button", {
    name: "Tambah kiraan Subhanallah",
    exact: true,
  });
  await counter.click();
  await page.evaluate(() => {
    for (let i = 0; i < 99; i++)
      document.querySelector(".tasbih-counter").click();
  });
  assert.equal(await page.locator(".tasbih-count").innerText(), "100");
  await counter.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".tasbih-count").innerText(), "102");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "101");
  await page.reload();
  await clickDestination(page, "Tasbih Digital");
  assert.equal(await page.locator(".tasbih-count").innerText(), "101");
  await page.getByLabel("Pilih zikr").selectOption("alhamdulillah");
  assert.equal(await page.locator(".tasbih-count").innerText(), "0");
  assert.equal(
    await page.getByRole("button", { name: "Undo", exact: true }).isDisabled(),
    true,
  );
  await page.getByLabel("Pilih zikr").selectOption("subhanallah");
  assert.equal(await page.locator(".tasbih-count").innerText(), "101");
  await context.setOffline(true);
  await page.locator(".tasbih-counter").click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "102");
  await context.setOffline(false);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "102");
  await page
    .getByRole("button", { name: "Simpan & tamat sesi", exact: true })
    .click();
  await page.getByRole("button", { name: "Ya, teruskan", exact: true }).click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "0");
  await page.getByRole("button", { name: "Mod Panduan", exact: true }).click();
  await page.getByLabel("Sasaran setiap peringkat").fill("2");
  await page.getByRole("button", { name: "Mulakan sesi", exact: true }).click();
  for (let i = 0; i < 6; i++) await page.locator(".tasbih-counter").click();
  assert.match(
    await page.locator(".tasbih-completion").innerText(),
    /Semua peringkat selesai/,
  );
  assert.equal(await page.locator(".tasbih-count").innerText(), "2");
  await page.getByRole("button", { name: "Mod fokus", exact: true }).click();
  assert.equal(await page.locator(".tasbih-focus").count(), 1);
  await page
    .getByRole("button", { name: "Keluar mod fokus", exact: true })
    .click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "/tmp/tasbih-mobile.png", fullPage: true });
  await page
    .getByRole("button", { name: "Simpan & tamat sesi", exact: true })
    .click();
  await page.getByRole("button", { name: "Ya, teruskan", exact: true }).click();
  await page.getByRole("button", { name: "Sejarah", exact: true }).click();
  assert.equal(await page.locator(".tasbih-history li").count(), 4);
  await page.getByRole("button", { name: "Tetapan", exact: true }).click();
  await page.getByLabel(/Tema/).selectOption("dark");
  assert.equal(
    await page.locator(".tasbih").getAttribute("data-theme"),
    "dark",
  );
  await page.getByText("Tambah zikr peribadi", { exact: true }).click();
  await page
    .getByLabel("Nama zikr", { exact: true })
    .fill("Zikr peribadi saya");
  await page.locator("details input[type=number]").fill("7");
  await page.getByRole("button", { name: "Tambah zikr", exact: true }).click();
  await page.locator(".tasbih-counter").click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "1");
  const other = await context.newPage();
  await other.goto(
    process.env.TASBIH_TEST_URL || "http://127.0.0.1:5173/titipandoa/",
  );
  await clickDestination(other, "Tasbih Digital");
  await other.locator(".tasbih-counter").click();
  await page.waitForFunction(
    () => document.querySelector(".tasbih-counter").disabled,
  );
  await page.getByRole("button", { name: "Teruskan", exact: true }).click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "2");
  await other.close();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Ya, teruskan", exact: true }).click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "0");
  await page.setViewportSize({ width: 320, height: 720 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  console.log(
    "PASS: custom zikr, dark theme, cross-tab conflict recovery, confirmed reset, 320px layout.",
  );
  await clickDestination(page, "Titip Doa");

  await page
    .getByPlaceholder("Nama anda (pilihan)")
    .fill("Semakan borang");
  await clickDestination(page, "Tasbih Digital");
  assert.equal(await page.locator(".tasbih-count").innerText(), "0");
  await clickDestination(page, "Titip Doa");
  assert.equal(
    await page
      .getByPlaceholder("Nama anda (pilihan)")
      .inputValue(),
    "Semakan borang",
  );
  await clickDestination(page, "Tasbih Digital");
  console.log(
    "PASS: switching app tabs retains Tasbih state and the existing doa form draft.",
  );
  await page.evaluate(() => {
    IDBDatabase.prototype.transaction = function () {
      throw new DOMException("quota", "QuotaExceededError");
    };
    Storage.prototype.setItem = function () {
      throw Error("quota");
    };
  });
  await page.locator(".tasbih-counter").click();
  assert.match(
    await page.locator(".tasbih-alert").innerText(),
    /Simpanan pelayar/,
  );
  console.log(
    "PASS: rapid clicks, keyboard, beyond target, undo zero, reload, zikr switching, offline/reconnect, reset cancel, history, guided completion, focus, mobile overflow, full storage.",
  );
  const blocked = await browser.newContext();
  await blocked.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw Error("denied");
      },
    });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("denied");
      },
    });
  });
  const p = await blocked.newPage();
  await p.goto(process.env.TASBIH_TEST_URL || "http://127.0.0.1:5173/");
  await clickDestination(p, "Tasbih Digital");
  await p.locator(".tasbih-counter").click();
  assert.equal(await p.locator(".tasbih-count").innerText(), "1");
  console.log("PASS: app opens and counts when localStorage access is denied.");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
