import { test } from "node:test";
import assert from "node:assert/strict";
import {
  THEMES,
  APPEARANCE_KEY,
  PALETTE_KEY,
  selectPreferences,
  resolveAppearance,
  themeVariables,
} from "./model.js";
function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const l1 = luminance(a),
    l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
test("all six theme variants keep text and primary controls at WCAG AA contrast", () => {
  for (const theme of THEMES)
    for (const mode of ["light", "dark"]) {
      const colors = theme[mode];
      for (const surface of ["background", "surface", "soft"])
        for (const text of ["ink", "muted", "primary"])
          assert(
            contrast(colors[text], colors[surface]) >= 4.5,
            `${theme.id} ${mode} ${text}/${surface}: ${contrast(colors[text], colors[surface]).toFixed(2)}`,
          );
      assert(
        contrast(colors.onPrimary, colors.primary) >= 4.5,
        `${theme.id} ${mode} primary button contrast`,
      );
    }
});
test("public theme defaults and independent local overrides are isolated", () => {
  assert.deepEqual(selectPreferences(), {
    palette: "rosewood",
    appearance: "light",
  });
  assert.deepEqual(selectPreferences("coastal", "system"), {
    palette: "coastal",
    appearance: "system",
  });
  assert.deepEqual(selectPreferences("coastal", "system", "sage"), {
    palette: "sage",
    appearance: "system",
  });
  assert.deepEqual(selectPreferences("coastal", "system", null, "dark"), {
    palette: "coastal",
    appearance: "dark",
  });
  assert.deepEqual(selectPreferences("sage", "dark", "", ""), {
    palette: "sage",
    appearance: "dark",
  });
});
test("untrusted stored/public values cannot become theme attributes", () => {
  assert.deepEqual(
    selectPreferences("__proto__", "unexpected", "constructor", "DARK"),
    { palette: "rosewood", appearance: "light" },
  );
  assert.deepEqual(
    selectPreferences("rosewood", "light", { id: "sage" }, ["dark"]),
    { palette: "rosewood", appearance: "light" },
  );
});
test("system appearance follows device changes without replacing the saved preference", () => {
  assert.equal(resolveAppearance("system", false), "light");
  assert.equal(resolveAppearance("system", true), "dark");
  assert.equal(resolveAppearance("light", true), "light");
  assert.equal(resolveAppearance("dark", false), "dark");
  assert.equal(APPEARANCE_KEY, "titipandoa.theme");
  assert.equal(PALETTE_KEY, "titipandoa.palette");
});
test("CSS variables describe only colors and cannot mutate application records", () => {
  for (const theme of THEMES) {
    const vars = themeVariables(theme.id, "dark");
    assert.equal(vars["--theme-primary"], theme.dark.primary);
    assert.equal(vars["--theme-background"], theme.dark.background);
    assert(
      Object.entries(vars).every(
        ([key, value]) =>
          key.startsWith("--theme-") && /^#[0-9a-f]{6}$/i.test(value),
      ),
    );
  }
});
