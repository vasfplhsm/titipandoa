import { ENTRIES } from "../library/model.js";
export const KEY = "titipandoa.tasbih.v1";
export const MAX = Number.MAX_SAFE_INTEGER;
const BASE_ZIKR = [
  {
    id: "subhanallah",
    title: "Subhanallah",
    arabic: "سُبْحَانَ اللّٰهِ",
    meaning: "Maha Suci Allah",
    target: 33,
  },
  {
    id: "alhamdulillah",
    title: "Alhamdulillah",
    arabic: "الْحَمْدُ لِلّٰهِ",
    meaning: "Segala puji bagi Allah",
    target: 33,
  },
  {
    id: "allahuakbar",
    title: "Allahu Akbar",
    arabic: "اللّٰهُ أَكْبَرُ",
    meaning: "Allah Maha Besar",
    target: 33,
  },
  {
    id: "tahlil",
    title: "La ilaha illallah",
    arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ",
    meaning: "Tiada tuhan selain Allah",
    target: 100,
  },
  {
    id: "istighfar",
    title: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللّٰهَ",
    meaning: "Aku memohon ampun kepada Allah",
    target: 100,
  },
  {
    id: "selawat",
    title: "Selawat",
    transliteration: "Allahumma salli ‘ala Muhammad wa ‘ala ali Muhammad",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    meaning:
      "Ya Allah, limpahkanlah selawat kepada Muhammad dan keluarga Muhammad",
    target: 100,
    source:
      "Petikan awal selawat Ibrahimiyyah — Sahih al-Bukhari 3370. Sasaran ialah pilihan peribadi.",
  },
];
export const LIBRARY_TASBIH_IDS = {
  "h-tasbih": "subhanallah",
  "h-tahmid": "alhamdulillah",
  "h-takbir": "allahuakbar",
  "h-istighfar": "istighfar",
};
const countableEntries = ENTRIES.filter((e) => e.recommended_count);
export const ZIKR = [
  ...BASE_ZIKR.map((z) => {
    const entry = countableEntries.find(
      (e) => LIBRARY_TASBIH_IDS[e.id] === z.id,
    );
    return entry
      ? { ...z, arabic: entry.arabic_text, meaning: entry.translation_ms }
      : z;
  }),
  ...countableEntries
    .filter((e) => !LIBRARY_TASBIH_IDS[e.id])
    .map((e) => ({
      id: `library-${e.id}`,
      title: e.title_ms,
      arabic: e.arabic_text,
      meaning: e.translation_ms,
      transliteration: e.transliteration,
      target: e.recommended_count,
      source: `${e.source_reference} · Bilangan: ${e.recommended_count_reference}`,
    })),
];
export const libraryTasbihId = (entry) =>
  LIBRARY_TASBIH_IDS[entry.id] || `library-${entry.id}`;
export const integer = (value, fallback = 0, min = 0) =>
  Number.isSafeInteger(Number(value)) && Number(value) >= min
    ? Number(value)
    : fallback;
export function initial() {
  return {
    version: 1,
    selected: ZIKR[0].id,
    sessions: {},
    custom: [],
    history: [],
    guided: null,
    settings: {
      vibration: false,
      sound: false,
      theme: "light",
      defaultTarget: 33,
      confirmReset: true,
    },
  };
}
export function restore(raw) {
  const base = initial();
  if (!raw || raw.version !== 1) return base;
  base.custom = (Array.isArray(raw.custom) ? raw.custom : [])
    .filter(
      (z) =>
        z &&
        typeof z.id === "string" &&
        z.id.startsWith("custom-") &&
        typeof z.title === "string",
    )
    .slice(0, 50)
    .map((z) => ({
      id: z.id,
      title: z.title.slice(0, 80),
      target: integer(z.target, 33, 1),
      meaning: "Zikr peribadi",
      arabic: "",
    }));
  const all = [...ZIKR, ...base.custom];
  base.selected = all.some((z) => z.id === raw.selected)
    ? raw.selected
    : base.selected;
  for (const z of all) {
    const s = raw.sessions?.[z.id];
    if (s)
      base.sessions[z.id] = {
        count: integer(s.count),
        target: integer(s.target, z.target, 1),
        started: integer(s.started, Date.now()),
        elapsed: integer(s.elapsed),
      };
  }
  base.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(
      (h) =>
        h &&
        typeof h.title === "string" &&
        Number.isSafeInteger(h.count) &&
        h.count > 0 &&
        Number.isFinite(Date.parse(h.date)),
    )
    .slice(0, 500);
  const settings = raw.settings || {};
  base.settings = {
    vibration: settings.vibration === true,
    sound: settings.sound === true,
    theme: ["light", "dark", "system"].includes(settings.theme)
      ? settings.theme
      : "light",
    defaultTarget: integer(settings.defaultTarget, 33, 1),
    confirmReset: settings.confirmReset !== false,
  };
  if (
    raw.guided &&
    Array.isArray(raw.guided.stages) &&
    raw.guided.stages.length > 0 &&
    raw.guided.stages.length <= 10 &&
    raw.guided.stages.every((s) => s && ZIKR.some((z) => z.id === s.id))
  ) {
    base.guided = {
      stages: raw.guided.stages.map((s) => ({
        id: s.id,
        count: integer(s.count),
        target: integer(s.target, 33, 1),
      })),
      index: Math.min(integer(raw.guided.index), raw.guided.stages.length - 1),
      started: integer(raw.guided.started, Date.now()),
      elapsed: integer(raw.guided.elapsed),
    };
  }
  return base;
}
export function advance(guided) {
  const stages = guided.stages.map((s) => ({ ...s }));
  let index = guided.index;
  // A completed stage prepares the next; the next tap counts exactly once there.
  if (stages[index].count >= stages[index].target && index < stages.length - 1)
    index++;
  stages[index].count = Math.min(MAX, stages[index].count + 1);
  return { ...guided, stages, index };
}
export function save(storage, state) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
