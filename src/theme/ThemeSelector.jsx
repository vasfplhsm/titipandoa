import { Check, Sun, Moon, Monitor } from "lucide-react";
import { THEMES } from "./model";
import { useTheme } from "./ThemeProvider";
export function ThemeSelector() {
  const {
    palette,
    appearance,
    setPalette,
    setAppearance,
    clearOverrides,
    hasOverrides,
    persistenceError,
  } = useTheme();
  return (
    <section className="theme-panel" aria-labelledby="theme-heading">
      <div className="theme-panel-heading">
        <span className="kicker">RUANG YANG SELESA UNTUK ANDA</span>
        <h2 id="theme-heading">Tema & Penampilan</h2>
        <p>
          Pilihan ini disimpan pada peranti anda. Tetapan tema awam hanya
          berubah apabila pemilik memilih untuk menerbitkannya.
        </p>
      </div>
      <div
        className="theme-selection-grid"
        role="group"
        aria-label="Pilihan warna tema"
      >
        {THEMES.map((theme) => (
          <article
            className="theme-choice"
            data-selected={palette === theme.id}
            key={theme.id}
            style={{
              "--preview-background": theme.light.background,
              "--preview-primary": theme.light.primary,
              "--preview-secondary": theme.light.secondary,
              "--preview-ink": theme.light.ink,
              "--preview-surface": theme.light.surface,
              "--preview-accent": theme.light.accent,
            }}
          >
            <div className="theme-miniature" aria-hidden="true">
              <div className="theme-mini-brand">
                <span /> Tumpang Doa
              </div>
              <div className="theme-mini-title">
                Seuntai doa,
                <br />
                <i>dibawa bersama.</i>
              </div>
              <div className="theme-mini-line" />
              <div className="theme-mini-card">
                <span />
                <span />
                <div />
              </div>
            </div>
            <div className="theme-choice-details">
              <div className="theme-choice-title">
                <h3>{theme.name}</h3>
                {palette === theme.id && (
                  <span className="theme-selected-label">
                    <Check size={14} />
                    Dipilih
                  </span>
                )}
              </div>
              <p>{theme.description}</p>
              <div
                className="theme-swatches"
                aria-label={`Warna ${theme.name}`}
              >
                {[
                  ["Utama", theme.light.primary],
                  ["Sekunder", theme.light.secondary],
                  ["Latar", theme.light.background],
                  ["Aksen", theme.light.accent],
                ].map(([name, color]) => (
                  <span
                    key={name}
                    style={{ backgroundColor: color }}
                    title={`${name}: ${color}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <button
                className={palette === theme.id ? "primary" : "secondary"}
                aria-pressed={palette === theme.id}
                onClick={() => setPalette(theme.id)}
              >
                Gunakan Tema<span className="sr-only"> {theme.name}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
      <fieldset className="appearance-selector">
        <legend>Penampilan</legend>
        <div>
          {[
            ["light", "Cerah", Sun],
            ["dark", "Gelap", Moon],
            ["system", "Ikut Peranti", Monitor],
          ].map(([value, label, Icon]) => (
            <label key={value} data-selected={appearance === value}>
              <input
                type="radio"
                name="theme-appearance"
                value={value}
                checked={appearance === value}
                onChange={() => setAppearance(value)}
              />
              <Icon size={17} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="theme-reset">
        <p>
          {hasOverrides
            ? "Anda menggunakan pilihan peranti sendiri."
            : "Mengikut tema awam pilihan jemaah."}
        </p>
        <button
          className="text-button"
          onClick={clearOverrides}
          disabled={!hasOverrides}
        >
          Ikut Tema Awam
        </button>
      </div>
      {persistenceError && (
        <p className="form-message" role="alert">
          Tema digunakan, tetapi pilihan belum dapat disimpan. Jangan tutup
          halaman jika simpanan peranti masih diperlukan.
        </p>
      )}
    </section>
  );
}
export default ThemeSelector;
