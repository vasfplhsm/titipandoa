const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { clickDestination } = require("./navigation.cjs");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:4177/titipandoa/";
(async () => {
  const original = fs.readFileSync("dist/sw.js", "utf8");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await c.route("**/*", (r) =>
      new URL(r.request().url()).hostname === "127.0.0.1"
        ? r.continue()
        : r.abort(),
    );
    const p = await c.newPage();
    p.on("dialog", (d) => d.accept());
    await p.goto(url);
    await p
      .getByRole("heading", { name: "Ada doa nak dikirim?", exact: true })
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
    await clickDestination(p, "Titip Doa");
    await p
      .getByPlaceholder("Nama anda (pilihan)")
      .fill("Draf sebelum kemas kini");
    const changed = original.replace(
      /const VERSION = "[^"]+"/,
      `const VERSION = "test-update-${Date.now()}"`,
    );
    assert.notEqual(changed, original);
    fs.writeFileSync("dist/sw.js", changed);
    await p.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });
    await p
      .getByText("Versi baharu Tumpang Doa tersedia.", { exact: true })
      .waitFor({ timeout: 30000 });
    await p.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open("titipandoa-offline");
          open.onsuccess = () => {
            const tx = open.result.transaction("outbox", "readwrite");
            tx.objectStore("outbox").put({
              id: "update-test",
              kind: "test",
              status: "blocked",
              createdAt: Date.now(),
            });
            tx.oncomplete = () => {
              window.dispatchEvent(new Event("titipandoa:offline-change"));
              resolve();
            };
          };
        }),
    );
    await p.waitForFunction(
      () => document.querySelector(".pwa-update button")?.disabled,
    );
    assert.equal(
      await p
        .getByRole("button", { name: "Kemas kini dengan selamat" })
        .isDisabled(),
      true,
    );
    await p.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open("titipandoa-offline");
          open.onsuccess = () => {
            const tx = open.result.transaction("outbox", "readwrite");
            tx.objectStore("outbox").delete("update-test");
            tx.oncomplete = () => {
              window.dispatchEvent(new Event("titipandoa:offline-change"));
              resolve();
            };
          };
        }),
    );
    await p.waitForFunction(
      () =>
        document.querySelector(".pwa-update button") &&
        !document.querySelector(".pwa-update button").disabled,
    );
    await p.getByRole("button", { name: "Kemas kini dengan selamat" }).click();
    await p
      .getByRole("heading", { name: "Ada doa nak dikirim?", exact: true })
      .waitFor({ timeout: 30000 });
    await clickDestination(p, "Titip Doa");
    assert.equal(
      await p.getByPlaceholder("Nama anda (pilihan)").inputValue(),
      "Draf sebelum kemas kini",
    );
    const caches = await p.evaluate(() => window.caches.keys());
    assert.equal(
      caches.filter((key) => key.startsWith("titipandoa-shell-")).length,
      1,
    );
    console.log(
      "PASS: real waiting worker detected; pending operations block update; explicit draft save survives activation/reload; old app cache removed.",
    );
  } finally {
    fs.writeFileSync("dist/sw.js", original);
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
