import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validatePrayer,
  filterPrayers,
  cleanProfile,
  publicURL,
  ANNOUNCEMENT,
} from "./model.js";
test("anonymous prayer input accepts optional names and categories but enforces bounds", () => {
  assert.equal(validatePrayer("", "Doa peribadi.", ""), "");
  assert.match(validatePrayer("", "  ", ""), /Tuliskan/);
  assert.match(validatePrayer("a".repeat(201), "Doa", ""), /Nama/);
  assert.match(validatePrayer("", "a".repeat(10001), ""), /panjang/);
  assert.match(validatePrayer("", "Doa", "arbitrary"), /kategori/);
});
test("profile exposes only public fields and preserves explicit closed inbox", () => {
  const result = cleanProfile({
    display_name: "a".repeat(220),
    accepting_submissions: false,
    flights: { secret: true },
    budget: 500,
    announcement: "Pesanan",
  });
  assert.equal(result.display_name.length, 200);
  assert.equal(result.accepting_submissions, false);
  assert.equal(result.flights, undefined);
  assert.equal(result.budget, undefined);
  assert.equal(cleanProfile().announcement, ANNOUNCEMENT);
});
test("inbox preserves historical categories and supports name/message, read filters and chronological order", () => {
  const rows = [
    {
      id: 1,
      sender_name: "Ibu",
      message: "Kesihatan",
      category: "Ampunan",
      is_read: true,
      created_at: "2026-11-10",
    },
    {
      id: 2,
      sender_name: null,
      message: "Keluarga",
      category: "Keluarga",
      is_read: false,
      created_at: "2026-11-11",
    },
  ];
  assert.equal(filterPrayers(rows, "IBU", "Ampunan", "read")[0].id, 1);
  assert.equal(filterPrayers(rows, "keluarga", "", "unread")[0].id, 2);
  assert.deepEqual(
    filterPrayers(rows).map((r) => r.id),
    [2, 1],
  );
  assert.deepEqual(
    filterPrayers(rows, "", "", "", true).map((r) => r.id),
    [1, 2],
  );
  assert.equal(rows[0].is_read, true);
});
test("public share links retain root or Pages subpath and remove owner query/fragment", () => {
  assert.equal(
    publicURL(new URL("https://example.com/titipandoa/?admin=true#owner")),
    "https://example.com/titipandoa/",
  );
  assert.equal(
    publicURL(new URL("https://example.com/?admin=true#owner")),
    "https://example.com/",
  );
});
