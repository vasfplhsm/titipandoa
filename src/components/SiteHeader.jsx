import { Sun, Moon } from "lucide-react";
export function ArchMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 41V22C8 14 16 9 22 5c6 4 14 9 14 17v19H8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M15 25c0-5 7-5 7 0 0-5 7-5 7 0 0 4-7 8-7 8s-7-4-7-8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="m29 35 7 6v-8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
export default function SiteHeader({
  navigate,
  theme,
  toggleTheme,
  hidden,
}) {
  return (
    <header className="site-header" hidden={hidden}>
      <button
        className="site-brand"
        onClick={() => navigate("home")}
        aria-label="Utama — Tumpang Doa"
      >
        <ArchMark />
        <span>Tumpang Doa</span>
      </button>
      <div className="site-actions">
        <button className="text-button" onClick={() => navigate("about")}>
          Tentang
        </button>
        <button
          className="site-theme"
          aria-label={
            theme === "dark" ? "Gunakan tema cerah" : "Gunakan tema gelap"
          }
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

      </div>
    </header>
  );
}
