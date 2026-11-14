import { readPersisted, savePersisted } from '../offline/persistence.js';
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Undo2,
  RotateCcw,
  Settings2,
  Maximize2,
  Minimize2,
  Check,
} from "lucide-react";
import {
  KEY,
  MAX,
  ZIKR,
  initial,
  restore,
  integer,
  advance,
  libraryTasbihId,
} from "./model";
import "./tasbih.css";
import {useTheme} from "../theme/ThemeProvider";

export default function Tasbih({ onFocusChange, onBack, libraryRequest }) {
  const {appearance,resolvedAppearance,setAppearance}=useTheme();
  const [storageError, setStorageError] = useState(() => {
    try {
      const raw = readPersisted(KEY);
      if (raw) JSON.parse(raw);
      return false;
    } catch {
      return true;
    }
  });
  const [state, setState] = useState(() => {
    try {
      return restore(JSON.parse(readPersisted(KEY)));
    } catch {
      return initial();
    }
  });
  const stateRef = useRef(state);
  const returnFocus = useRef(null);
  const [focus, setFocus] = useState(false);
  const [panel, setPanel] = useState("");
  const [confirm, setConfirm] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customTarget, setCustomTarget] = useState("33");
  const [targetInput, setTargetInput] = useState("");
  const [guideTarget, setGuideTarget] = useState("33");
  const [guideIds, setGuideIds] = useState(ZIKR.slice(0, 3).map((z) => z.id));
  const [notice, setNotice] = useState("");
  const [handledLibraryNonce, setHandledLibraryNonce] = useState(null);
  const libraryOffer =
    libraryRequest && libraryRequest.nonce !== handledLibraryNonce
      ? libraryRequest
      : null;
  const audio = useRef(null);
  const lastTap = useRef(0);
  // Persist synchronously with every action, including rapid taps and navigation.
  function commit(transform) {
    if (notice) return;
    const next = transform(stateRef.current);
    stateRef.current = next;
    setState(next);
    savePersisted(KEY, next).then(ok => setStorageError(!ok));
  }
  useEffect(() => {
    function storageChanged(event) {
      if (event.key === KEY)
        setNotice(
          "Kemajuan berubah di tab lain. Tekan Teruskan untuk memuatkan versi tersimpan sebelum mengira di sini.",
        );
    }
    function localChange(event) {
      if (event.detail.key === KEY) {
        const next = restore(JSON.parse(event.detail.value));
        stateRef.current = next; setState(next);
      }
    }
    window.addEventListener('titipandoa:persisted', localChange);
    window.addEventListener("storage", storageChanged);
    return () => {
      window.removeEventListener('titipandoa:persisted', localChange);
      window.removeEventListener("storage", storageChanged);
      audio.current?.close().catch(() => {});
    };
  }, []);
  const all = [...ZIKR, ...state.custom];
  const guided = state.guided;
  const stage = guided?.stages[guided.index];
  const zikr =
    all.find((z) => z.id === (stage?.id || state.selected)) || ZIKR[0];
  const current = stage ||
    state.sessions[state.selected] || {
      count: 0,
      target: zikr.target,
      elapsed: 0,
    };
  const { count, target } = current;
  const total = guided
    ? guided.stages.reduce((sum, s) => sum + Math.min(s.count, s.target), 0)
    : count;
  const totalTarget = guided
    ? guided.stages.reduce((sum, s) => sum + s.target, 0)
    : target;
  const done = count >= target;
  const sessionDone = guided && guided.stages.every((s) => s.count >= s.target);
  function feedback(completed) {
    if (state.settings.vibration) {
      try {
        navigator.vibrate?.(completed ? [30, 40, 30] : 12);
      } catch {
        /* optional API */
      }
    }
    if (state.settings.sound) {
      try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        audio.current ||= new Context();
        const ctx = audio.current;
        ctx.resume().catch(() => {});
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = completed ? 660 : 440;
        gain.gain.setValueAtTime(0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
      } catch {
        /* Counting remains available without audio. */
      }
    }
  }
  // Event handlers read the synchronous ref, so batched rapid clicks never lose counts.
  function tick() {
    if (notice) return;
    const now = new Date().getTime();
    const elapsed = lastTap.current
      ? Math.max(0, Math.min(now - lastTap.current, 30000))
      : 0;
    lastTap.current = now;
    feedback(count + 1 === target);
    commit((s) =>
      s.guided
        ? {
            ...s,
            guided: {
              ...advance(s.guided),
              elapsed: Math.min(MAX, (s.guided.elapsed || 0) + elapsed),
            },
          }
        : {
            ...s,
            sessions: {
              ...s.sessions,
              [s.selected]: {
                ...current,
                started: current.started || now,
                elapsed: Math.min(MAX, (current.elapsed || 0) + elapsed),
                count: Math.min(MAX, (s.sessions[s.selected]?.count || 0) + 1),
              },
            },
          },
    );
  }
  function updateCurrent(change) {
    commit((s) =>
      s.guided
        ? {
            ...s,
            guided: {
              ...s.guided,
              stages: s.guided.stages.map((item, i) =>
                i === s.guided.index ? { ...item, ...change } : item,
              ),
            },
          }
        : {
            ...s,
            sessions: {
              ...s.sessions,
              [s.selected]: { ...current, ...change },
            },
          },
    );
  }
  function archive(s) {
    const entries = s.guided
      ? s.guided.stages.map((item) => ({
          ...item,
          title: ZIKR.find((z) => z.id === item.id).title,
          elapsed: 0,
        }))
      : [{ ...current, title: zikr.title }];
    return [
      ...entries
        .filter((e) => e.count > 0)
        .map((e) => ({
          title: e.title,
          count: e.count,
          target: e.target,
          achieved: e.count >= e.target,
          date: new Date().toISOString(),
          duration: s.guided ? null : Math.round((e.elapsed || 0) / 1000),
        })),
      ...s.history,
    ].slice(0, 500);
  }
  function finish() {
    commit((s) => ({
      ...s,
      history: archive(s),
      guided: null,
      sessions: s.guided
        ? s.sessions
        : { ...s.sessions, [s.selected]: { count: 0, target, elapsed: 0 } },
    }));
    lastTap.current = 0;
    closeConfirmation();
  }
  function choose(id) {
    commit((s) => ({
      ...s,
      selected: id,
      sessions: s.sessions[id]
        ? s.sessions
        : {
            ...s.sessions,
            [id]: {
              count: 0,
              target:
                all.find((z) => z.id === id)?.target ||
                s.settings.defaultTarget,
              elapsed: 0,
            },
          },
    }));
    lastTap.current = 0;
  }
  function closeConfirmation() {
    setConfirm("");
    returnFocus.current?.focus();
  }
  function openConfirmation(kind) {
    returnFocus.current = document.activeElement;
    setConfirm(kind);
  }
  function resume() {
    try {
      const raw = readPersisted(KEY);
      if (raw) {
        const next = restore(JSON.parse(raw));
        stateRef.current = next;
        setState(next);
        setNotice("");
        setStorageError(false);
      }
    } catch {
      setStorageError(true);
    }
  }
  function setting(key, value) {
    commit((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
    if (key === "defaultTarget") setCustomTarget(String(value));
  }
  return (
    <section
      className={`tasbih ${focus ? "tasbih-focus" : ""}`}
      data-theme={resolvedAppearance}
      aria-label="Tasbih Digital"
    >
      <header className="tasbih-topbar">
        <button
          className="tasbih-icon"
          onClick={() => {
            if (focus) {
              setFocus(false);
              onFocusChange(false);
            }
            onBack?.();
          }}
          aria-label="Kembali ke utama"
        >
          <ArrowLeft size={21} />
        </button>
        <h1>Tasbih Digital</h1>
        <button
          className="tasbih-icon tasbih-focus-toggle"
          aria-label={focus ? "Keluar mod fokus" : "Mod fokus"}
          onClick={() => {
            setFocus(!focus);
            onFocusChange(!focus);
          }}
        >
          {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
        <button
          className="tasbih-icon"
          onClick={() => setPanel(panel === "settings" ? "" : "settings")}
          aria-label="Tetapan"
          aria-expanded={panel === "settings"}
        >
          <Settings2 size={20} />
        </button>
      </header>
      {libraryOffer && (
        <div className="tasbih-panel library-tasbih-offer">
          <h2>{libraryOffer.entry.title_ms}</h2>
          <p>
            Sasaran {libraryOffer.entry.recommended_count} ·{" "}
            {libraryOffer.entry.recommended_count_reference}. Kiraan terdahulu
            dikekalkan; hanya sasaran ditukar.
          </p>
          {guided && (
            <p>
              Sesi berpandu aktif akan disimpan dalam sejarah sebelum bertukar
              zikr.
            </p>
          )}
          <div className="tasbih-row">
            <button
              onClick={() => setHandledLibraryNonce(libraryRequest?.nonce)}
            >
              Batal
            </button>
            <button
              disabled={!!notice}
              className="tasbih-primary"
              onClick={() => {
                const requested = libraryOffer.entry;
                const id = libraryTasbihId(requested);
                commit((s) => ({
                  ...s,
                  history: s.guided ? archive(s) : s.history,
                  guided: null,
                  selected: id,
                  sessions: {
                    ...s.sessions,
                    [id]: {
                      ...s.sessions[id],
                      count: s.sessions[id]?.count || 0,
                      elapsed: s.sessions[id]?.elapsed || 0,
                      target: requested.recommended_count,
                    },
                  },
                }));
                setHandledLibraryNonce(libraryRequest?.nonce);
                lastTap.current = 0;
              }}
            >
              Gunakan zikir ini
            </button>
          </div>
        </div>
      )}
      {storageError && (
        <p role="alert" className="tasbih-alert">
          Simpanan pelayar tidak tersedia atau penuh. Anda masih boleh mengira,
          tetapi kemajuan mungkin hilang apabila halaman ditutup.
        </p>
      )}
      {notice && (
        <p role="alert" className="tasbih-alert">
          {notice}
        </p>
      )}
      {!focus && (
        <div className="tasbih-toolbar" aria-label="Mod tasbih">
          <button
            aria-pressed={!guided && panel === ""}
            onClick={() => (guided ? openConfirmation("leave") : setPanel(""))}
          >
            Zikir
          </button>
          <button
            aria-pressed={!!guided || panel === "guided"}
            onClick={() => setPanel(panel === "guided" ? "" : "guided")}
          >
            Mod Panduan
          </button>
          <button
            aria-pressed={panel === "history"}
            onClick={() => setPanel(panel === "history" ? "" : "history")}
            aria-expanded={panel === "history"}
          >
            Sejarah
          </button>
        </div>
      )}
      {!focus && panel === "settings" && (
        <div className="tasbih-panel">
          <h2>Tetapan</h2>
          {[
            ["vibration", "Getaran (jika disokong)"],
            ["sound", "Bunyi lembut"],
            ["confirmReset", "Pengesahan tambahan untuk mula semula"],
          ].map(([key, label]) => (
            <label className="tasbih-check" key={key}>
              <input
                type="checkbox"
                checked={state.settings[key]}
                onChange={(e) => setting(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
          <p>Kiraan bukan sifar sentiasa memerlukan pengesahan.</p>
          <label>
            Tema
            <select
              value={appearance}
              onChange={(e) => {setting("theme", e.target.value);setAppearance(e.target.value);}}
            >
              <option value="light">Cerah</option>
              <option value="dark">Gelap</option>
              <option value="system">Ikut peranti</option>
            </select>
          </label>
          <label>
            Sasaran lalai untuk zikr baharu
            <input
              type="number"
              min="1"
              max={MAX}
              value={state.settings.defaultTarget}
              onChange={(e) =>
                setting("defaultTarget", integer(e.target.value, 33, 1))
              }
            />
          </label>
        </div>
      )}
      {!focus && panel === "guided" && (
        <form
          className="tasbih-panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (guided) {
              setNotice(
                "Selesaikan sesi berpandu dahulu sebelum memulakan sesi baharu.",
              );
              return;
            }
            commit((s) => ({
              ...s,
              guided: {
                stages: guideIds.map((id) => ({
                  id,
                  target: integer(guideTarget, 33, 1),
                  count: 0,
                })),
                index: 0,
                started: Date.now(),
                elapsed: 0,
              },
            }));
            setPanel("");
          }}
        >
          <h2>Susun sesi berpandu</h2>
          <p>
            Urutan dan bilangan ialah sasaran peribadi, bukan satu-satunya
            bentuk zikr selepas solat.
          </p>
          {guideIds.map((id, index) => (
            <label key={index}>
              Peringkat {index + 1}
              <select
                value={id}
                onChange={(e) =>
                  setGuideIds((ids) =>
                    ids.map((v, i) => (i === index ? e.target.value : v)),
                  )
                }
              >
                {ZIKR.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.title}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Sasaran setiap peringkat
            <input
              type="number"
              required
              min="1"
              max={1000000}
              value={guideTarget}
              onChange={(e) => setGuideTarget(e.target.value)}
            />
          </label>
          <button className="tasbih-primary" disabled={!!guided}>
            Mulakan sesi
          </button>
        </form>
      )}
      {!focus && panel === "history" && (
        <div className="tasbih-panel">
          <h2>Sejarah peribadi</h2>
          <p>
            {state.history
              .reduce((sum, h) => sum + BigInt(h.count), 0n)
              .toLocaleString("ms-MY")}{" "}
            ulangan dalam {state.history.length} catatan tersimpan.
          </p>
          <p>
            Hanya pada peranti ini · 500 catatan terkini. Sesi aktif belum
            dimasukkan.
          </p>
          {state.history.length === 0 ? (
            <p>Belum ada sesi disimpan.</p>
          ) : (
            <ul className="tasbih-history">
              {state.history.map((h, i) => (
                <li key={i}>
                  <div>
                    <strong>{h.title}</strong>
                    <small>
                      {new Date(h.date).toLocaleString("ms-MY")}{" "}
                      {h.duration != null && `· ${h.duration}s aktif`}
                    </small>
                  </div>
                  <div>
                    {h.count.toLocaleString("ms-MY")}
                    <small>
                      {h.achieved ? "Sasaran dicapai" : "Sesi disimpan"}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="tasbih-card">
        {guided ? (
          <div className="tasbih-guided">
            <span>
              Peringkat {guided.index + 1} / {guided.stages.length} · {total} /{" "}
              {totalTarget} ulangan
            </span>
            <progress
              max={totalTarget}
              value={total}
              aria-label="Kemajuan keseluruhan"
            />
            <div className="tasbih-row">
              {guided.stages.map((s, i) => (
                <button
                  key={i}
                  aria-current={guided.index === i ? "step" : undefined}
                  onClick={() =>
                    commit((v) => ({ ...v, guided: { ...v.guided, index: i } }))
                  }
                >
                  {i + 1}
                  {s.count >= s.target ? " ✓" : ""}
                </button>
              ))}
            </div>
            <small>
              {guided.index < guided.stages.length - 1
                ? `Seterusnya: ${ZIKR.find((z) => z.id === guided.stages[guided.index + 1].id).title}`
                : "Peringkat terakhir"}
            </small>
          </div>
        ) : (
          !focus && (
            <label className="tasbih-select-label">
              Pilih zikr
              <select
                value={state.selected}
                onChange={(e) => choose(e.target.value)}
              >
                {all.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.title}
                  </option>
                ))}
              </select>
            </label>
          )
        )}
        <div className="tasbih-verse">
          <h2>{zikr.title}</h2>
          {zikr.arabic && (
            <p className="tasbih-arabic" lang="ar" dir="rtl">
              {zikr.arabic}
            </p>
          )}
          {zikr.transliteration && <p>{zikr.transliteration}</p>}
          <p>{zikr.meaning}</p>
          {zikr.source && <small>{zikr.source}</small>}
        </div>
        <button
          className="tasbih-counter"
          onClick={tick}
          disabled={!!notice}
          aria-label={`Tambah kiraan ${zikr.title}`}
          onKeyDown={(e) => {
            if (e.repeat && [" ", "Enter"].includes(e.key)) e.preventDefault();
          }}
        >
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <circle className="tasbih-track" cx="120" cy="120" r="110" />
            <circle
              className="tasbih-ring"
              cx="120"
              cy="120"
              r="110"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - Math.min((count / target) * 100, 100)}
            />
          </svg>
          <span
            className="tasbih-count"
            style={{ fontSize: count > 999999 ? "1.65rem" : undefined }}
          >
            {count.toLocaleString("ms-MY")}
          </span>
          <span className="tasbih-counter-target">
            / {target.toLocaleString("ms-MY")}
          </span>
          <span className="tasbih-tap">Tap untuk kira</span>
        </button>
        <p className="tasbih-completion" role="status">
          {sessionDone
            ? "Alhamdulillah · Semua peringkat selesai"
            : done
              ? "Alhamdulillah · Sasaran dicapai"
              : `${Math.min(100, Math.floor((count / target) * 100))}% daripada sasaran`}
        </p>
        {done && (
          <p className="tasbih-hint">
            {guided && !sessionDone
              ? "Peringkat seterusnya tersedia. Sentuhan berikutnya mengira zikr seterusnya."
              : "Teruskan berzikir atau simpan sesi anda."}
          </p>
        )}
        {!focus && (
          <>
            <div className="tasbih-targets">
              <h2>Pilih jumlah sasaran</h2>
              <p>
                Bilangan boleh disesuaikan; ia bukan penetapan hukum atau
                tuntutan khusus.
              </p>
              <div className="tasbih-row">
                {[33, 99, 100, 1000].map((n) => (
                  <button
                    key={n}
                    aria-pressed={target === n}
                    onClick={() => updateCurrent({ target: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <form
                className="tasbih-inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCurrent({ target: integer(targetInput, target, 1) });
                  setTargetInput("");
                }}
              >
                <label>
                  Sasaran tersuai
                  <input
                    type="number"
                    required
                    min="1"
                    max={MAX}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Contoh: 500"
                  />
                </label>
                <button type="submit">Tetapkan</button>
              </form>
            </div>
          </>
        )}
        <div className="tasbih-actions">
          <button
            disabled={!count}
            onClick={() => updateCurrent({ count: Math.max(0, count - 1) })}
          >
            <Undo2 size={17} /> Undo
          </button>
          <button
            onClick={() =>
              count ||
              guided?.stages.some((s) => s.count) ||
              state.settings.confirmReset
                ? openConfirmation("reset")
                : updateCurrent({ count: 0 })
            }
          >
            <RotateCcw size={17} /> Reset
          </button>
          <button onClick={resume}>Teruskan</button>
        </div>
        <button
          className="tasbih-save"
          onClick={() => openConfirmation("finish")}
        >
          <Check size={17} /> Simpan & tamat sesi
        </button>
        {!focus && (
          <details className="tasbih-meaning">
            <summary>
              <span className="meaning-icon">
                <BookOpen size={21} />
              </span>
              <span>
                Makna zikir ini<small>{zikr.meaning}</small>
              </span>
            </summary>
            <p>
              {zikr.source ||
                "Hayati maknanya dengan tenang. Bilangan sasaran boleh disesuaikan mengikut pilihan peribadi."}
            </p>
          </details>
        )}
      </div>
      {!focus && (
        <>
          {!guided && (
            <details className="tasbih-panel">
              <summary>Tambah zikr peribadi</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customTitle.trim()) return;
                  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  commit((s) => ({
                    ...s,
                    custom: [
                      ...s.custom,
                      {
                        id,
                        title: customTitle.trim(),
                        target: integer(
                          customTarget,
                          s.settings.defaultTarget,
                          1,
                        ),
                        arabic: "",
                        meaning: "Zikr peribadi",
                      },
                    ],
                    selected: id,
                  }));
                  setCustomTitle("");
                }}
              >
                <label>
                  Nama zikr
                  <input
                    required
                    maxLength={80}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </label>
                <label>
                  Sasaran
                  <input
                    required
                    type="number"
                    min="1"
                    max={MAX}
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                  />
                </label>
                <button
                  disabled={state.custom.length >= 50}
                  className="tasbih-primary"
                >
                  Tambah zikr
                </button>
              </form>
            </details>
          )}
          <p className="tasbih-privacy">
            Zikir anda kekal peribadi. Disimpan pada pelayar ini sahaja. Selepas
            halaman dimuatkan, pengiraan boleh diteruskan tanpa internet.
          </p>
        </>
      )}
      {confirm && (
        <div className="tasbih-modal-backdrop">
          <div
            className="tasbih-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tasbih-confirm"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeConfirmation();
              if (e.key === "Tab") {
                const buttons = e.currentTarget.querySelectorAll("button");
                if (e.shiftKey && document.activeElement === buttons[0]) {
                  e.preventDefault();
                  buttons[1].focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === buttons[1]
                ) {
                  e.preventDefault();
                  buttons[0].focus();
                }
              }
            }}
          >
            <h2 id="tasbih-confirm">
              {confirm === "reset"
                ? "Mulakan semula?"
                : "Simpan dan tamatkan sesi?"}
            </h2>
            <p>
              {confirm === "reset"
                ? "Kiraan sesi ini akan kembali kepada sifar. Sejarah terdahulu dikekalkan."
                : "Kiraan sesi ini akan disimpan dalam sejarah peribadi."}
            </p>
            <div className="tasbih-row">
              <button autoFocus onClick={closeConfirmation}>
                Batal
              </button>
              <button
                className="tasbih-primary"
                onClick={() => {
                  if (confirm !== "reset") finish();
                  else {
                    commit((s) =>
                      s.guided
                        ? {
                            ...s,
                            guided: {
                              ...s.guided,
                              index: 0,
                              elapsed: 0,
                              started: Date.now(),
                              stages: s.guided.stages.map((item) => ({
                                ...item,
                                count: 0,
                              })),
                            },
                          }
                        : {
                            ...s,
                            sessions: {
                              ...s.sessions,
                              [s.selected]: { count: 0, target, elapsed: 0 },
                            },
                          },
                    );
                    closeConfirmation();
                    lastTap.current = 0;
                  }
                }}
              >
                Ya, teruskan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
