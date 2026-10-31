import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ENTRIES,
  BY_ID,
  CATEGORIES,
  GUIDES,
  normalize,
  searchEntries,
  restoreLibrary,
  dailyEntry,
  malaysiaDay,
  offlineDocument,
  shareText,
  initialLibrary,
} from "./model.js";
test("all published content is verified and every category has readings", () => {
  assert(ENTRIES.length >= 50);
  assert(
    ENTRIES.every((e) => e.published && e.verification_status === "verified"),
  );
  for (const category of CATEGORIES.filter((c) => c.id !== "favourites"))
    assert(
      ENTRIES.some((e) => e.categories.includes(category.id)),
      category.name,
    );
  assert.equal(new Set(ENTRIES.map((e) => e.id)).size, ENTRIES.length);
});
test("search supports Malay, accents, Rumi, Arabic without vowel marks, categories and references", () => {
  assert(searchEntries("tidur").some((e) => e.id === "h-tidur"));
  assert(searchEntries("ibu bapa").some((e) => e.id === "quran-14-41"));
  assert(searchEntries("ámpun").length > 0);
  assert(
    searchEntries("subhanallahi wa bihamdih").some(
      (e) => e.id === "h-tasbih-pagi",
    ),
  );
  assert(searchEntries("سبحان الله").some((e) => e.id === "h-tasbih"));
  assert(searchEntries("2726").some((e) => e.id === "h-pagi-luas"));
  assert.equal(normalize("ٱلْحَمْدُ لِلَّهِ"), normalize("الحمد لله"));
});
test("favourites combine with search/source filters", () => {
  const fav = ["h-tidur", "quran-14-41"];
  assert.equal(searchEntries("", "favourites", "all", fav).length, 2);
  assert.equal(
    searchEntries("ibu", "favourites", "quran", fav)[0].id,
    "quran-14-41",
  );
  assert.equal(searchEntries("ibu", "favourites", "hadith", fav).length, 0);
});
test("saved preferences and reading progress are sanitized and survive serialization", () => {
  const s = initialLibrary();
  s.favourites = ["h-tidur"];
  s.sessions.pagi = { index: 2, counts: { "quran-112-1-4": 3 } };
  s.preferences.showMeaning = false;
  const r = restoreLibrary(JSON.parse(JSON.stringify(s)));
  assert.equal(r.sessions.pagi.index, 2);
  assert.equal(r.sessions.pagi.counts["quran-112-1-4"], 3);
  assert.equal(r.preferences.showMeaning, false);
  const invalid = restoreLibrary({
    version: 1,
    favourites: ["missing", "h-tidur", "h-tidur"],
    preferences: { arabicSize: Infinity },
    sessions: { pagi: { index: 999, counts: { "quran-112-1-4": 999 } } },
  });
  assert.deepEqual(invalid.favourites, ["h-tidur"]);
  assert.equal(invalid.preferences.arabicSize, 36);
  assert.equal(invalid.sessions.pagi.counts["quran-112-1-4"], 3);
});
test("morning/evening/post-prayer guides use published content and sourced counts", () => {
  for (const guide of GUIDES)
    for (const id of guide.ids) {
      const e = BY_ID[id];
      assert(e);
      if (e.recommended_count) assert(e.recommended_count_reference);
    }
  assert.equal(
    GUIDES.find((g) => g.id === "petang").ids.includes("h-pagi-luas"),
    false,
  );
  assert.equal(BY_ID["h-istighfar"].recommended_count, 3);
  assert.equal(BY_ID["h-takbir"].recommended_count, 33);
  assert.equal(BY_ID["h-tahlil-solat"].recommended_count, 1);
});
test("daily choice uses the Malaysian calendar date across UTC midnight and local midnight", () => {
  const before = new Date("2026-10-31T15:59:59Z"),
    after = new Date("2026-10-31T16:00:00Z");
  assert.equal(malaysiaDay(before), "2026-10-31");
  assert.equal(malaysiaDay(after), "2026-11-01");
  assert.notEqual(dailyEntry(before).id, dailyEntry(after).id);
  assert.equal(
    dailyEntry(new Date("2026-10-30T23:59:00Z")).id,
    dailyEntry(new Date("2026-10-31T00:01:00Z")).id,
  );
});
test("sharing and standalone offline document retain Arabic, meaning, source and licensing", () => {
  const e = BY_ID["h-tidur"];
  const shared = shareText(e, {
    origin: "https://example.com",
    pathname: "/titipandoa/",
  });
  assert(shared.includes(e.arabic_text));
  assert(shared.includes(e.source_reference));
  assert(shared.includes("/titipandoa/#doa/h-tidur"));
  const html = offlineDocument();
  assert(html.includes("CC BY-SA 4.0"));
  assert(!html.includes("<script"));
  assert.equal((html.match(/<article /g) || []).length, ENTRIES.length);
});
