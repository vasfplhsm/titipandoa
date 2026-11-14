import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Share2,
  Copy,
  MessageCircle,
  Settings,
  Search,
  LogOut,
} from "lucide-react";
import { filterPrayers, publicURL, cleanProfile, CATEGORIES } from "./model";
import { readPersisted, savePersisted } from "../offline/persistence";
import { supabase } from "../supabaseClient";
import { verifiedOwner } from "../offline/sync";
import { useTheme } from "../theme/ThemeProvider";
import ThemeSelector from "../theme/ThemeSelector";
import { THEMES_BY_ID } from "../theme/model";
export function OwnerInbox({ rows, onRead, navigate, onLogout, onError }) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [ascending, setAscending] = useState(false),
    [busy, setBusy] = useState(null);
  const filtered = filterPrayers(rows, query, category, status, ascending);
  const read = rows.filter((r) => r.is_read).length;
  return (
    <section className="owner-space">
      <div className="workspace-heading">
        <div>
          <span className="kicker">RUANG PERIBADI JEMAAH</span>
          <h1>Doa yang dibawa bersama.</h1>
          <p>
            {read} daripada {rows.length} doa telah dibacakan.
          </p>
        </div>
        <button className="secondary" onClick={onLogout}>
          <LogOut size={16} /> Keluar
        </button>
      </div>
      <progress
        value={read}
        max={rows.length || 1}
        aria-label="Kemajuan bacaan"
      />
      <div className="workspace-actions">
        <button className="primary" onClick={() => navigate("focus")}>
          <BookOpen size={17} /> Mod Bacaan
        </button>
        <button className="secondary" onClick={() => navigate("settings")}>
          <Share2 size={17} /> Kongsi Pautan & Tetapan
        </button>
        <button className="secondary" onClick={() => navigate("umrahhub")}>
          Pengurusan Perjalanan
        </button>
        <button className="secondary" onClick={() => navigate("offline")}>
          Muat turun untuk luar talian
        </button>
      </div>
      <div className="inbox-filters">
        <label>
          <Search size={16} />
          <input
            aria-label="Cari doa"
            placeholder="Cari nama atau doa…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Kategori doa"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Semua kategori</option>
          {[...new Set([...CATEGORIES, ...rows.map((r) => r.category)])]
            .filter(Boolean)
            .map((c) => (
              <option key={c}>{c}</option>
            ))}
        </select>
        <select
          aria-label="Status bacaan"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua status</option>
          <option value="unread">Belum dibacakan</option>
          <option value="read">Dibacakan</option>
        </select>
        <select
          aria-label="Susunan doa"
          value={ascending ? "old" : "new"}
          onChange={(e) => setAscending(e.target.value === "old")}
        >
          <option value="new">Terbaharu dahulu</option>
          <option value="old">Terdahulu dahulu</option>
        </select>
      </div>
      <div className="prayer-inbox">
        {filtered.length ? (
          filtered.map((row) => (
            <article key={row.id}>
              <div className="inbox-meta">
                <span>{row.category || "Lain-lain"}</span>
                <small>
                  {new Date(row.created_at).toLocaleDateString("ms-MY")}
                </small>
              </div>
              <h2>{row.sender_name || "Tanpa nama"}</h2>
              <p>{row.message}</p>
              <button
                className={row.is_read ? "secondary" : "primary"}
                disabled={busy === row.id}
                onClick={async () => {
                  setBusy(row.id);
                  try {
                    await onRead(row.id);
                  } catch (e) {
                    onError(e.message);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {row.is_read ? (
                  <>
                    <Check size={16} /> Dibacakan · Batalkan tanda
                  </>
                ) : (
                  "Tandakan Sudah Dibaca"
                )}
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <BookOpen size={30} />
            <h2>
              {rows.length
                ? "Tiada doa sepadan."
                : "Ruang ini menunggu doa pertama."}
            </h2>
            <p>
              {rows.length
                ? "Cuba ubah carian atau penapis anda."
                : "Kongsi pautan dengan keluarga dan sahabat apabila anda bersedia."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
export function PrayerReader({
  rows,
  onRead,
  navigate,
  onError,
  connected = true,
}) {
  const [savedId, setSavedId] = useState(
    () => readPersisted("titipandoa.reader.resume") || null,
  );
  const [size, setSize] = useState(() =>
    Math.max(
      20,
      Math.min(36, Number(readPersisted("titipandoa.reader.size")) || 26),
    ),
  );
  const [busy, setBusy] = useState(false);
  const index = Math.max(
      0,
      rows.findIndex((r) => String(r.id) === String(savedId)),
    ),
    row = rows[index];
  function move(offset) {
    const next = rows[index + offset];
    if (next) {
      setSavedId(next.id);
      savePersisted("titipandoa.reader.resume", next.id);
      window.scrollTo(0, 0);
    }
  }
  function resize(delta) {
    const next = Math.max(20, Math.min(36, size + delta));
    setSize(next);
    savePersisted("titipandoa.reader.size", next);
  }
  return (
    <section className="prayer-reader">
      <div className="reader-tools">
        <button className="text-button" onClick={() => navigate("dashboard")}>
          <ArrowLeft size={17} /> Senarai Doa
        </button>
        <div>
          <button
            className="secondary"
            aria-label="Kecilkan teks"
            disabled={size === 20}
            onClick={() => resize(-2)}
          >
            A−
          </button>
          <button
            className="secondary"
            aria-label="Besarkan teks"
            disabled={size === 36}
            onClick={() => resize(2)}
          >
            A+
          </button>
        </div>
      </div>
      {row ? (
        <>
          <div className="reader-progress">
            <span>
              {connected ? "MOD BACAAN" : "LUAR TALIAN · SALINAN PERANTI"}
            </span>
            <span>
              {index + 1} / {rows.length}
            </span>
          </div>
          <article>
            <span className="reader-category">
              {row.category || "Lain-lain"}
            </span>
            <h1>{row.sender_name || "Tanpa nama"}</h1>
            <p style={{ fontSize: size }}>{row.message}</p>
            <button
              className={row.is_read ? "secondary" : "primary"}
              disabled={busy || !connected}
              onClick={async () => {
                setBusy(true);
                try {
                  await onRead(row.id);
                } catch (e) {
                  onError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {row.is_read ? (
                <>
                  <Check size={18} /> Dibacakan · Batalkan tanda
                </>
              ) : (
                "Tandakan Sudah Dibaca"
              )}
            </button>
            <small>
              Tanda bacaan hanya berubah apabila anda memilihnya. Penyimpanan
              status memerlukan sambungan.
            </small>
          </article>
          <div className="reader-pagination">
            <button
              className="secondary"
              disabled={index === 0}
              onClick={() => move(-1)}
            >
              <ArrowLeft size={17} /> Sebelumnya
            </button>
            <button
              className="secondary"
              disabled={index === rows.length - 1}
              onClick={() => move(1)}
            >
              Seterusnya <ArrowRight size={17} />
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BookOpen />
          <h1>Belum ada doa untuk dibaca.</h1>
          <p>
            Untuk bacaan luar talian, muat turun doa terlebih dahulu dari ruang
            Luar Talian.
          </p>
        </div>
      )}
    </section>
  );
}
export function OwnerSettings({ profile, onSaved, onError, flights }) {
  const { palette, appearance } = useTheme();
  const [publishing, setPublishing] = useState(false);
  const [themeNotice, setThemeNotice] = useState("");
  async function publishTheme() {
    setPublishing(true);
    setThemeNotice("");
    try {
      if (!navigator.onLine || !(await verifiedOwner()))
        throw Error("Sahkan akaun pemilik dalam talian dahulu.");
      const settings = cleanProfile({
        public_theme: palette,
        public_appearance: appearance,
      });
      const { data, error } = await supabase
        .from("tumpangdoa_public_profile")
        .update({
          public_theme: settings.public_theme,
          public_appearance: settings.public_appearance,
        })
        .eq("id", "default")
        .select("*")
        .single();
      if (
        error ||
        !data ||
        data.public_theme !== settings.public_theme ||
        data.public_appearance !== settings.public_appearance
      )
        throw Error(
          "Tema awam belum disimpan. Pastikan migrasi tema awam yang disemak telah dipasang dan akses pemilik disahkan.",
        );
      await onSaved(cleanProfile(data));
      setThemeNotice(
        "Tema awam disahkan dan disimpan. Pelawat baharu akan melihat pilihan ini.",
      );
    } catch (error) {
      setThemeNotice(error.message);
      onError(error.message);
    } finally {
      setPublishing(false);
    }
  }
  // Read untouched fields from the latest hydrated profile rather than freezing
  // the initial defaults. Only intentional form edits are stored locally.
  const [edits, setEdits] = useState({});
  const draft = { ...cleanProfile(profile), ...edits };
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const url = publicURL(window.location),
    text = `${draft.sharing_text}\n\n${url}`;
  function change(key, value) {
    setEdits((p) => ({ ...p, [key]: value }));
  }
  async function save(e) {
    e.preventDefault();
    const submittedEdits = { ...edits };
    const submittedProfile = { ...cleanProfile(profile), ...submittedEdits };
    setBusy(true);
    setNotice("");
    try {
      if (!navigator.onLine || !(await verifiedOwner()))
        throw Error("Sahkan akaun pemilik dalam talian dahulu.");
      const value = cleanProfile(submittedProfile);
      // Theme publication is an explicit, separate owner action. Send only edited
      // fields so late hydration or another device's untouched values stay intact.
      delete value.public_theme;
      delete value.public_appearance;
      const changes = Object.fromEntries(
        Object.keys(submittedEdits)
          .filter((key) => Object.hasOwn(value, key))
          .map((key) => [key, value[key]]),
      );
      if (!Object.keys(changes).length) {
        setNotice("Tiada perubahan untuk disimpan.");
        return;
      }
      const { data, error } = await supabase
        .from("tumpangdoa_public_profile")
        .update(changes)
        .eq("id", "default")
        .select("*")
        .single();
      if (
        error ||
        !data ||
        Object.entries(changes).some(([key, value]) => data[key] !== value)
      )
        throw Error(
          "Tetapan belum disimpan. Pastikan migrasi profil awam yang disemak telah dipasang.",
        );
      await onSaved(cleanProfile(data));
      // Keep any newer edits made while the request was in flight.
      setEdits((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([key, value]) =>
              !Object.hasOwn(submittedEdits, key) ||
              value !== submittedEdits[key],
          ),
        ),
      );
      setNotice("Tetapan disahkan dan disimpan.");
    } catch (e) {
      onError(e.message);
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="owner-settings">
      <span className="kicker">SENTUHAN PERIBADI</span>
      <h1>Tetapan perjalanan</h1>
      <section className="share-panel">
        <Share2 size={24} />
        <h2>Kongsi sedikit harapan.</h2>
        <p>Pautan ini membuka halaman kiriman awam tanpa akses pemilik.</p>
        <code>{url}</code>
        <div className="workspace-actions">
          <a
            className="primary"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
          {navigator.share && (
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await navigator.share({
                    title: "Tumpang Doa",
                    text: draft.sharing_text,
                    url,
                  });
                } catch (e) {
                  if (e.name !== "AbortError")
                    setNotice("Perkongsian belum berjaya. Cuba salin pautan.");
                }
              }}
            >
              Kongsi
            </button>
          )}
          <button
            className="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setNotice("Pautan disalin.");
              } catch {
                setNotice("Salin pautan yang dipaparkan secara manual.");
              }
            }}
          >
            <Copy size={16} /> Salin pautan
          </button>
        </div>
        <small>
          Pratonton WhatsApp bergantung pada hos dan cache aplikasi.
        </small>
      </section>
      <ThemeSelector />
      <section
        className="share-panel public-theme-settings"
        aria-labelledby="public-theme-heading"
      >
        <h3 id="public-theme-heading">Tema untuk pelawat</h3>
        <p>
          Tema awam semasa:{" "}
          {THEMES_BY_ID[profile.public_theme || "rosewood"]?.name ||
            "Rosewood & Champagne"}
          ,{" "}
          {
            { light: "Cerah", dark: "Gelap", system: "Ikut tetapan peranti" }[
              profile.public_appearance || "light"
            ]
          }
          . Pilihan paparan pada peranti ini kekal setempat sehingga anda
          menyimpannya sebagai tema awam.
        </p>
        <button
          type="button"
          className="secondary"
          disabled={publishing || busy}
          onClick={publishTheme}
        >
          {publishing ? "Menyimpan tema awam…" : "Jadikan tema awam"}
        </button>
        {themeNotice && <p role="status">{themeNotice}</p>}
      </section>
      <form onSubmit={save}>
        <Settings size={22} />
        <p>
          Pengumuman asal dikekalkan sepenuhnya. Pesanan peribadi ini dipaparkan
          sebagai tambahan selepasnya.
        </p>
        {[
          ["display_name", "Nama paparan jemaah"],
          ["announcement", "Pesanan peribadi"],
          ["welcome_message", "Mesej alu-aluan"],
          ["departure_date", "Tarikh berangkat"],
          ["return_date", "Tarikh pulang"],
          ["sharing_text", "Teks perkongsian"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            {["announcement", "sharing_text", "welcome_message"].includes(
              key,
            ) ? (
              <textarea
                aria-label={label}
                rows={4}
                maxLength={2000}
                value={draft[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            ) : (
              <input
                aria-label={label}
                type={key.includes("date") ? "date" : "text"}
                maxLength={200}
                value={draft[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            )}
          </label>
        ))}
        <small>
          Tarikh penerbangan sedia ada:{" "}
          {flights.departure.date || "belum ditetapkan"} /{" "}
          {flights.return.date || "belum ditetapkan"}. Maklumat penerbangan
          kekal di Pengurusan Perjalanan.
        </small>
        <label className="check-label">
          <input
            type="checkbox"
            checked={draft.accepting_submissions}
            onChange={(e) => change("accepting_submissions", e.target.checked)}
          />{" "}
          Terima kiriman doa baharu
        </label>
        <p>
          Maklumat dalam tetapan ini dipaparkan kepada pelawat. Jangan masukkan
          nombor penerbangan, kewangan atau catatan peribadi.
        </p>
        <button className="primary" disabled={busy || publishing}>
          {busy ? "Menyimpan…" : "Simpan Tetapan"}
        </button>
      </form>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
export function OwnerSignIn({ onClose, onVerified }) {
  const [email, setEmail] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("input")?.focus();
    function keydown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = [
        ...dialog.current.querySelectorAll(
          "button:not(:disabled),input:not(:disabled),a[href]",
        ),
      ];
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
    const node = dialog.current;
    node?.addEventListener("keydown", keydown);
    return () => {
      node?.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="owner-auth-backdrop">
      <section
        ref={dialog}
        className="owner-auth"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-title"
      >
        <button
          className="auth-close"
          aria-label="Tutup akses jemaah"
          onClick={onClose}
        >
          ×
        </button>
        <span className="kicker">KHUSUS BUAT JEMAAH</span>
        <h2 id="owner-title">Selamat kembali.</h2>
        <p>
          Log masuk dengan e-mel akaun pemilik. PIN peranti lama tidak membuka
          akses server.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (!supabase)
                throw Error("Sambungan Supabase belum dikonfigurasi.");
              const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                  shouldCreateUser: false,
                  emailRedirectTo: publicURL(window.location) + "#owner",
                },
              });
              if (error) throw error;
              setStatus(
                "Jika akaun tersedia, pautan log masuk dihantar ke e-mel anda.",
              );
            } catch (e) {
              setStatus(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="owner-email">E-mel pemilik</label>
          <input
            id="owner-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary" disabled={busy}>
            Hantar pautan log masuk
          </button>
        </form>
        <button
          className="secondary"
          onClick={async () => {
            setBusy(true);
            try {
              const owner = await verifiedOwner();
              if (!owner)
                throw Error(
                  "Akaun pemilik belum disahkan. Buka pautan e-mel dahulu.",
                );
              await onVerified(owner);
            } catch (e) {
              setStatus(e.message);
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          Semak sesi pemilik
        </button>
        {status && <p role="status">{status}</p>}
      </section>
    </div>
  );
}
