import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readPersisted, savePersisted } from "../offline/persistence";
import {
  APPEARANCE_KEY,
  PALETTE_KEY,
  validAppearance,
  validPalette,
  selectPreferences,
  resolveAppearance,
  themeVariables,
} from "./model";
const ThemeContext = createContext(null);
function readOverride(key, valid) {
  const raw = readPersisted(key);
  return valid(raw) ? raw : null;
}
export function ThemeProvider({ publicTheme, publicAppearance, children }) {
  const [paletteOverride, setPaletteOverride] = useState(() =>
    readOverride(PALETTE_KEY, validPalette),
  );
  const [appearanceOverride, setAppearanceOverride] = useState(() =>
    readOverride(APPEARANCE_KEY, validAppearance),
  );
  const [deviceDark, setDeviceDark] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [persistenceError, setPersistenceError] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const changed = () => setDeviceDark(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    function changed(event) {
      const key = event.type === "storage" ? event.key : event.detail?.key;
      const value =
        event.type === "storage" ? event.newValue : event.detail?.value;
      if (key === PALETTE_KEY)
        setPaletteOverride(validPalette(value) ? value : null);
      if (key === APPEARANCE_KEY)
        setAppearanceOverride(validAppearance(value) ? value : null);
    }
    window.addEventListener("storage", changed);
    window.addEventListener("titipandoa:persisted", changed);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("titipandoa:persisted", changed);
    };
  }, []);
  const { palette, appearance } = selectPreferences(
    publicTheme,
    publicAppearance,
    paletteOverride,
    appearanceOverride,
  );
  const resolvedAppearance = resolveAppearance(appearance, deviceDark);
  const themeStyle = useMemo(
    () => themeVariables(palette, resolvedAppearance),
    [palette, resolvedAppearance],
  );
  useEffect(() => {
    const root = document.documentElement,
      body = document.body;
    const meta = document.querySelector('meta[name="theme-color"]');
    root.style.colorScheme = resolvedAppearance;
    root.style.backgroundColor = themeStyle["--theme-background"];
    body.style.backgroundColor = themeStyle["--theme-background"];
    if (meta)
      meta.setAttribute(
        "content",
        themeStyle[
          resolvedAppearance === "dark"
            ? "--theme-background"
            : "--theme-primary"
        ],
      );
  }, [resolvedAppearance, themeStyle]);
  function persist(key, value) {
    // Empty strings explicitly mean “follow the owner's defaults”; existing keys are retained.
    savePersisted(key, value || "").then((ok) => setPersistenceError(!ok));
  }
  function setPalette(value) {
    if (validPalette(value)) {
      setPaletteOverride(value);
      persist(PALETTE_KEY, value);
    }
  }
  function setAppearance(value) {
    if (validAppearance(value)) {
      setAppearanceOverride(value);
      persist(APPEARANCE_KEY, value);
    }
  }
  function clearOverrides() {
    setPaletteOverride(null);
    setAppearanceOverride(null);
    persist(PALETTE_KEY, "");
    persist(APPEARANCE_KEY, "");
  }
  return (
    <ThemeContext.Provider
      value={{
        palette,
        appearance,
        resolvedAppearance,
        themeStyle,
        setPalette,
        setAppearance,
        clearOverrides,
        hasOverrides: paletteOverride !== null || appearanceOverride !== null,
        persistenceError,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw Error("Theme controls require ThemeProvider.");
  return context;
}
