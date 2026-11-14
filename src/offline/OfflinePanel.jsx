import { useEffect, useState, useRef } from "react";
import {
  Download,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Smartphone,
} from "lucide-react";
import { supabase, supabaseConfigured } from "../supabaseClient.js";
import { ENTRIES } from "../library/model.js";
import { get, put, remove, emitOffline } from "./db.js";
import {
  cachePrivate,
  localPatch,
  verifiedOwner,
  pendingOperations,
  synchronize,
  retryOperation,
  acceptServer,
  clearPrivate,
} from "./sync.js";
import { prepareShell, isStandalone } from "./pwa.js";
function TravelNotes({ rows, onMessage }) {
  const [selected, setSelected] = useState(rows[0]?.id || "");
  const [value, setValue] = useState("");
  const dirty = useRef(false);
  const previous = useRef(null);
  const serverNotes =
    rows.find((row) => String(row.id) === String(selected))?.notes || "";
  useEffect(() => {
    if (previous.current === selected && dirty.current) return;
    previous.current = selected;
    dirty.current = false;
    let active = true;
    get("notes", selected)
      .then((note) => {
        if (active) setValue(note?.value ?? serverNotes ?? "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [selected, serverNotes]);
  async function save(cloud) {
    try {
      await put("notes", { id: selected, value, updatedAt: Date.now() });
      if (cloud) {
        await localPatch("itinerary", selected, { notes: value });
        if (navigator.onLine) await synchronize();
      }
      onMessage(
        cloud
          ? "Nota dalam giliran; semak pengesahan server."
          : "Nota disimpan pada peranti.",
      );
    } catch (error) {
      onMessage(error.message);
    }
  }
  return (
    <article className="offline-card">
      <h2>Nota perjalanan</h2>
      <p>Simpan setempat atau pilih penyegerakan secara berasingan.</p>
      <select
        aria-label="Aktiviti untuk nota"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.activity}
          </option>
        ))}
      </select>
      <textarea
        aria-label="Nota perjalanan setempat"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          dirty.current = true;
          setValue(next);
          put("notes", {
            id: selected,
            value: next,
            updatedAt: Date.now(),
          }).catch(() =>
            onMessage("Nota belum dapat disimpan; jangan tutup halaman."),
          );
        }}
      />
      <button onClick={() => save(false)}>Simpan nota setempat</button>
      <button onClick={() => save(true)}>Simpan nota & segerak</button>
    </article>
  );
}
export default function OfflinePanel({isOwner=false}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [operations, setOperations] = useState([]);
  const [last, setLast] = useState(null);
  const [entities, setEntities] = useState([]);
  const [owner, setOwner] = useState(null);
  const [email, setEmail] = useState("");
  const [cachedItinerary, setCachedItinerary] = useState([]);
  const [drafts, setDrafts] = useState(false);
  const [stored, setStored] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const [ops, info, settings, itinerary, draft] = await Promise.all([
          pendingOperations(),
          get("meta", "offline-download"),
          get("preferences", "private-download"),
          get("privateRecords", "itinerary"),
          get("preferences", "save-drafts"),
        ]);
        if (mounted) {
          setOperations(ops);
          setLast(info?.value);
          setEntities(settings?.entities || []);
          setCachedItinerary(itinerary?.rows || []);
          setDrafts(draft?.value === true);
        }
      } catch {
        if (mounted) setMessage("Simpanan peranti tidak tersedia.");
      }
    }
    refresh();
    window.addEventListener("titipandoa:offline-change", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("titipandoa:offline-change", refresh);
    };
  }, []);
  async function download() {
    setBusy(true);
    setStored(false);
    setMessage("");
    try {
      await prepareShell();
      await put("publicContent", {
        id: "doa-zikir",
        entries: ENTRIES,
        updatedAt: Date.now(),
      });
      if (entities.length) {
        const user = await verifiedOwner();
        if (!user)
          throw new Error(
            "Log masuk pemilik yang disahkan diperlukan untuk memuat turun data peribadi.",
          );
        setOwner(user);
        await put("preferences", { id: "private-download", entities });
        for (const table of entities) {
          const { data, error } = await supabase.from(table).select("*");
          if (error) throw error;
          await cachePrivate(table, data, user.id);
        }
        if (entities.includes("itinerary")) {
          const flight = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "flights")
            .single();
          if (flight.data?.value?.departure && flight.data?.value?.return)
            await put("privateRecords", {
              id: "flights",
              value: flight.data.value,
              ownerId: user.id,
              updatedAt: Date.now(),
            });
          else if (flight.error && flight.error.code !== "PGRST116")
            throw flight.error;
        }
        await put("meta", { id: "private-owner", value: user.id });
      }
      await put("meta", { id: "offline-download", value: Date.now() });
      await navigator.storage?.persist?.();
      setStored(true);
      setMessage(
        "Aplikasi, doa dan zikir siap untuk kegunaan luar talian. Data peribadi yang dipilih sahaja disimpan.",
      );
      emitOffline();
    } catch (error) {
      setMessage(
        error.message || "Muat turun belum lengkap. Cuba lagi dalam talian.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signIn(event) {
    event.preventDefault();
    if (!supabaseConfigured) {
      setMessage("Sambungan akaun belum dikonfigurasi.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: new URL("./", location.href).href,
      },
    });
    setMessage(
      error
        ? error.message
        : "Jika akaun pemilik didaftarkan, pautan log masuk akan dihantar melalui e-mel.",
    );
    setBusy(false);
  }
  async function sync() {
    setBusy(true);
    try {
      await synchronize({ force: true });
      const remaining = await pendingOperations();
      setMessage(
        remaining.length
          ? "Masih ada perubahan yang memerlukan perhatian."
          : "Tiada perubahan tertunda. Semak waktu penyegerakan di bawah.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mobile-panel offline-panel">
      <header className="page-intro">
        <span className="eyebrow">TEMAN PERJALANAN ANDA</span>
        <h1>Luar Talian & Pemasangan</h1>
        <p>
          Bersedia sebelum perjalanan. Simpan bacaan dan pilih sendiri data
          peribadi yang diperlukan.
        </p>
      </header>
      {message && (
        <p role="status" className="offline-notice">
          {message}
        </p>
      )}
      <article className="offline-card">
        <h2>
          <Download size={22} />
          Sediakan bacaan luar talian
        </h2>
        <p>
          Aplikasi, {ENTRIES.length} doa dan zikir, fon serta Tasbih boleh
          dibuka semula selepas simpanan berjaya. Pelayar masih boleh membuang
          simpanan apabila ruang peranti terlalu penuh.
        </p>
        <p>
          Terakhir dimuat turun:{" "}
          {last
            ? new Date(last).toLocaleString("ms-MY", {
                timeZone: "Asia/Kuala_Lumpur",
              })
            : "Belum dimuat turun"}
        </p>
        <button className="button-primary" disabled={busy} onClick={download}>
          {busy ? "Sedang menyediakan..." : "Muat Turun untuk Kegunaan Offline"}
        </button>
        {stored && (
          <p className="offline-ready">
            <ShieldCheck size={16} />
            Simpanan disahkan pada peranti ini.
          </p>
        )}
      </article>
      {isOwner && <>
      <article className="offline-card">
        <h2>
          <ShieldCheck size={22} />
          Privasi pada peranti
        </h2>
        <p>
          Data peribadi tidak dimasukkan dalam cache umum aplikasi. Pilih hanya
          yang diperlukan. Salinan setempat tidak dienkripsi dan boleh dibaca
          oleh sesiapa yang mempunyai akses kepada profil pelayar ini. Gunakan
          kunci skrin iPhone.
        </p>
        {[
          ["doas", "Titipan doa peribadi"],
          ["checklist", "Senarai semak Umrah"],
          ["itinerary", "Jadual Umrah dan penerbangan"],
        ].map(([id, label]) => (
          <label className="offline-checkbox" key={id}>
            <input
              type="checkbox"
              checked={entities.includes(id)}
              onChange={(e) =>
                setEntities((items) =>
                  e.target.checked
                    ? [...items, id]
                    : items.filter((v) => v !== id),
                )
              }
            />
            {label}
          </label>
        ))}
        <p>
          Perbelanjaan, bajet dan bukti kelayakan tidak dimuat turun ke
          pangkalan data luar talian ini.
        </p>
        <label className="offline-checkbox">
          <input
            type="checkbox"
            checked={drafts}
            onChange={async (e) => {
              setDrafts(e.target.checked);
              await put("preferences", {
                id: "save-drafts",
                value: e.target.checked,
              });
              if (!e.target.checked) {
                await remove("drafts", "doa-submission");
              }
              emitOffline();
            }}
          />
          Simpan draf doa pada peranti ini
        </label>
        <button
          className="button-outline"
          onClick={async () => {
            if (
              !window.confirm(
                "Padam salinan data peribadi pada peranti ini? Data Supabase tidak dipadam.",
              )
            )
              return;
            try {
              await clearPrivate();
              setMessage("Salinan peribadi setempat dipadam.");
            } catch (error) {
              setMessage(error.message);
            }
          }}
        >
          <Trash2 size={16} />
          Padam salinan peribadi
        </button>
      </article>
      <article className="offline-card">
        <h2>Log masuk pemilik untuk segerak</h2>
        <p>
          PIN setempat tidak membuka paparan jemaah dan tidak memberi kuasa
          menyegerakkan data peribadi. Gunakan akaun pemilik yang telah
          disediakan.
        </p>
        <form onSubmit={signIn}>
          <label>
            E-mel pemilik
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="button-outline" disabled={busy}>
            Hantar pautan log masuk
          </button>
        </form>
        <button
          onClick={async () => {
            const user = await verifiedOwner();
            setOwner(user);
            setMessage(
              user
                ? "Akaun pemilik disahkan."
                : "Akaun pemilik belum disahkan.",
            );
          }}
        >
          Semak akaun pemilik
        </button>
        {owner && <p>Akaun disahkan untuk peranti ini.</p>}
        <button
          disabled={!navigator.onLine || !supabase}
          onClick={async () => {
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) {
              setMessage(error.message);
              return;
            }
            setOwner(null);
            setMessage(
              "Akaun dilog keluar. Perubahan tertunda dikekalkan dan memerlukan log masuk pemilik yang sama.",
            );
          }}
        >
          Log keluar akaun pemilik
        </button>
      </article>
      </>}
      <article className="offline-card">
        <h2>
          <RefreshCw size={22} />
          Perubahan belum disegerakkan
        </h2>
        <p>
          {operations.filter(op=>isOwner || op.kind==='doa').length} perubahan tertunda. Hanya pengesahan server
          menandakan perubahan selesai.
        </p>
        <button
          className="button-primary"
          disabled={busy || !navigator.onLine}
          onClick={sync}
        >
          Segerak sekarang
        </button>
        {operations.filter(op=>isOwner || op.kind==='doa').map((op) => (
          <div className="queue-item" key={op.id}>
            <strong>
              {op.entity} · {op.status}
            </strong>
            <small>
              {op.error || "Menunggu sambungan dan pengesahan server."}
            </small>
            <details>
              <summary>Lihat perubahan setempat</summary>
              <pre>{JSON.stringify(op.payload, null, 2)}</pre>
              {op.serverRow && (
                <>
                  <p>Versi server:</p>
                  <pre>{JSON.stringify(op.serverRow, null, 2)}</pre>
                </>
              )}
            </details>
            {op.status !== "conflict" && (
              <button
                onClick={async () => {
                  await retryOperation(op.id);
                  await sync();
                }}
              >
                Cuba semula
              </button>
            )}
            <button
              onClick={async () => {
                if (
                  window.confirm(
                    "Gugurkan perubahan setempat ini? Versi server dikekalkan; ini tidak memadam rekod server.",
                  )
                )
                  await acceptServer(op.id);
              }}
            >
              Gunakan versi server / gugurkan
            </button>
          </div>
        ))}
      </article>
      {isOwner && cachedItinerary.length > 0 && (
        <TravelNotes rows={cachedItinerary} onMessage={setMessage} />
      )}
      <article className="offline-card install-guide">
        <h2>
          <Smartphone size={22} />
          Pasang pada iPhone
        </h2>
        {isStandalone() ? (
          <p>
            Aplikasi sedang dibuka dalam mod kendiri. Anda boleh terus
            menyediakan kandungan luar talian.
          </p>
        ) : (
          <ol>
            <li>Buka laman ini dalam Safari.</li>
            <li>Tekan Kongsi (Share).</li>
            <li>Pilih Tambah ke Skrin Utama (Add to Home Screen).</li>
            <li>Aktifkan Open as Web App jika pilihan itu tersedia.</li>
            <li>Tekan Tambah, kemudian buka Tumpang Doa dari Skrin Utama.</li>
            <li>
              Tekan Muat Turun untuk Kegunaan Offline dan tunggu pengesahan
              sebelum mengaktifkan mod kapal terbang.
            </li>
          </ol>
        )}
        <p>
          Widget dalam aplikasi tidak menjadi widget Skrin Utama iPhone secara
          automatik. Widget asli disediakan melalui aplikasi pendamping iOS yang
          berasingan.
        </p>
      </article>
    </section>
  );
}
