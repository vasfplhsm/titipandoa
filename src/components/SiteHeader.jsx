import {
  House,
  FileText,
  CircleDot,
  Info,
  BookOpen,
  Sun,
  Moon,
  LockKeyhole,
} from "lucide-react";

export function ArchMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 42 46"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 43V24C5 17 17 14 21 4C25 14 37 17 37 24V43M2 43H40M12 43V29C12 25 18 23 21 18C24 23 30 25 30 29V43M18 43V34Q21 29 24 34V43M8 18V8M34 18V8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M24 4A4 4 0 0 1 20 0A4 4 0 1 0 24 4Z" fill="currentColor" />
    </svg>
  );
}

export default function SiteHeader({
  activeTab,
  navigate,
  theme,
  toggleTheme,
  isOwner,
  openOwner,
  hidden,
}) {
  const links = [
    ...(isOwner ? [["home", "Utama", House]] : []),
    ["submission", "Titip Doa", FileText],
    ["collection", "Doa & Zikir", BookOpen],
    ["tasbih", "Tasbih Digital", CircleDot],
    ["about", "Tentang Kami", Info],
  ];
  return (
    <header className="site-header" hidden={hidden}>
      <button
        className="site-brand"
        onClick={() => navigate(isOwner ? "home" : "submission")}
        aria-label="Titipan Doa"
      >
        <ArchMark />
        <span>Titipan Doa</span>
      </button>
      <nav className="site-nav" aria-label="Navigasi utama">
        {links.map(([id, label, Icon]) => (
          <button
            key={id}
            aria-current={activeTab === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={16} strokeWidth={1.6} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="site-actions">
        <button
          className="site-theme"
          aria-label={
            theme === "dark" ? "Gunakan tema cerah" : "Gunakan tema gelap"
          }
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Moon size={21} /> : <Sun size={21} />}
        </button>
        <button
          className="site-account"
          aria-label={isOwner ? "Ruang Jemaah" : "Akses Jemaah"}
          onClick={openOwner}
        >
          <LockKeyhole size={15} />
          <span>{isOwner ? "Ruang Jemaah" : "Akses Jemaah"}</span>
        </button>
      </div>
    </header>
  );
}
