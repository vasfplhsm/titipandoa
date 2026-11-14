import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { INTRO_NOTE } from "./intro-note.js";
const original = JSON.parse(
  readFileSync(
    new URL("../../tests/fixtures/original-intro-note.json", import.meta.url),
    "utf8",
  ),
);
test("original 11-paragraph personal Umrah announcement is verbatim and in historic order", () => {
  assert.equal(INTRO_NOTE.length, 11);
  assert.deepEqual(INTRO_NOTE, original);
  assert.equal(
    createHash("sha256").update(JSON.stringify(INTRO_NOTE)).digest("hex"),
    "8267ecfe5ba5ddc7505d6a95849eb5eed2e049bde1bbcffc8cb6d47c72223b15",
  );
  assert(Object.isFrozen(INTRO_NOTE));
  assert(INTRO_NOTE[1].includes("23 November 2026"));
});
