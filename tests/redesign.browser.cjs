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
const token = {
  access_token: "fixture-token",
  refresh_token: "fixture-refresh",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: "bearer",
  user: owner,
};
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const otpRequests = [];
    let serverOwner = owner;
    const writes = [],
      reads = [],
      errors = [];
    let rejectSubmit = true,
      rejectPatch = true,
      ownerAllowed = false;
    const records = Array.from({ length: 4 }, (_, i) => ({
      id: `fixture-${i}`,
      sender_name: `Private sender ${i}`,
      category: ["Kesihatan", "Rezeki", "Keluarga", "Ampunan"][i],
      message: `Doa peribadi ujian ${i}. Semoga dipermudahkan segala urusan.`,
      amin_count: 0,
      created_at: `2026-11-${10 + i}T07:00:00Z`,
      is_read: false,
      is_bookmarked: i === 0,
    }));
    let profile = {
      id: "default",
      display_name: "Jemaah Ujian",
      announcement: "Pesanan peribadi ujian.",
      welcome_message: "Tinggalkan di sini, saya bacakan di Tanah Suci.",
      departure_date: "2026-11-23",
      return_date: "2026-12-05",
      accepting_submissions: true,
      sharing_text: "Pesanan perkongsian ujian.",
    };
    async function mock(c) {
      if (c.routeWebSocket) await c.routeWebSocket("**", (s) => s.close());
      await c.route("**/*", async (r) => {
        const req = r.request(),
          u = new URL(req.url());
        if (u.hostname === "127.0.0.1") return r.continue();
        const reply = (body, status = 200) =>
          r.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify(body),
          });
        if (u.pathname.endsWith("/auth/v1/otp")) {
          otpRequests.push(req.postDataJSON());
          return reply({});
        }
        if (u.pathname.endsWith("/auth/v1/user"))
          return ownerAllowed
            ? reply(serverOwner)
            : reply({ message: "denied" }, 401);
        if (!u.pathname.includes("/rest/v1/")) return r.abort();
        const table = u.pathname.split("/").pop(),
          method = req.method();
        if (method === "GET") {
          reads.push(table);
          if (table === "tumpangdoa_public_profile") return reply(profile);
          if (!ownerAllowed && table !== "tumpangdoa_public_profile")
            return reply({ message: "denied", code: "42501" }, 403);
          if (table === "doas") return reply(records);
          return reply([]);
        }
        const body = req.postDataJSON();
        writes.push({ table, method, body });
        if (table === "doas" && method === "POST")
          return rejectSubmit
            ? reply(
                { message: "Server ujian tidak tersedia", code: "test_error" },
                503,
              )
            : reply(null, 201);
        if (!ownerAllowed)
          return reply({ message: "denied", code: "42501" }, 403);
        if (table === "doas" && method === "PATCH") {
          if (rejectPatch)
            return reply({ message: "Status belum disimpan" }, 503);
          const row = records.find(
            (x) => x.id === u.searchParams.get("id")?.slice(3),
          );
          Object.assign(row, body);
          return reply([{ id: row.id, is_read: row.is_read }]);
        }
        if (table === "tumpangdoa_public_profile") {
          profile = { ...profile, ...body };
          return reply(null, 201);
        }
        return r.abort();
      });
    }
    const c = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await mock(c);
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => d.accept());
    await p.goto(url);
    await p
      .getByRole("heading", { name: "Ada doa nak dikirim?", exact: true })
      .waitFor();
    assert.equal(await p.locator(".bottom-navigation").isVisible(), false);
    assert.equal(reads.includes("doas"), false);
    assert.equal(
      await p.getByText("Private sender 0", { exact: true }).count(),
      0,
    );
    for (const width of [320, 390, 430, 768, 1024, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `public overflow ${width}`,
      );
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.getByRole("button", { name: "Gunakan tema gelap" }).click();
    await p.reload();
    await p.locator(".prayer-form").waitFor();
    assert.equal(await p.locator(".td-app").getAttribute("data-theme"), "dark");
    await p.screenshot({
      path: "/tmp/tumpang-dark-mobile.png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Gunakan tema cerah" }).click();
    await p.getByText("Tak pasti nak tulis apa?", { exact: true }).click();
    await p.getByRole("button", { name: "Gunakan sebagai draf" }).click();
    assert((await p.locator("#prayer-message").inputValue()).length > 0);
    assert.equal(writes.length, 0);
    await p
      .locator("#prayer-message")
      .fill("Doa tanpa nama untuk semakan ujian sahaja.");
    await p.getByRole("button", { name: "Hantar Doa", exact: true }).click();
    await p
      .getByText("Doa disimpan, menunggu pengesahan.", { exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("heading", {
          name: "Alhamdulillah, doa anda telah diterima.",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(writes[0].body.sender_name, "Tanpa nama");
    assert.equal(
      await p
        .getByRole("button", { name: "Menunggu penyegerakan", exact: true })
        .isDisabled(),
      true,
    );
    rejectSubmit = false;
    await p.getByRole("button", { name: "Semak status kiriman" }).click();
    assert.equal(
      await p.getByText("Privasi pada peranti", { exact: true }).count(),
      0,
    );
    await p.getByRole("button", { name: "Cuba semula", exact: true }).click();
    await p
      .getByRole("button", { name: "Utama — Tumpang Doa", exact: true })
      .click();
    await p
      .getByRole("heading", {
        name: "Alhamdulillah, doa anda telah diterima.",
        exact: true,
      })
      .waitFor();
    const submits = writes.filter(
      (w) => w.table === "doas" && w.method === "POST",
    );
    assert.equal(submits.length, 2);
    assert.equal(submits[0].body.id, submits[1].body.id);
    await p.getByRole("button", { name: "Hantar Doa Lain" }).click();
    assert.equal(await p.locator("#prayer-message").inputValue(), "");
    await p.evaluate(() =>
      localStorage.setItem("titipandoa_owner_authenticated", "true"),
    );
    await p.goto(url + "?admin=true#owner");
    await p.getByRole("dialog").waitFor();
    assert.equal(await p.locator(".owner-space").count(), 0);
    assert.equal(reads.includes("doas"), false);
    assert.equal(await p.locator("input[type=password]").count(), 0);
    await p
      .getByLabel("E-mel pemilik", { exact: true })
      .fill("owner@example.invalid");
    await p
      .getByRole("button", { name: "Hantar pautan log masuk", exact: true })
      .click();
    await p
      .getByRole("status")
      .filter({ hasText: "Jika akaun tersedia" })
      .waitFor();
    assert.equal(otpRequests[0].create_user, false);
    await p.getByRole("button", { name: "Tutup akses jemaah" }).click();
    await p.screenshot({
      path: "/tmp/tumpang-public-mobile.png",
      fullPage: true,
    });
    await c.close();
    ownerAllowed = true;
    serverOwner = { ...owner, app_metadata: { titipandoa_role: "viewer" } };
    const denied = await browser.newContext();
    await mock(denied);
    await denied.addInitScript(
      ({ authKey, token }) =>
        localStorage.setItem(authKey, JSON.stringify(token)),
      { authKey, token },
    );
    const dp = await denied.newPage();
    await dp.goto(url + "#owner");
    await dp.getByRole("dialog").waitFor();
    assert.equal(await dp.locator(".owner-space").count(), 0);
    assert.equal(reads.includes("doas"), false);
    await denied.close();
    serverOwner = owner;
    const oc = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await mock(oc);
    await oc.addInitScript(
      ({ authKey, token }) => {
        if (!sessionStorage.getItem("fixture-auth-seeded")) {
          localStorage.setItem(authKey, JSON.stringify(token));
          sessionStorage.setItem("fixture-auth-seeded", "true");
        }
      },
      { authKey, token },
    );
    const op = await oc.newPage();
    op.on("dialog", (d) => d.accept());
    op.on("pageerror", (e) => errors.push(e.message));
    await op.goto(url + "#owner");
    await op.locator(".prayer-inbox article").first().waitFor();
    assert.equal(await op.locator(".prayer-inbox article").count(), 4);
    await op.setViewportSize({width:320,height:844});
    assert(await op.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'owner inbox overflow 320');
    await op.setViewportSize({width:390,height:844});
    await op
      .getByRole("button", { name: "Tandakan Sudah Dibaca", exact: true })
      .first()
      .click();
    await op
      .getByRole("status")
      .filter({ hasText: "Status belum disimpan" })
      .waitFor();
    assert.equal(
      await op
        .getByRole("button", {
          name: "Dibacakan · Batalkan tanda",
          exact: true,
        })
        .count(),
      0,
    );
    rejectPatch = false;
    await op
      .getByRole("button", { name: "Tandakan Sudah Dibaca", exact: true })
      .first()
      .click();
    await op
      .getByRole("button", { name: "Dibacakan · Batalkan tanda", exact: true })
      .waitFor();
    await op
      .getByRole("button", { name: "Dibacakan · Batalkan tanda", exact: true })
      .click();
    await op
      .getByRole("button", { name: "Dibacakan · Batalkan tanda", exact: true })
      .waitFor({ state: "hidden" });
    await op.getByLabel("Status bacaan", { exact: true }).selectOption("read");
    assert.equal(await op.locator(".prayer-inbox article").count(), 0);
    await op.getByLabel("Status bacaan", { exact: true }).selectOption("");
    await op
      .getByRole("textbox", { name: "Cari doa", exact: true })
      .fill("sender 1");
    assert.equal(await op.locator(".prayer-inbox article").count(), 1);
    await op.getByRole("textbox", { name: "Cari doa", exact: true }).fill("");
    await op
      .getByRole("button", { name: "Mod Bacaan", exact: true })
      .first()
      .click();
    await op.locator(".prayer-reader article").waitFor();
    const before = await op.locator(".prayer-reader h1").innerText();
    await op.getByRole("button", { name: "Seterusnya", exact: true }).click();
    const resumed = await op.locator(".prayer-reader h1").innerText();
    assert.notEqual(before, resumed);
    await op.getByRole("button", { name: "Besarkan teks" }).click();
    await op.getByRole("button", { name: "Senarai Doa", exact: true }).click();
    await op
      .getByRole("button", { name: "Mod Bacaan", exact: true })
      .first()
      .click();
    assert.equal(await op.locator(".prayer-reader h1").innerText(), resumed);
    assert.equal(
      await op
        .locator(".prayer-reader article p")
        .evaluate((e) => getComputedStyle(e).fontSize),
      "28px",
    );
    assert.equal(records.filter((r) => r.is_read).length, 0);
    await op.getByRole("button", { name: "Senarai Doa", exact: true }).click();
    await op.getByRole("button", { name: "Kongsi Pautan & Tetapan" }).click();
    await op.locator(".owner-settings form").waitFor();
    assert.equal(await op.locator(".share-panel code").innerText(), url);
    await op
      .getByLabel("Pesanan peribadi", { exact: true })
      .fill("Pesanan perjalanan yang dikemas kini.");
    await op.getByRole("button", { name: "Simpan Tetapan" }).click();
    await op
      .getByText("Tetapan disahkan dan disimpan.", { exact: true })
      .waitFor();
    assert.equal(profile.announcement, "Pesanan perjalanan yang dikemas kini.");
    const share = await op
      .getByRole("link", { name: "WhatsApp", exact: true })
      .getAttribute("href");
    assert(decodeURIComponent(share).includes(url));
    assert(!decodeURIComponent(share).includes("#owner"));
    await op
      .getByRole("button", { name: "Senarai Doa", exact: true })
      .first()
      .click();
    await op
      .getByRole("button", { name: "Muat turun untuk luar talian" })
      .click();
    await op.getByLabel("Titipan doa peribadi", { exact: true }).check();
    await op
      .getByRole("button", {
        name: "Muat Turun untuk Kegunaan Offline",
        exact: true,
      })
      .click();
    await op.locator(".offline-ready").waitFor();
    await oc.setOffline(true);
    await op.goto(url + "#owner");
    // Expired Auth tokens must not require a network refresh to read an explicit trusted-device snapshot.
    await op.evaluate(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            access_token: "expired-fixture",
            refresh_token: "expired-fixture",
            expires_at: 1,
            expires_in: 0,
            token_type: "bearer",
            user: { id: "11111111-1111-4111-8111-111111111111" },
          }),
        ),
      authKey,
    );
    await op.reload();
    await op
      .getByRole("button", { name: "Mod Bacaan", exact: true })
      .first()
      .waitFor();
    await op
      .getByRole("button", { name: "Mod Bacaan", exact: true })
      .first()
      .click();
    await op.locator(".prayer-reader article").waitFor();
    assert.equal(await op.locator(".prayer-reader h1").innerText(), resumed);
    assert.equal(records.filter((r) => r.is_read).length, 0);
    for (const width of [320, 390, 430, 844]) {
      await op.setViewportSize({ width, height: 844 });
      assert(
        await op.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `owner overflow ${width}`,
      );
    }
    await op.setViewportSize({ width: 390, height: 844 });
    await op.screenshot({
      path: "/tmp/tumpang-owner-reader.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    await oc.close();
    console.log(
      "PASS: public-only invitation; optional anonymous submission; editable examples; server failure/pending/acknowledgment; stable retry ID; PIN and URL flags denied; verified owner inbox, filtering, read/undo; resumable offline reader; text size; profile settings and safe sharing; dark theme and responsive 320–1440px layouts.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
