const { clickDestination } = require("./navigation.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:5173/titipandoa/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  if (context.routeWebSocket)
    await context.routeWebSocket("**", (socket) => socket.close());
  await context.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "127.0.0.1"
      ? r.continue()
      : r.abort(),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await clickDestination(page, "Doa & Zikir");
  await page
    .getByRole("heading", { name: "Koleksi Doa & Zikrullah", exact: true })
    .waitFor();
  assert.equal(await page.locator(".library-result-card").count(), 54);
  for (const width of [320, 390, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `library overflow ${width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByPlaceholder("Cari doa, zikir atau kata kunci...")
    .fill("tidur");
  assert((await page.locator(".library-result-card").count()) >= 1);
  await page
    .getByRole("button", {
      name: "Simpan kegemaran Doa sebelum tidur",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Baca Doa sebelum tidur", exact: true })
    .click();
  assert.match(page.url(), /#doa\/h-tidur$/);
  await page.reload();
  await page
    .getByRole("heading", { name: "Doa sebelum tidur", exact: true })
    .waitFor();
  assert.equal(
    await page.locator(".library-reader [lang=ar]").getAttribute("dir"),
    "rtl",
  );
  await page.getByRole("button", { name: "Besarkan tulisan Arab" }).click();
  assert.equal(
    await page
      .locator(".library-arabic")
      .evaluate((e) => getComputedStyle(e).fontSize),
    "40px",
  );
  await page.getByLabel("Rumi", { exact: true }).uncheck();
  assert.equal(await page.locator(".reading-block").count(), 1);
  await page.getByRole("button", { name: "Mod bacaan", exact: true }).click();
  assert.equal(await page.locator(".library-read-mode").count(), 1);
  await page
    .getByRole("button", { name: "Keluar mod bacaan", exact: true })
    .click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Kongsi", exact: true }).click();
  assert.match(
    await page.locator(".manual-copy textarea").inputValue(),
    /Sahih al-Bukhari 6314/,
  );
  await page
    .getByRole("button", { name: "Kembali ke koleksi", exact: true })
    .click();
  await page.getByRole("button", { name: /Doa Kegemaran/ }).click();
  assert.equal(await page.locator(".library-result-card").count(), 1);
  await page
    .getByPlaceholder("Cari doa, zikir atau kata kunci...")
    .fill("ibu bapa");
  assert.equal(await page.locator(".library-result-card").count(), 0);
  await page
    .getByRole("button", { name: "Lihat semua bacaan", exact: true })
    .click();
  await page
    .getByPlaceholder("Cari doa, zikir atau kata kunci...")
    .fill("سبحان الله");
  assert((await page.locator(".library-result-card").count()) > 0);
  await page.getByRole("button", { name: "Kosongkan carian" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Muat turun bacaan luar talian", exact: true })
    .click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /\.html$/);
  await download.saveAs("/tmp/titipandoa-offline-test.html");
  await page
    .getByRole("button", { name: /Zikir Pagi.*bacaan berpandu/ })
    .click();
  await page
    .getByRole("heading", { name: "Surah al-Ikhlas", exact: true })
    .waitFor();
  await page.getByRole("button", { name: /Tandakan satu bacaan/ }).click();
  await page.reload();
  await page
    .getByRole("heading", { name: "Surah al-Ikhlas", exact: true })
    .waitFor();
  assert.match(
    await page.locator(".guided-reading-actions>.button-primary").innerText(),
    /^1 \/ 3/,
  );
  await context.setOffline(true);
  await page.getByRole("button", { name: /Tandakan satu bacaan/ }).click();
  assert.match(
    await page.locator(".guided-reading-actions>.button-primary").innerText(),
    /^2 \/ 3/,
  );
  await context.setOffline(false);
  await page
    .getByRole("button", { name: "Tandakan selesai", exact: true })
    .click();
  await page.getByRole("button", { name: "Seterusnya", exact: true }).click();
  await page
    .getByRole("heading", { name: "Surah al-Falaq", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Mulakan sesi semula", exact: true })
    .click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await page
    .getByRole("button", { name: "Kembali ke koleksi", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Zikir Selepas Solat.*bacaan berpandu/ })
    .click();
  await page
    .getByRole("heading", { name: "Istighfar selepas solat", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Buka dalam Tasbih Digital", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Gunakan zikir ini", exact: true })
    .click();
  assert.equal(await page.getByLabel("Pilih zikr").inputValue(), "istighfar");
  assert.match(await page.locator(".tasbih-counter-target").innerText(), /3/);
  await page.locator(".tasbih-counter").click();
  assert.equal(await page.locator(".tasbih-count").innerText(), "1");
  await clickDestination(page, "Doa & Zikir");
  await page
    .getByPlaceholder("Cari doa, zikir atau kata kunci...")
    .fill("2726");
  await page
    .getByRole("button", {
      name: "Baca Tasbih menurut keluasan ciptaan",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Buka dalam Tasbih Digital", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Gunakan zikir ini", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Pilih zikr").inputValue(),
    "library-h-pagi-luas",
  );
  assert.match(await page.locator(".tasbih-verse").innerText(), /رِضَا/);
  await clickDestination(page, "Doa & Zikir");
  await page
    .getByPlaceholder("Cari doa, zikir atau kata kunci...")
    .fill("tidur");
  await page
    .getByRole("button", { name: "Baca Doa sebelum tidur", exact: true })
    .click();
  await page.screenshot({
    path: "/tmp/library-reader-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 54 entries; navigation and deep-link reload; search; favourites and combined filters; mobile layouts; reading controls; sharing fallback; offline download; guided resume/offline counting; post-prayer and extended Tasbih handoff.",
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
        throw Error("blocked");
      },
    });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("blocked");
      },
    });
  });
  const p = await blocked.newPage();
  await p.goto(url + "#collection");
  await p
    .getByRole("button", {
      name: "Simpan kegemaran Doa sebelum tidur",
      exact: true,
    })
    .click();
  assert.match(
    await p.locator(".library-alert").innerText(),
    /Simpanan pelayar/,
  );
  console.log("PASS: library remains usable with denied storage.");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
