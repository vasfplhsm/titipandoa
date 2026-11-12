import {
  BookOpen,
  CircleDot,
  Compass,
  ArrowRight,
  Calendar,
  ListTodo,
  Wallet,
  Info,
  Download,
  LockKeyhole,
  FileText,
} from "lucide-react";
import { OWNER_NAVIGATION, ownerSection } from "../components/navigation.js";

export function BottomNavigation({ active, navigate, hidden, isOwner }) {
  if (!isOwner) return null;
  const entries = OWNER_NAVIGATION;
  const selected = ownerSection(active);
  return (
    <nav
      hidden={hidden}
      className="bottom-navigation"
      style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}
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
export function FeatureHub({ kind, navigate, isOwner, openOwner, openGuide, onChangePin }) {
  const data =
    kind === "doahub"
      ? {
          title: "Titipan doa untuk anda",
          eyebrow: "AMANAH KELUARGA & SAHABAT",
          items: [
            [
              "dashboard",
              "Titipan Diterima",
              "Baca, tandakan dan urus doa yang dititipkan kepada anda.",
              BookOpen,
            ],
            [
              "focus",
              "Pembaca Doa",
              "Baca titipan satu demi satu dalam mod fokus.",
              BookOpen,
            ],
            [
              "submission",
              "Borang Titipan",
              "Buka borang untuk menambah titipan doa.",
              FileText,
            ],
          ],
        }
      : kind === "zikrhub"
        ? {
            title: "Doa & ibadah harian",
            eyebrow: "RUANG TENANG ANDA",
            items: [
              [
                "collection",
                "Koleksi Doa & Zikrullah",
                "54 bacaan dengan rujukan, kegemaran dan carian.",
                BookOpen,
              ],
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
                  "change-pin",
                  "Tukar PIN",
                  "Urus PIN untuk membuka ruang peribadi anda.",
                  LockKeyhole,
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
            onClick={() => {
              if (!isOwner) return openOwner();
              if (id === "change-pin") return onChangePin();
              if (["pagi", "petang", "solat"].includes(id)) return openGuide(id);
              navigate(id);
            }}
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
