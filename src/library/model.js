import raw from "./entries.json" with { type: "json" };
export const CATEGORIES = [
  ["harian", "Doa Harian"],
  ["quran", "Doa daripada Al-Quran"],
  ["pagi", "Zikir Pagi"],
  ["petang", "Zikir Petang"],
  ["solat", "Zikir Selepas Solat"],
  ["ampun", "Doa Memohon Keampunan"],
  ["tenang", "Doa Ketenangan Hati"],
  ["kesihatan", "Doa Kesihatan dan Kesembuhan"],
  ["keluarga", "Doa Keluarga dan Ibu Bapa"],
  ["ilmu", "Doa Ilmu dan Pembelajaran"],
  ["rezeki", "Doa Rezeki dan Keberkatan"],
  ["perlindungan", "Doa Perlindungan dan Keselamatan"],
  ["musafir", "Doa Musafir"],
  ["umrah", "Doa Umrah dan Haji"],
  ["selawat", "Selawat ke atas Nabi"],
  ["favourites", "Doa Kegemaran"],
].map(([id, name]) => ({ id, name }));
export const ENTRIES = raw.filter(
  (e) => e.published === true && e.verification_status === "verified",
);
export const BY_ID = Object.fromEntries(ENTRIES.map((e) => [e.id, e]));
export const normalize = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[ـ\u200e\u200f]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[‘’]/g, "'")
    .toLocaleLowerCase("ms-MY")
    .replace(/\s+/g, " ")
    .trim();
const searchIndex = new Map(
  ENTRIES.map((e) => [
    e.id,
    normalize(
      [
        e.title_ms,
        e.arabic_text,
        e.transliteration,
        e.translation_ms,
        e.source_reference,
        ...e.keywords,
        ...e.categories.map((id) => CATEGORIES.find((c) => c.id === id)?.name),
      ].join(" "),
    ),
  ]),
);
export function searchEntries(
  query = "",
  category = "all",
  source = "all",
  favourites = [],
) {
  const terms = normalize(query).split(" ").filter(Boolean);
  return ENTRIES.filter(
    (e) =>
      (category === "all" ||
        (category === "favourites"
          ? favourites.includes(e.id)
          : e.categories.includes(category))) &&
      (source === "all" || e.source_type === source) &&
      terms.every((term) => searchIndex.get(e.id).includes(term)),
  );
}
export const GUIDES = [
  {
    id: "pagi",
    title: "Zikir Pagi",
    ids: [
      "quran-112-1-4",
      "quran-113-1-5",
      "quran-114-1-6",
      "h-sayyid",
      "h-pagi-luas",
      "h-tasbih-pagi",
    ],
  },
  {
    id: "petang",
    title: "Zikir Petang",
    ids: [
      "quran-112-1-4",
      "quran-113-1-5",
      "quran-114-1-6",
      "h-sayyid",
      "h-tasbih-pagi",
    ],
  },
  {
    id: "solat",
    title: "Zikir Selepas Solat",
    ids: [
      "h-istighfar",
      "h-salam",
      "h-tasbih",
      "h-tahmid",
      "h-takbir",
      "h-tahlil-solat",
    ],
  },
];
export const LIBRARY_KEY = "titipandoa.library.v1";
export function initialLibrary() {
  return {
    version: 1,
    favourites: [],
    preferences: { arabicSize: 36, showMeaning: true, showRumi: true },
    sessions: {},
  };
}
export function restoreLibrary(raw) {
  const result = initialLibrary();
  if (!raw || raw.version !== 1) return result;
  result.favourites = [
    ...new Set(
      (Array.isArray(raw.favourites) ? raw.favourites : []).filter(
        (id) => BY_ID[id],
      ),
    ),
  ];
  const p = raw.preferences || {};
  result.preferences = {
    arabicSize: Number.isFinite(p.arabicSize)
      ? Math.max(24, Math.min(64, p.arabicSize))
      : 36,
    showMeaning: p.showMeaning !== false,
    showRumi: p.showRumi !== false,
  };
  for (const guide of GUIDES) {
    const saved = raw.sessions?.[guide.id];
    if (!saved) continue;
    const counts = {};
    for (const id of guide.ids) {
      const count = saved.counts?.[id];
      counts[id] = Number.isSafeInteger(count)
        ? Math.max(0, Math.min(BY_ID[id].recommended_count || 1, count))
        : 0;
    }
    result.sessions[guide.id] = {
      index: Number.isSafeInteger(saved.index)
        ? Math.max(0, Math.min(guide.ids.length - 1, saved.index))
        : 0,
      counts,
    };
  }
  return result;
}
export function malaysiaDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function dailyEntry(date = new Date()) {
  const day = malaysiaDay(date);
  const [y, m, d] = day.split("-").map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return ENTRIES[((days % ENTRIES.length) + ENTRIES.length) % ENTRIES.length];
}
export function entryLink(entry, location = window.location) {
  return `${location.origin}${location.pathname}#doa/${encodeURIComponent(entry.id)}`;
}
export function shareText(entry, location) {
  return [
    entry.title_ms,
    entry.arabic_text,
    entry.translation_ms,
    entry.source_reference,
    entry.source_url,
    entryLink(entry, location),
  ].join("\n\n");
}
export const escapeHTML = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function offlineDocument() {
  return (
    '<!doctype html><html lang="ms"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Koleksi Doa & Zikrullah — Bacaan Luar Talian</title><style>body{font:16px/1.8 system-ui;background:#FAF7F0;color:#28382F;max-width:760px;margin:auto;padding:24px}h1,h2{color:#496356}article{padding:24px 0;border-bottom:1px solid #DCE2D9}.ar{font:32px/2 Amiri,serif;white-space:pre-line}a{color:#496356}</style><h1>Koleksi Doa & Zikrullah</h1><p>Salinan bacaan luar talian · ' +
    ENTRIES.length +
    " entri. Huraian makna Bahasa Melayu ditulis untuk koleksi ini. Teks Arab al-Quran: QuranEnc melalui quran-json v3.1.2 (Risan Bagja Pradana), CC BY-SA 4.0. Lafaz hadis: koleksi yang dirujuk melalui hadith-api. Tiada audio atau bilangan baharu ditetapkan.</p>" +
    ENTRIES.map(
      (e) =>
        '<article id="' +
        escapeHTML(e.id) +
        '"><h2>' +
        escapeHTML(e.title_ms) +
        '</h2><p class="ar" lang="ar" dir="rtl">' +
        escapeHTML(e.arabic_text) +
        "</p>" +
        (e.transliteration
          ? "<p>" + escapeHTML(e.transliteration) + "</p>"
          : "") +
        "<p>" +
        escapeHTML(e.translation_ms) +
        "</p><p>" +
        escapeHTML(e.description_ms) +
        '</p><a href="' +
        escapeHTML(e.source_url) +
        '">' +
        escapeHTML(e.source_reference) +
        "</a>" +
        (e.recommended_count
          ? "<p>Bilangan: " +
            e.recommended_count +
            " · " +
            escapeHTML(e.recommended_count_reference) +
            "</p>"
          : "") +
        "</article>",
    ).join("") +
    '<footer><p>Diambil daripada Tumpang Doa. Lesen teks dan atribusi: <a href="https://github.com/risan/quran-json/tree/v3.1.2">quran-json</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Salinan bacaan ini tidak menyimpan kemajuan interaktif.</p></footer></html>'
  );
}
