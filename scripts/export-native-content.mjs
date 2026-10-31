import fs from "node:fs";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/library/entries.json", import.meta.url)),
);
fs.writeFileSync(
  new URL("../ios/TitipanDoa/Shared/Library.json", import.meta.url),
  JSON.stringify(
    entries
      .filter((e) => e.published && e.verification_status === "verified")
      .map((e) => ({
        id: e.id,
        title: e.title_ms,
        arabic: e.arabic_text,
        meaning: e.translation_ms,
        source: e.source_reference,
        url: e.source_url,
      })),
    null,
    2,
  ) + "\n",
);
console.log("Native offline catalogue exported.");

for (const [source, name] of [
  ["QURAN-LICENSE.txt", "QuranLicense.txt"],
  ["HADITH-LICENSE.txt", "HadithLicense.txt"],
])
  fs.copyFileSync(
    new URL("../content/" + source, import.meta.url),
    new URL("../ios/TitipanDoa/Shared/" + name, import.meta.url),
  );
