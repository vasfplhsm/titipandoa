import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const data = JSON.parse(
  fs.readFileSync(new URL("../src/library/entries.json", import.meta.url)),
);
const proof = JSON.parse(
  fs.readFileSync(new URL("../content/source-excerpts.json", import.meta.url)),
);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const normal = (s) => s.normalize("NFKD").replace(/\p{M}|[^\p{L}\p{N}]/gu, "");
const pending = JSON.parse(
  fs.readFileSync(new URL("../content/pending.json", import.meta.url)),
);
const decisions = JSON.parse(
  fs.readFileSync(new URL("../content/count-decisions.json", import.meta.url)),
);
for (const item of Object.values(proof))
  assert.equal(sha(item.text), item.sha256, "Source snapshot changed");
const seen = new Set(),
  texts = new Set();
for (const entry of data) {
  assert(!seen.has(entry.id), "Duplicate id " + entry.id);
  seen.add(entry.id);
  assert(!texts.has(normal(entry.arabic_text)), "Duplicate Arabic " + entry.id);
  texts.add(normal(entry.arabic_text));
  for (const key of [
    "title_ms",
    "arabic_text",
    "translation_ms",
    "source_reference",
    "source_url",
    "source_authenticity_note",
    "description_ms",
    "verified_at",
  ])
    assert(entry[key], entry.id + " missing " + key);
  assert(
    !entry.arabic_text.includes("\ufffd"),
    "Corrupted source text " + entry.id,
  );
  assert.equal(
    sha(entry.arabic_text),
    entry.arabic_sha256,
    "Arabic changed " + entry.id,
  );
  const source = proof[entry.proof_key];
  assert(source, "Missing source " + entry.id);
  assert.equal(sha(source.text), source.sha256, "Source changed " + entry.id);
  assert(
    source.text.includes(entry.arabic_text),
    "Arabic not verbatim source substring " + entry.id,
  );
  assert(
    entry.categories.length &&
      entry.categories.every((c) =>
        [
          "harian",
          "quran",
          "pagi",
          "petang",
          "solat",
          "ampun",
          "tenang",
          "kesihatan",
          "keluarga",
          "ilmu",
          "rezeki",
          "perlindungan",
          "musafir",
          "umrah",
          "selawat",
        ].includes(c),
      ),
    "Invalid categories " + entry.id,
  );
  if (entry.source_type === "quran") {
    const reference = entry.source_reference.replace("Al-Quran ", "");
    assert.equal(source.reference, reference);
    assert.deepEqual(entry.arabic_text.split("\n"), source.parts);
  }
  if (entry.recommended_count) {
    assert.deepEqual(
      decisions[entry.id],
      {
        count: entry.recommended_count,
        reference: entry.recommended_count_reference,
        proof_key: entry.count_proof_key,
        reviewed_at: entry.verified_at,
      },
      "Count decision changed " + entry.id,
    );
    assert(
      Number.isSafeInteger(entry.recommended_count) &&
        entry.recommended_count > 0,
    );
    assert(
      entry.recommended_count_reference && proof[entry.count_proof_key],
      "Missing count evidence " + entry.id,
    );
  }
  assert.equal(entry.verification_status, "verified");
  assert.equal(entry.published, true);
}
const report = {
  total: data.length,
  verified: data.filter((e) => e.verification_status === "verified").length,
  pending: pending.length,
  candidate_total: data.length + pending.length,
  excluded_candidates: [
    {
      reference: "Sahih al-Bukhari 834",
      reason:
        "Downloaded source contains replacement characters; not imported.",
    },
  ],
  quran: data.filter((e) => e.source_type === "quran").length,
  hadith: data.filter((e) => e.source_type === "hadith").length,
  method:
    "Exact Arabic substring and source-snapshot hashes; manual editorial review of Malay explanations, references, context and repetition counts. Not a new scholarly sanad grading.",
  entries: data.map((e) => ({
    id: e.id,
    reference: e.source_reference,
    count: e.recommended_count,
    count_reference: e.recommended_count_reference,
    arabic_sha256: e.arabic_sha256,
    rumi_available: !!e.transliteration,
  })),
};
fs.writeFileSync(
  new URL("../content/audit.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `Verified ${report.verified}/${report.total} entries (${report.quran} Quran, ${report.hadith} hadith); no duplicate IDs or Arabic; no published pending entries.`,
);
