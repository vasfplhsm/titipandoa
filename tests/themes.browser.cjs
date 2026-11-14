const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { clickDestination } = require("./navigation.cjs");
const url = process.env.TASBIH_TEST_URL || "http://127.0.0.1:4177/titipandoa/";
const original = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures/original-intro-note.json"),
    "utf8",
  ),
);
const authKey =
  "sb-" +
  new URL(process.env.VITE_SUPABASE_URL).hostname.split(".")[0] +
  "-auth-token";
const owner = {
  id: "22222222-2222-4222-8222-222222222222",
  aud: "authenticated",
  role: "authenticated",
  email: "theme-owner@example.invalid",
  app_metadata: { titipandoa_role: "owner" },
  user_metadata: {},
};
const token = {
  access_token: "fixture-theme-token",
  refresh_token: "fixture-refresh",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: "bearer",
  user: owner,
};
const themeNames = {
  rosewood: "Rosewood & Champagne",
  sage: "Sage & Sand",
  coastal: "Coastal Serenity",
};
const lightColors = {
  rosewood: ["#713F4B", "#F9F3EC"],
  sage: ["#496356", "#FAF7F0"],
  coastal: ["#28575C", "#F5F9F7"],
};
function profile(palette = "rosewood", appearance = "light") {
  return {
    id: "default",
    display_name: "",
    announcement: "",
    welcome_message: "Tinggalkan di sini, saya bacakan di Tanah Suci.",
    departure_date: "",
    return_date: "",
    accepting_submissions: true,
    sharing_text: "Pesanan perkongsian ujian.",
    public_theme: palette,
    public_appearance: appearance,
  };
}
async function waitTheme(page, palette, appearance) {
  await page.waitForFunction(
    ({ palette, appearance }) => {
      const app = document.querySelector(".td-app");
      return (
        app?.dataset.palette === palette && app.dataset.theme === appearance
      );
    },
    { palette, appearance },
  );
}
async function assertAnnouncement(page) {
  await page
    .getByRole("heading", { name: "Assalamualaikum w.b.t.", exact: true })
    .waitFor();
  assert.deepEqual(
    await page
      .locator(".original-announcement [data-intro-paragraph]")
      .allTextContents(),
    original,
  );
  for (const p of await page
    .locator(".original-announcement [data-intro-paragraph]")
    .all())
    assert(await p.isVisible());
  assert.equal(await page.locator(".original-announcement details").count(), 0);
  assert.equal(await page.locator(".prayer-form").count(), 0);
  assert(
    await page.evaluate(() => {
      const last = document.querySelector(
          ".original-announcement [data-intro-paragraph]:last-child",
        ),
        cta = document.querySelector(".prayer-invitation button");
      return Boolean(
        last.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
  );
}
async function stored(page, store, id) {
  return page.evaluate(
    ({ store, id }) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("titipandoa-offline");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(store),
            req = tx.objectStore(store).get(id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          tx.oncomplete = () => db.close();
        };
      }),
    { store, id },
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const server = {
      profile: profile(),
      rejectPublish: true,
      writes: [],
      privateReads: [],
    };
    async function context({
      signedIn = false,
      seed,
      viewport = { width: 390, height: 844 },
    } = {}) {
      const c = await browser.newContext({ viewport, serviceWorkers: "block" });
      if (c.routeWebSocket) await c.routeWebSocket("**", (s) => s.close());
      if (signedIn)
        await c.addInitScript(
          ({ authKey, token }) => {
            if (!sessionStorage.getItem("theme-auth-seeded")) {
              localStorage.setItem(authKey, JSON.stringify(token));
              sessionStorage.setItem("theme-auth-seeded", "1");
            }
          },
          { authKey, token },
        );
      if (seed) await c.addInitScript(seed);
      await c.route("**/*", async (route) => {
        const req = route.request(),
          u = new URL(req.url());
        if (u.hostname === "127.0.0.1") return route.continue();
        const reply = (data, status = 200) =>
          route.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify(data),
          });
        if (u.pathname.endsWith("/auth/v1/user"))
          return signedIn
            ? reply(owner)
            : reply({ message: "unauthorized" }, 401);
        if (!u.pathname.includes("/rest/v1/")) return route.abort();
        const table = u.pathname.split("/").pop(),
          method = req.method();
        if (method === "GET") {
          if (table === "tumpangdoa_public_profile")
            return reply(server.profile);
          server.privateReads.push({ table, signedIn });
          return signedIn
            ? reply([])
            : reply({ code: "42501", message: "denied" }, 403);
        }
        const body = req.postDataJSON();
        server.writes.push({ table, method, body });
        if (!signedIn) return reply({ code: "42501", message: "denied" }, 403);
        if (table === "tumpangdoa_public_profile" && method === "PATCH") {
          const publishing =
            Object.hasOwn(body, "public_theme") ||
            Object.hasOwn(body, "public_appearance");
          if (publishing) {
            if (server.rejectPublish)
              return reply(
                { code: "42501", message: "Theme save denied" },
                403,
              );
            assert.deepEqual(Object.keys(body).sort(), [
              "public_appearance",
              "public_theme",
            ]);
          } else {
            assert(!Object.hasOwn(body, "public_theme"));
            assert(!Object.hasOwn(body, "public_appearance"));
          }
          server.profile = { ...server.profile, ...body };
          return reply(server.profile);
        }
        return route.abort();
      });
      const p = await c.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("dialog", (d) => d.accept());
      return { c, p };
    }
    // Every server-selected palette and appearance applies on a fresh visitor without local overrides.
    for (const palette of Object.keys(themeNames))
      for (const appearance of ["light", "dark"]) {
        server.profile = profile(palette, appearance);
        const { c, p } = await context();
        await p.goto(url);
        await waitTheme(p, palette, appearance);
        await assertAnnouncement(p);
        const colors = await p.locator(".td-app").evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            primary: s.getPropertyValue("--primary").trim().toUpperCase(),
            background: s.getPropertyValue("--background").trim().toUpperCase(),
            actual: s.backgroundColor,
          };
        });
        if (appearance === "light") {
          assert.equal(colors.primary, lightColors[palette][0]);
          assert.equal(colors.background, lightColors[palette][1]);
        } else assert.notEqual(colors.background, lightColors[palette][1]);
        const meta = await p
          .locator('meta[name="theme-color"]')
          .getAttribute("content");
        assert.equal(
          meta.toUpperCase(),
          appearance === "dark" ? colors.background : colors.primary,
        );
        for (const width of [320, 390, 430, 844]) {
          await p.setViewportSize({ width, height: 844 });
          assert(
            await p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${palette}/${appearance} overflow ${width}`,
          );
        }
        if (appearance === "light") {
          await p.setViewportSize({ width: 390, height: 844 });
          await p.screenshot({
            path: `/tmp/theme-${palette}-mobile.png`,
            fullPage: true,
          });
          await p.setViewportSize({ width: 1440, height: 1000 });
          await p.screenshot({
            path: `/tmp/theme-${palette}-desktop.png`,
            fullPage: true,
          });
        }
        await p
          .getByRole("button", { name: "Tumpang Doa", exact: true })
          .click();
        await p
          .getByRole("heading", { name: "Borang Tumpang Doa", exact: true })
          .waitFor();
        assert.equal(await p.locator(".prayer-form").count(), 1);
        if (palette === "rosewood" && appearance === "light") {
          await p.setViewportSize({ width: 390, height: 844 });
          await p.screenshot({
            path: "/tmp/theme-submission.png",
            fullPage: true,
          });
        }
        await p
          .locator("#prayer-message")
          .fill("Draf peribadi yang tidak dihantar.");
        await p.locator(".site-brand").click();
        await assertAnnouncement(p);
        assert.equal(server.writes.length, 0);
        await c.close();
      }
    assert.equal(
      server.privateReads.some((r) => !r.signedIn),
      false,
    );
    // Follow-device reacts to the media query, while a visitor's explicit choice remains local.
    server.profile = profile("coastal", "system");
    const device = await context();
    await device.p.emulateMedia({ colorScheme: "light" });
    await device.p.goto(url);
    await waitTheme(device.p, "coastal", "light");
    await device.p.emulateMedia({ colorScheme: "dark" });
    await waitTheme(device.p, "coastal", "dark");
    await device.p
      .getByRole("button", { name: "Gunakan tema cerah", exact: true })
      .click();
    await waitTheme(device.p, "coastal", "light");
    await device.p.reload();
    await waitTheme(device.p, "coastal", "light");
    assert.equal(server.writes.length, 0);
    await device.c.close();
    // Existing appearance/counter/history state migrates to IndexedDB without a reset.
    server.profile = profile("sage", "light");
    const legacy = await context({
      seed: () => {
        if (!sessionStorage.getItem("legacy-seeded")) {
          localStorage.setItem("titipandoa.theme", "dark");
          localStorage.setItem(
            "titipandoa.tasbih.v1",
            JSON.stringify({
              version: 1,
              selected: "subhanallah",
              sessions: {
                subhanallah: { count: 27, target: 33, started: 1, elapsed: 0 },
              },
              custom: [],
              history: [
                {
                  title: "Sesi sedia ada",
                  count: 12,
                  date: "2026-11-14T00:00:00Z",
                },
              ],
              guided: null,
              settings: {
                theme: "dark",
                vibration: false,
                sound: false,
                defaultTarget: 33,
                confirmReset: true,
              },
            }),
          );
          sessionStorage.setItem("legacy-seeded", "1");
        }
      },
    });
    await legacy.p.goto(url);
    await waitTheme(legacy.p, "sage", "dark");
    await clickDestination(legacy.p, "Tasbih Digital");
    assert.equal(await legacy.p.locator(".tasbih-count").innerText(), "27");
    assert.equal(
      (await stored(legacy.p, "preferences", "titipandoa.theme")).value,
      "dark",
    );
    const preserved = JSON.parse(
      (await stored(legacy.p, "tasbih", "titipandoa.tasbih.v1")).value,
    );
    assert.equal(preserved.sessions.subhanallah.count, 27);
    assert.equal(preserved.history[0].title, "Sesi sedia ada");
    await legacy.c.close();
    // Local theme changes preserve the owner route/draft and never publish implicitly.
    server.profile = profile("rosewood", "light");
    const { c: oc, p: op } = await context({ signedIn: true });
    await op.goto(url + "#owner");
    await op.locator(".owner-space").waitFor();
    await op.getByRole("button", { name: "Tetapan", exact: true }).click();
    await op
      .getByRole("heading", { name: "Tema & Penampilan", exact: true })
      .waitFor();
    await op
      .getByLabel("Pesanan peribadi", { exact: true })
      .fill("Draf tetapan yang belum disimpan.");
    const startWrites = server.writes.length;
    await op
      .getByRole("button", {
        name: "Gunakan Tema Coastal Serenity",
        exact: true,
      })
      .click();
    await op.getByRole("radio", { name: "Gelap", exact: true }).check();
    await waitTheme(op, "coastal", "dark");
    await op.screenshot({
      path: "/tmp/theme-owner-settings.png",
      fullPage: true,
    });
    assert(await op.locator(".owner-settings").isVisible());
    assert.equal(
      await op.getByLabel("Pesanan peribadi", { exact: true }).inputValue(),
      "Draf tetapan yang belum disimpan.",
    );
    assert.equal(server.writes.length, startWrites);
    await op
      .getByRole("button", { name: "Jadikan tema awam", exact: true })
      .click();
    await op
      .locator(".public-theme-settings [role=status]")
      .filter({ hasText: "Tema awam belum disimpan." })
      .waitFor();
    assert.equal(server.profile.public_theme, "rosewood");
    assert.equal(
      await op
        .getByText(
          "Tema awam disahkan dan disimpan. Pelawat baharu akan melihat pilihan ini.",
          { exact: true },
        )
        .count(),
      0,
    );
    server.rejectPublish = false;
    await op
      .getByRole("button", { name: "Jadikan tema awam", exact: true })
      .click();
    await op
      .locator(".public-theme-settings [role=status]")
      .filter({ hasText: "Tema awam disahkan dan disimpan." })
      .waitFor();
    assert.equal(server.profile.public_theme, "coastal");
    assert.equal(server.profile.public_appearance, "dark");
    assert.equal(
      await op.getByLabel("Pesanan peribadi", { exact: true }).inputValue(),
      "Draf tetapan yang belum disimpan.",
    );
    await op
      .getByRole("button", { name: "Simpan Tetapan", exact: true })
      .click();
    await op
      .getByText("Tetapan disahkan dan disimpan.", { exact: true })
      .waitFor();
    assert.equal(server.profile.public_theme, "coastal");
    const newcomer = await context();
    await newcomer.p.goto(url);
    await waitTheme(newcomer.p, "coastal", "dark");
    await assertAnnouncement(newcomer.p);
    await newcomer.c.close();
    // Changing the public default cannot erase the explicitly stored local palette; reset follows it.
    await op
      .getByRole("button", { name: "Gunakan Tema Sage & Sand", exact: true })
      .click();
    await waitTheme(op, "sage", "dark");
    await op.reload();
    await waitTheme(op, "sage", "dark");
    await op.getByRole("button", { name: "Tetapan", exact: true }).click();
    await op
      .getByRole("heading", { name: "Tema & Penampilan", exact: true })
      .waitFor();
    const beforeReset = server.writes.length;
    await op
      .getByRole("button", { name: "Ikut Tema Awam", exact: true })
      .click();
    await waitTheme(op, "coastal", "dark");
    assert.equal(server.writes.length, beforeReset);
    await oc.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: original 11 paragraphs and order; no collapsed announcement; form opens only after the final invitation; all three palettes/light/dark and responsive layouts; device appearance updates; local overrides and legacy persistence; preserved counters/history; explicit verified public-theme publish failure/success; fresh visitor defaults; settings draft preserved; no implicit backend writes.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
