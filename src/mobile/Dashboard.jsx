import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleDot,
  Calendar,
  Share2,
  Mail,
} from "lucide-react";
import { dailyEntry } from "../library/model.js";
import { KEY, restore, initial, ZIKR, advance, MAX } from "../tasbih/model.js";
import { readPersisted, savePersisted } from "../offline/persistence.js";
export function TasbihWidget({ navigate, expanded = false }) {
  const read = () => {
    try {
      return restore(JSON.parse(readPersisted(KEY)));
    } catch {
      return initial();
    }
  };
  const [state, setState] = useState(read);
  const [error, setError] = useState(false);
  useEffect(() => {
    const changed = () => setState(read());
    window.addEventListener("titipandoa:persisted", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("titipandoa:persisted", changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  const stage = state.guided?.stages[state.guided.index];
  const zikr =
    ZIKR.find((z) => z.id === (stage?.id || state.selected)) ||
    state.custom.find((z) => z.id === state.selected) ||
    ZIKR[0];
  const counter = stage ||
    state.sessions[state.selected] || { count: 0, target: zikr.target };
  function increment() {
    const current = read();
    const selected =
      ZIKR.find((z) => z.id === current.selected) ||
      current.custom.find((z) => z.id === current.selected) ||
      ZIKR[0];
    const saved = current.sessions[current.selected] || {
      count: 0,
      target: selected.target,
    };
    const next = current.guided
      ? { ...current, guided: advance(current.guided) }
      : {
          ...current,
          sessions: {
            ...current.sessions,
            [current.selected]: {
              ...saved,
              count: Math.min(MAX, saved.count + 1),
            },
          },
        };
    savePersisted(KEY, next).then((ok) => setError(!ok));
  }
  return (
    <article
      className={`app-widget tasbih-widget ${expanded ? "expanded" : ""}`}
    >
      <div className="widget-label">
        <CircleDot size={17} />
        <span>TASBIH DIGITAL</span>
        <button onClick={() => navigate("tasbih")} aria-label="Buka Tasbih">
          <ArrowRight size={18} />
        </button>
      </div>
      <h2>{zikr.title}</h2>
      {expanded && zikr.arabic && (
        <p className="widget-arabic" lang="ar" dir="rtl">
          {zikr.arabic}
        </p>
      )}
      <div className="widget-counter-row">
        <p>
          <strong>{counter.count.toLocaleString("ms-MY")}</strong>
          <span>/ {counter.target}</span>
        </p>
        <button onClick={increment} aria-label="Tambah tasbih pada widget">
          +
        </button>
      </div>
      <progress
        max={counter.target}
        value={Math.min(counter.count, counter.target)}
        aria-label="Kemajuan Tasbih"
      />
      {error && (
        <p role="alert">Kiraan belum dapat disimpan. Jangan tutup halaman.</p>
      )}
    </article>
  );
}
export function DailyWidget({ onRead, expanded = false }) {
  const [entry, setEntry] = useState(dailyEntry);
  useEffect(() => {
    const timer = setInterval(() => setEntry(dailyEntry()), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <article
      className={`app-widget daily-widget ${expanded ? "expanded" : ""}`}
    >
      <div className="widget-label">
        <BookOpen size={17} />
        <span>DOA HARI INI</span>
      </div>
      <h2>{entry.title_ms}</h2>
      <p lang="ar" dir="rtl" className="widget-arabic">
        {entry.arabic_text}
      </p>
      {expanded && <p className="widget-meaning">{entry.translation_ms}</p>}
      <small>{entry.source_reference}</small>
      <button className="widget-link" onClick={() => onRead(entry.id)}>
        Baca doa
        <ArrowRight size={16} />
      </button>
    </article>
  );
}
export function UmrahWidget({
  checklist,
  itinerary,
  isOwner,
  navigate,
  openOwner,
  expanded = false,
}) {
  const completed = checklist.filter((row) => row.completed).length;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  });
  const upcoming = itinerary
    .filter((row) => row.date >= today)
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )[0];
  return (
    <article
      className={`app-widget umrah-widget ${expanded ? "expanded" : ""}`}
    >
      <div className="widget-label">
        <Calendar size={17} />
        <span>PERJALANAN UMRAH</span>
      </div>
      <h2>Satu langkah lebih bersedia.</h2>
      {isOwner ? (
        <>
          <p className="widget-meaning">
            {completed} daripada {checklist.length} perkara disemak.
          </p>
          <progress
            max={checklist.length || 1}
            value={completed}
            aria-label="Kemajuan senarai semak"
          />
          {upcoming ? (
            <p className="next-itinerary">
              <strong>{upcoming.activity}</strong>
              <span>
                {upcoming.date} · {upcoming.time} · {upcoming.location}
              </span>
            </p>
          ) : (
            <p className="widget-meaning">
              Tiada atur cara akan datang dalam data yang dimuatkan.
            </p>
          )}
          <button className="widget-link" onClick={() => navigate("umrahhub")}>
            Lihat jadual Umrah
            <ArrowRight size={16} />
          </button>
        </>
      ) : (
        <>
          <p className="widget-meaning">
            Buka ruang jemaah untuk jadual dan senarai semak peribadi.
          </p>
          <button className="widget-link" onClick={openOwner}>
            Akses perjalanan
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </article>
  );
}
export default function Dashboard({
  navigate,
  onRead,
  isOwner,
  checklist,
  itinerary,
  openOwner,
  pilgrimName,
  doas,
  loading,
  onShare,
}) {
  const [hidden, setHidden] = useState(() => {
    try {
      return JSON.parse(readPersisted("titipandoa.dashboard") || "[]");
    } catch {
      return [];
    }
  });
  return (
    <section className="app-dashboard">
      <header className="dashboard-greeting">
        <p className="eyebrow">RUANG PERIBADI ANDA</p>
        <h1>Assalamualaikum, {pilgrimName.split(' ')[0]}.</h1>
        <p>Titipan doa, ibadah dan persiapan Umrah anda di satu tempat.</p>
      </header>
      <section className="owner-titipan-summary" aria-label="Ringkasan titipan doa">
        <div>
          <span className="widget-label"><Mail size={17} /> TITIPAN DOA ANDA</span>
          <h2>{loading ? 'Memuatkan titipan…' : `${doas.filter(doa => !doa.is_read).length} doa belum dibaca`}</h2>
          <p>{loading ? 'Sebentar lagi.' : `${doas.length} titipan daripada keluarga dan sahabat.`}</p>
        </div>
        <button className="button-primary" onClick={() => navigate('dashboard')}>
          Buka titipan <ArrowRight size={18} />
        </button>
      </section>
      <div className="dashboard-quick-actions">
        <button onClick={() => navigate("collection")}>
          <BookOpen size={18} />
          Baca Doa
        </button>
        <button onClick={() => navigate("zikrhub")}>
          <CircleDot size={18} />
          Mulakan Zikir
        </button>
        <button onClick={onShare}>
          <Share2 size={18} />
          Kongsi Pautan Titipan
        </button>
      </div>
      <div className="dashboard-widgets">
        {!hidden.includes("daily") && <DailyWidget onRead={onRead} expanded />}
        {!hidden.includes("tasbih") && <TasbihWidget navigate={navigate} />}
        <UmrahWidget
          checklist={checklist}
          itinerary={itinerary}
          isOwner={isOwner}
          navigate={navigate}
          openOwner={openOwner}
        />
      </div>
      <details className="dashboard-customize">
        <summary>Sesuaikan kad utama</summary>
        {[
          ["daily", "Doa harian"],
          ["tasbih", "Tasbih"],
        ].map(([id, title]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={!hidden.includes(id)}
              onChange={(e) => {
                const next = e.target.checked
                  ? hidden.filter((v) => v !== id)
                  : [...hidden, id];
                setHidden(next);
                savePersisted("titipandoa.dashboard", next);
              }}
            />
            {title}
          </label>
        ))}
      </details>
    </section>
  );
}
