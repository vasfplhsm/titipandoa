import {
  House,
  BookOpen,
  CircleDot,
  Compass,
  Ellipsis,
  ArrowRight,
  Calendar,
  ListTodo,
  Wallet,
  Info,
  Download,
} from "lucide-react";
export function BottomNavigation({ active, navigate, hidden }) {
  const entries = [
    ["home", "Utama", House],
    ["doahub", "Doa", BookOpen],
    ["zikrhub", "Zikir", CircleDot],
    ["umrahhub", "Umrah", Compass],
    ["more", "Lain-lain", Ellipsis],
  ];
  const selected = ["submission", "collection", "doahub"].includes(active)
    ? "doahub"
    : ["tasbih", "zikrhub"].includes(active)
      ? "zikrhub"
      : ["checklist", "itinerary", "timeline", "umrahhub"].includes(active)
        ? "umrahhub"
        : [
              "expenses",
              "offline",
              "more",
              "about",
              "dashboard",
              "focus",
            ].includes(active)
          ? "more"
          : "home";
  return (
    <nav
      hidden={hidden}
      className="bottom-navigation"
      aria-label="Navigasi aplikasi"
    >
      {entries.map(([id, title, Icon]) => (
        <button
          aria-label={`Tab ${title}`}
          aria-current={selected === id ? "page" : undefined}
          key={id}
          onClick={() => navigate(id)}
        >
          <Icon size={21} strokeWidth={1.6} />
          <span>{title}</span>
        </button>
      ))}
    </nav>
  );
}
export function FeatureHub({ kind, navigate, isOwner, openOwner, openGuide }) {
  const data =
    kind === "doahub"
      ? {
          title: "Doa untuk setiap langkah",
          eyebrow: "RUANG PENGHARAPAN",
          items: [
            [
              "submission",
              "Titip Doa",
              "Titipkan pesanan kepada jemaah.",
              BookOpen,
            ],
            [
              "collection",
              "Koleksi Doa & Zikrullah",
              "54 bacaan dengan rujukan, kegemaran dan carian.",
              BookOpen,
            ],
          ],
        }
      : kind === "zikrhub"
        ? {
            title: "Tenang bersama zikir",
            eyebrow: "PERLAHAN DI JARI, DEKAT DI HATI",
            items: [
              [
                "tasbih",
                "Tasbih Digital",
                "Kiraan anda disimpan secara automatik.",
                CircleDot,
              ],
              ["pagi", "Zikir Pagi", "Sambung bacaan berpandu anda.", BookOpen],
              [
                "petang",
                "Zikir Petang",
                "Bacaan yang menemani penghujung hari.",
                BookOpen,
              ],
              [
                "solat",
                "Zikir Selepas Solat",
                "Panduan dengan bilangan bersumber.",
                BookOpen,
              ],
            ],
          }
        : kind === "umrahhub"
          ? {
              title: "Perjalanan Umrah",
              eyebrow: "SEDIAKAN LANGKAH ANDA",
              items: [
                [
                  "itinerary",
                  "Jadual Umrah",
                  "Atur cara dan penerbangan.",
                  Calendar,
                ],
                [
                  "checklist",
                  "Senarai Semak Umrah",
                  "Keperluan perjalanan anda.",
                  ListTodo,
                ],
                [
                  "timeline",
                  "Garis Masa",
                  "Lihat perjalanan secara tersusun.",
                  Compass,
                ],
                [
                  "offline",
                  "Sediakan luar talian",
                  "Muat turun jadual dan senarai semak.",
                  Download,
                ],
              ],
            }
          : {
              title: "Ruang peribadi anda",
              eyebrow: "TETAPAN & KEMUDAHAN",
              items: [
                [
                  "offline",
                  "Luar Talian & Pemasangan",
                  "Simpanan, penyegerakan dan panduan iPhone.",
                  Download,
                ],
                [
                  "expenses",
                  "Perbelanjaan",
                  "Bajet, dompet dan perbelanjaan perjalanan.",
                  Wallet,
                ],
                [
                  "dashboard",
                  "Ruang Jemaah",
                  "Urus titipan doa yang diterima.",
                  BookOpen,
                ],
                [
                  "focus",
                  "Pembaca Doa",
                  "Bacaan titipan dalam mod fokus.",
                  BookOpen,
                ],
                ["about", "Tentang Kami", "Kenali Titipan Doa.", Info],
              ],
            };
  return (
    <section className="mobile-panel feature-hub">
      <header className="page-intro">
        <span className="eyebrow">{data.eyebrow}</span>
        <h1>{data.title}</h1>
      </header>
      <div className="hub-grid">
        {data.items.map(([id, title, description, Icon]) => (
          <button
            aria-label={title}
            key={id}
            onClick={() =>
              ["pagi", "petang", "solat"].includes(id)
                ? openGuide(id)
                : [
                      "itinerary",
                      "checklist",
                      "timeline",
                      "expenses",
                      "dashboard",
                      "focus",
                    ].includes(id) && !isOwner
                  ? openOwner()
                  : navigate(id)
            }
          >
            <span className="hub-icon">
              <Icon size={24} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ArrowRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
}
