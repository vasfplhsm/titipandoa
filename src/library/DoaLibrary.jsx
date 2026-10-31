import { readPersisted, savePersisted } from '../offline/persistence.js';
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Copy,
  Share2,
  Download,
  Maximize2,
  Minimize2,
  Check,
  RotateCcw,
  CircleDot,
  Sun,
  Moon,
  Flower2,
  Heart,
  ShieldCheck,
  Users,
  GraduationCap,
  HandHeart,
  Plane,
  Compass,
} from "lucide-react";
import {
  ENTRIES,
  BY_ID,
  CATEGORIES,
  GUIDES,
  LIBRARY_KEY,
  initialLibrary,
  restoreLibrary,
  searchEntries,
  shareText,
  offlineDocument,
} from "./model.js";
import "./library.css";
const ICONS = [
  BookOpen,
  BookOpen,
  Sun,
  Moon,
  CircleDot,
  HandHeart,
  Heart,
  Heart,
  Users,
  GraduationCap,
  Flower2,
  ShieldCheck,
  Plane,
  Compass,
  Flower2,
  Bookmark,
];
function loadStore() {
  try {
    return restoreLibrary(JSON.parse(readPersisted(LIBRARY_KEY)));
  } catch {
    return initialLibrary();
  }
}
function CountNote({ entry }) {
  return entry.recommended_count ? (
    <p className="library-count-note">
      {entry.recommended_count} kali ·{" "}
      <span>{entry.recommended_count_reference}</span>
    </p>
  ) : null;
}
function Source({ entry }) {
  return (
    <aside className="library-source">
      <span className="eyebrow">SUMBER & KONTEKS</span>
      <a href={entry.source_url} target="_blank" rel="noreferrer noopener">
        {entry.source_reference} ↗
      </a>
      <p>{entry.description_ms}</p>
      <CountNote entry={entry} />
      <details>
        <summary>Semakan dan atribusi teks</summary>
        <p>{entry.source_authenticity_note}</p>
        <p>
          Lafaz dipadankan dengan salinan sumber pada {entry.verified_at}.
          Huraian makna Bahasa Melayu ditulis untuk koleksi ini; bukan
          terjemahan rasmi atau penilaian sanad baharu.
        </p>
        {entry.source_type === "quran" && (
          <p>
            Teks Arab: QuranEnc melalui{" "}
            <a
              href="https://github.com/risan/quran-json/tree/v3.1.2"
              target="_blank"
              rel="noreferrer noopener"
            >
              quran-json v3.1.2 · Risan Bagja Pradana
            </a>
            , CC BY-SA 4.0. Ayat dipaparkan tanpa mengubah lafaz.
          </p>
        )}
      </details>
    </aside>
  );
}
function ReadingControls({ preferences, onChange, focus, toggleFocus }) {
  return (
    <div className="reading-controls" aria-label="Tetapan bacaan">
      <div className="font-controls">
        <button
          disabled={preferences.arabicSize <= 24}
          onClick={() => onChange({ arabicSize: preferences.arabicSize - 4 })}
          aria-label="Kecilkan tulisan Arab"
        >
          A−
        </button>
        <span>{preferences.arabicSize}px</span>
        <button
          disabled={preferences.arabicSize >= 64}
          onClick={() => onChange({ arabicSize: preferences.arabicSize + 4 })}
          aria-label="Besarkan tulisan Arab"
        >
          A+
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={preferences.showRumi}
          onChange={(e) => onChange({ showRumi: e.target.checked })}
        />
        Rumi
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferences.showMeaning}
          onChange={(e) => onChange({ showMeaning: e.target.checked })}
        />
        Makna
      </label>
      <button
        onClick={toggleFocus}
        aria-label={focus ? "Keluar mod bacaan" : "Mod bacaan"}
      >
        {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
      </button>
    </div>
  );
}
function ReadingText({ entry, preferences }) {
  return (
    <div className="library-reading-text">
      <p
        className="library-arabic"
        lang="ar"
        dir="rtl"
        style={{ fontSize: preferences.arabicSize }}
      >
        {entry.arabic_text}
      </p>
      {preferences.showRumi &&
        (entry.transliteration ? (
          <div className="reading-block">
            <span>RUMI</span>
            <p>{entry.transliteration}</p>
          </div>
        ) : (
          <p className="rumi-note">
            Rumi belum disediakan untuk bacaan ini. Rujuk teks Arab dan sumber
            asal.
          </p>
        ))}
      {preferences.showMeaning && (
        <div className="reading-block">
          <span>MAKNA DALAM BAHASA MELAYU</span>
          <p>{entry.translation_ms}</p>
        </div>
      )}
    </div>
  );
}
export default function DoaLibrary({
  entryId,
  guideId,
  onOpenEntry,
  onOpenGuide,
  onReadingChange,
  onTasbih,
}) {
  const [store, setStore] = useState(loadStore);
  const storeRef = useRef(store);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [focusKey, setFocusKey] = useState(null);
  const routeKey = `${entryId || ""}/${guideId || ""}`;
  const focus = !!(entryId || guideId) && focusKey === routeKey;
  const [storageError, setStorageError] = useState(() => {
    try {
      readPersisted(LIBRARY_KEY);
      return false;
    } catch {
      return true;
    }
  });
  const [message, setMessage] = useState("");
  const [manualCopy, setManualCopy] = useState("");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const readerRef = useRef(null);
  const backRef = useRef(null);
  function update(transform) {
    const next = transform(storeRef.current);
    storeRef.current = next;
    setStore(next);
    savePersisted(LIBRARY_KEY, next).then(ok => setStorageError(!ok));
  }
  useEffect(() => {
    function sync(event) {
      if (event.key === LIBRARY_KEY) {
        try {
          const next = restoreLibrary(JSON.parse(event.newValue));
          storeRef.current = next;
          setStore(next);
        } catch {
          /* Keep this tab's in-memory reading progress. */
        }
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (entryId || guideId) backRef.current?.focus();
  }, [entryId, guideId]);
  const prefs = store.preferences;
  const guide = GUIDES.find((g) => g.id === guideId);
  const session = guide
    ? store.sessions[guide.id] || { index: 0, counts: {} }
    : null;
  const entry = guide ? BY_ID[guide.ids[session.index]] : BY_ID[entryId];
  const results = searchEntries(query, category, source, store.favourites);
  function toggleFavourite(id) {
    update((s) => ({
      ...s,
      favourites: s.favourites.includes(id)
        ? s.favourites.filter((v) => v !== id)
        : [...s.favourites, id],
    }));
  }
  function setPrefs(change) {
    update((s) => ({ ...s, preferences: { ...s.preferences, ...change } }));
  }
  function leaveReading() {
    setFocusKey(null);
    onReadingChange(false);
    onOpenEntry(null);
    setConfirmRestart(false);
    setManualCopy("");
  }
  function toggleFocus() {
    setFocusKey(focus ? null : routeKey);
    onReadingChange(!focus);
  }
  function setSession(change) {
    update((s) => ({
      ...s,
      sessions: {
        ...s.sessions,
        [guide.id]: {
          index: 0,
          counts: {},
          ...s.sessions[guide.id],
          ...change,
        },
      },
    }));
  }
  function incrementSession(complete = false) {
    update((s) => {
      const saved = s.sessions[guide.id] || { index: 0, counts: {} };
      const id = guide.ids[saved.index];
      const max = BY_ID[id].recommended_count || 1;
      return {
        ...s,
        sessions: {
          ...s.sessions,
          [guide.id]: {
            ...saved,
            counts: {
              ...saved.counts,
              [id]: complete ? max : Math.min(max, (saved.counts[id] || 0) + 1),
            },
          },
        },
      };
    });
  }
  async function copy(text) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setMessage("Bacaan dan rujukan telah disalin.");
      setManualCopy("");
    } catch {
      setManualCopy(text);
      setMessage(
        "Salinan automatik tidak tersedia. Pilih dan salin teks di bawah.",
      );
    }
  }
  async function share() {
    const text = shareText(entry);
    if (navigator.share) {
      try {
        await navigator.share({ title: entry.title_ms, text });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    await copy(text);
  }
  function download() {
    try {
      const blob = new Blob([offlineDocument()], {
        type: "text/html;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "titipan-doa-bacaan-luar-talian.html";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Salinan bacaan disediakan. Simpan fail HTML untuk dibuka tanpa internet.",
      );
    } catch {
      setMessage(
        "Muat turun tidak tersedia dalam pelayar ini. Bacaan yang sudah dimuatkan masih boleh dibaca tanpa internet.",
      );
    }
  }
  const isReading = !!(entryId || guideId);
  return (
    <section
      className={`doa-library ${focus ? "library-read-mode" : ""}`}
      aria-label="Koleksi Doa dan Zikrullah"
      ref={readerRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && focus) toggleFocus();
        if (e.key === "Tab" && focus) {
          const nodes = [
            ...readerRef.current.querySelectorAll(
              "button:not(:disabled),a,input,select,textarea,summary",
            ),
          ].filter((n) => n.getClientRects().length);
          const first = nodes[0],
            last = nodes.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      {storageError && (
        <p className="library-alert" role="alert">
          Simpanan pelayar tidak tersedia atau penuh. Kegemaran dan kemajuan
          bacaan kekal dalam tab ini sahaja.
        </p>
      )}
      {message && (
        <p className="library-message" role="status">
          {message}
          <button aria-label="Tutup mesej" onClick={() => setMessage("")}>
            ×
          </button>
        </p>
      )}
      {manualCopy && (
        <label className="manual-copy">
          Salin bacaan secara manual
          <textarea
            readOnly
            value={manualCopy}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
      {isReading ? (
        entry ? (
          <article className="library-reader">
            <header className="library-reader-header">
              <button
                className="library-back"
                ref={backRef}
                onClick={leaveReading}
              >
                <ArrowLeft size={17} />
                Kembali ke koleksi
              </button>
              <div className="library-reader-meta">
                <span>
                  {guide
                    ? guide.title
                    : CATEGORIES.find((c) => c.id === entry.categories[0])
                        ?.name}
                </span>
                <button
                  aria-label={
                    store.favourites.includes(entry.id)
                      ? "Buang kegemaran"
                      : "Simpan kegemaran"
                  }
                  aria-pressed={store.favourites.includes(entry.id)}
                  onClick={() => toggleFavourite(entry.id)}
                >
                  <Bookmark
                    size={19}
                    fill={
                      store.favourites.includes(entry.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </div>
              <h1>{entry.title_ms}</h1>
              <p className="reader-source-label">{entry.source_reference}</p>
            </header>
            {guide && (
              <div className="guided-reader-progress">
                <p>
                  Item {session.index + 1} daripada {guide.ids.length} ·{" "}
                  {
                    guide.ids.filter(
                      (id) =>
                        (session.counts[id] || 0) >=
                        (BY_ID[id].recommended_count || 1),
                    ).length
                  }{" "}
                  selesai
                </p>
                <progress
                  max={guide.ids.length}
                  value={
                    guide.ids.filter(
                      (id) =>
                        (session.counts[id] || 0) >=
                        (BY_ID[id].recommended_count || 1),
                    ).length
                  }
                  aria-label="Kemajuan sesi bacaan"
                />
                <label>
                  Lompat ke bacaan
                  <select
                    value={session.index}
                    onChange={(e) =>
                      setSession({ index: Number(e.target.value) })
                    }
                  >
                    {guide.ids.map((id, i) => (
                      <option key={id} value={i}>
                        {i + 1}. {BY_ID[id].title_ms}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Susunan panduan ini ialah pilihan bacaan, bukan ritual wajib
                  atau edisi al-Ma’thurat.{" "}
                  {guide.id === "solat"
                    ? "Variasi bilangan dijelaskan pada setiap bacaan."
                    : ""}
                </p>
              </div>
            )}
            <ReadingControls
              preferences={prefs}
              onChange={setPrefs}
              focus={focus}
              toggleFocus={toggleFocus}
            />
            <ReadingText entry={entry} preferences={prefs} />
            {guide && (
              <div className="guided-reading-actions">
                <button
                  className="button-primary"
                  onClick={() => incrementSession()}
                  disabled={
                    (session.counts[entry.id] || 0) >=
                    (entry.recommended_count || 1)
                  }
                >
                  {session.counts[entry.id] || 0} /{" "}
                  {entry.recommended_count || 1}
                  <span>· Tandakan satu bacaan</span>
                </button>
                {!entry.recommended_count && (
                  <p>
                    Satu langkah membaca dalam panduan ini; bukan bilangan
                    khusus yang ditetapkan riwayat.
                  </p>
                )}
                <div className="library-action-row">
                  <button onClick={() => incrementSession(true)}>
                    <Check size={16} />
                    Tandakan selesai
                  </button>
                  <button
                    disabled={session.index === 0}
                    onClick={() => setSession({ index: session.index - 1 })}
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={session.index === guide.ids.length - 1}
                    onClick={() => setSession({ index: session.index + 1 })}
                  >
                    Seterusnya
                    <ArrowRight size={16} />
                  </button>
                </div>
                {guide.ids.every(
                  (id) =>
                    (session.counts[id] || 0) >=
                    (BY_ID[id].recommended_count || 1),
                ) && (
                  <p role="status" className="guided-complete">
                    Alhamdulillah, sesi bacaan selesai. Kemajuan anda telah
                    disimpan pada peranti ini.
                  </p>
                )}
                <button
                  className="guide-restart"
                  onClick={() => setConfirmRestart(true)}
                >
                  <RotateCcw size={15} />
                  Mulakan sesi semula
                </button>
                {confirmRestart && (
                  <div
                    className="restart-confirm"
                    role="group"
                    aria-label="Pengesahan mulakan semula"
                  >
                    <p>Kosongkan kemajuan sesi ini?</p>
                    <button onClick={() => setConfirmRestart(false)}>
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        setSession({ index: 0, counts: {} });
                        setConfirmRestart(false);
                      }}
                    >
                      Ya, mula semula
                    </button>
                  </div>
                )}
              </div>
            )}
            <Source entry={entry} />
            <div className="library-action-row">
              <button onClick={() => copy(shareText(entry))}>
                <Copy size={17} />
                Salin
              </button>
              <button onClick={share}>
                <Share2 size={17} />
                Kongsi
              </button>
              <button
                aria-pressed={store.favourites.includes(entry.id)}
                onClick={() => toggleFavourite(entry.id)}
              >
                <Bookmark size={17} />
                {store.favourites.includes(entry.id)
                  ? "Dalam kegemaran"
                  : "Tambah kegemaran"}
              </button>
            </div>
            {entry.recommended_count && (
              <button
                className="open-tasbih button-primary"
                onClick={() => {
                  setFocusKey(null);
                  onReadingChange(false);
                  onTasbih(entry);
                }}
              >
                <CircleDot size={18} />
                Buka dalam Tasbih Digital
                <ArrowRight size={17} />
              </button>
            )}
          </article>
        ) : (
          <div className="library-empty">
            <h1>Bacaan tidak dijumpai</h1>
            <p>
              Pautan ini tidak merujuk kepada entri diterbitkan dalam koleksi.
            </p>
            <button className="button-primary" onClick={leaveReading}>
              Kembali ke koleksi
            </button>
          </div>
        )
      ) : (
        <>
          <header className="library-intro">
            <span className="eyebrow">PANDUAN KECIL, UNTUK SETIAP HARI</span>
            <h1>
              Koleksi Doa <span>& Zikrullah</span>
            </h1>
            <p>
              Himpunan doa dan zikir sebagai panduan amalan harian, bersumberkan
              al-Quran dan sunnah.
            </p>
            <span className="gold-rule" />
            <small>
              {ENTRIES.length} bacaan dengan rujukan · Tanpa akaun · Disimpan
              pada peranti
            </small>
          </header>
          <form
            role="search"
            className="library-search"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search size={20} />
            <label className="sr-only" htmlFor="doa-search">
              Cari doa, zikir atau kata kunci
            </label>
            <input
              id="doa-search"
              type="search"
              placeholder="Cari doa, zikir atau kata kunci..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Kosongkan carian"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
          </form>
          <div className="library-guides" aria-label="Panduan bacaan">
            {GUIDES.map((g) => (
              <button key={g.id} onClick={() => onOpenGuide(g.id)}>
                <span>
                  {g.id === "pagi" ? (
                    <Sun size={20} />
                  ) : g.id === "petang" ? (
                    <Moon size={20} />
                  ) : (
                    <CircleDot size={20} />
                  )}
                </span>
                <div>
                  <strong>{g.title}</strong>
                  <small>
                    {store.sessions[g.id]
                      ? "Sambung bacaan tersimpan"
                      : `${g.ids.length} bacaan berpandu`}
                  </small>
                </div>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <section
            className="library-category-section"
            aria-label="Kategori doa"
          >
            <div className="library-section-label">
              <h2>Temukan bacaan anda</h2>
              <button
                aria-pressed={category === "all"}
                onClick={() => setCategory("all")}
              >
                Semua kategori
              </button>
            </div>
            <div className="library-categories">
              {CATEGORIES.map((c, i) => {
                const Icon = ICONS[i];
                const count =
                  c.id === "favourites"
                    ? store.favourites.length
                    : ENTRIES.filter((e) => e.categories.includes(c.id)).length;
                return (
                  <button
                    key={c.id}
                    aria-pressed={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    <span>{c.name}</span>
                    <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <div className="library-result-heading">
            <div>
              <h2>
                {category === "all"
                  ? "Semua bacaan"
                  : CATEGORIES.find((c) => c.id === category)?.name}
              </h2>
              <p role="status">
                {results.length} bacaan{query ? ` untuk “${query}”` : ""}
              </p>
            </div>
            <label>
              Sumber
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="all">Semua sumber</option>
                <option value="quran">Al-Quran</option>
                <option value="hadith">Hadis</option>
              </select>
            </label>
          </div>
          {results.length ? (
            <div className="library-results">
              {results.map((e) => (
                <article className="library-result-card" key={e.id}>
                  <div className="result-card-top">
                    <span>
                      {e.source_type === "quran" ? "AL-QURAN" : "HADIS"} ·{" "}
                      {e.source_reference}
                    </span>
                    <button
                      aria-label={`${store.favourites.includes(e.id) ? "Buang" : "Simpan"} kegemaran ${e.title_ms}`}
                      aria-pressed={store.favourites.includes(e.id)}
                      onClick={() => toggleFavourite(e.id)}
                    >
                      <Bookmark
                        size={17}
                        fill={
                          store.favourites.includes(e.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  <button
                    className="result-card-read"
                    aria-label={`Baca ${e.title_ms}`}
                    onClick={() => onOpenEntry(e.id)}
                  >
                    <h3>{e.title_ms}</h3>
                    <p className="result-arabic" lang="ar" dir="rtl">
                      {e.arabic_text}
                    </p>
                    <p className="result-meaning">{e.translation_ms}</p>
                    <span className="result-read-more">
                      Baca & hayati
                      <ArrowRight size={16} />
                    </span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <BookOpen size={26} />
              <h3>
                {category === "favourites"
                  ? "Kegemaran anda, sebuah ruang peribadi."
                  : "Tiada bacaan dijumpai."}
              </h3>
              <p>
                {category === "favourites"
                  ? "Tekan ikon penanda pada mana-mana bacaan untuk menyimpannya. Carian juga menapis kegemaran anda."
                  : "Cuba kata kunci lain atau pilih semua kategori dan sumber."}
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setSource("all");
                }}
              >
                Lihat semua bacaan
              </button>
            </div>
          )}
          <footer className="library-footnote">
            <div>
              <h2>Bacaan yang menemani perjalanan.</h2>
              <p>
                Semua bacaan yang dimuatkan boleh terus dibaca tanpa internet.
                Simpan fail bacaan untuk akses apabila halaman tidak dapat
                dibuka.
              </p>
            </div>
            <button onClick={download}>
              <Download size={18} />
              Muat turun bacaan luar talian
            </button>
            <p className="library-attribution">
              Teks Arab al-Quran: QuranEnc melalui quran-json v3.1.2 · CC BY-SA
              4.0. Lafaz hadis mengikut rujukan setiap entri. Huraian makna
              Bahasa Melayu ditulis untuk koleksi ini.
            </p>
          </footer>
        </>
      )}
    </section>
  );
}
