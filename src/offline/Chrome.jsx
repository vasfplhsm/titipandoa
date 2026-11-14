import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Download } from "lucide-react";
import { get } from "./db.js";
import { pendingOperations, syncIsActive } from "./sync.js";
import { pwaState, applyUpdate } from "./pwa.js";
export default function OfflineChrome({ navigate, hidden, saveBeforeUpdate, publicMode=false }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [last, setLast] = useState(null);
  const [pwa, setPwa] = useState(pwaState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      if (!mounted) return;
      setOnline(navigator.onLine);
      setSyncing(syncIsActive());
      try {
        const [ops, info] = await Promise.all([
          pendingOperations(),
          get("meta", "last-sync"),
        ]);
        if (mounted) {
          setCount(ops.length);
          setLast(info?.value || null);
        }
      } catch {
        /* Storage failures are shown by the write/download controls. */
      }
    }
    function changed(e) {
      setPwa(e.detail);
    }
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("titipandoa:offline-change", refresh);
    window.addEventListener("titipandoa:pwa", changed);
    return () => {
      mounted = false;
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("titipandoa:offline-change", refresh);
      window.removeEventListener("titipandoa:pwa", changed);
    };
  }, []);
  const label = syncing
    ? "Menyegerakkan..."
    : !online
      ? "Mod Luar Talian"
      : count
        ? "Perubahan Belum Disegerakkan"
        : last
          ? "Semua Data Dikemas Kini"
          : "Dalam Talian";
  return (
    <div hidden={hidden || (publicMode && online && !count && !pwa.update && !pwa.error)} className="offline-chrome">
      <button
        className={`connection-indicator ${online ? "" : "is-offline"}`}
        onClick={() => navigate("offline")}
        aria-label={`Status: ${label}`}
      >
        {syncing ? (
          <RefreshCw size={13} />
        ) : online ? (
          <Wifi size={13} />
        ) : (
          <WifiOff size={13} />
        )}
        <span>{label}</span>
        {count > 0 && <b>{count}</b>}
      </button>
      <button
        className="offline-setup-link"
        onClick={() => navigate("offline")}
      >
        <Download size={13} />
        Luar Talian
      </button>
      {last && (
        <span className="last-sync">
          Perubahan peranti disahkan: {new Date(last).toLocaleString("ms-MY", {timeZone:"Asia/Kuala_Lumpur"})}
        </span>
      )}
      {pwa.update && (
        <div className="pwa-update">
          <p>Versi baharu Tumpang Doa tersedia.</p>
          <button
            disabled={count > 0 || syncing}
            onClick={async () => {
              try {
                await saveBeforeUpdate();
                await applyUpdate();
              } catch (error) {
                setMessage(error.message);
              }
            }}
          >
            Kemas kini dengan selamat
          </button>
          {count > 0 && (
            <small>Selesaikan perubahan tertunda sebelum mengemas kini.</small>
          )}
        </div>
      )}
      {(message || pwa.error) && <p role="status">{message || pwa.error}</p>}
    </div>
  );
}
