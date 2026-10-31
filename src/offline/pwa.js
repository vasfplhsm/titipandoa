import { flushPersistence } from "./persistence.js";
let registration;
let waiting;
let reloading = false;
let state = { ready: false, update: false, error: null };
export const pwaState = () => state;
function notify(change) {
  state = { ...state, ...change };
  window.dispatchEvent(new CustomEvent("titipandoa:pwa", { detail: state }));
}
export async function registerPwa() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  try {
    registration = await navigator.serviceWorker.register(
      new URL("./sw.js", document.baseURI),
      {
        scope: new URL("./", document.baseURI).pathname,
        updateViaCache: "none",
      },
    );
    function inspect() {
      if (registration.waiting && navigator.serviceWorker.controller) {
        waiting = registration.waiting;
        notify({ update: true });
      }
    }
    inspect();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") inspect();
        if (worker.state === "redundant")
          notify({
            error:
              "Kemas kini tidak dapat dimuatkan. Versi sedia ada dikekalkan.",
          });
      });
    });
    await navigator.serviceWorker.ready;
    notify({ ready: true, error: null });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) {
        location.reload();
      }
    });
    let lastCheck = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine &&
        Date.now() - lastCheck > 1800000
      ) {
        lastCheck = Date.now();
        registration.update().catch(() => {});
      }
    });
  } catch {
    notify({
      error:
        "Simpanan aplikasi luar talian belum siap. Buka semula ketika dalam talian.",
    });
  }
}
export async function prepareShell() {
  if (!import.meta.env.PROD)
    throw new Error("Simpanan aplikasi tersedia pada binaan produksi.");
  if (!registration) await registerPwa();
  if (!registration)
    throw new Error("Pelayar ini tidak menyediakan service worker.");
  await navigator.serviceWorker.ready;
  if (!state.ready)
    throw new Error(state.error || "Simpanan aplikasi belum siap.");
  return registration;
}
export async function applyUpdate() {
  await flushPersistence();
  if (!waiting) throw new Error("Kemas kini belum tersedia.");
  reloading = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
}
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true;
