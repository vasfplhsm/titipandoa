import DailyDoa from "../library/DailyDoa";
import {
  ArrowRight,
  Send,
  BookOpen,
  CircleDot,
  Heart,
  UserRound,
  LockKeyhole,
} from "lucide-react";

function FeatureCard({ icon: Icon, title, children, onClick }) {
  return (
    <button className="feature-card" onClick={onClick}>
      <span className="feature-icon">
        <Icon size={28} strokeWidth={1.4} />
      </span>
      <span className="feature-copy">
        <strong>{title}</strong>
        <span>{children}</span>
      </span>
      <span className="feature-arrow">
        <ArrowRight size={16} />
      </span>
    </button>
  );
}
function relativeTime(date) {
  const delta = Date.now() - Date.parse(date);
  if (!Number.isFinite(delta)) return "Tarikh tidak tersedia";
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 60)
    return minutes < 1 ? "Baru sahaja" : `${minutes} minit yang lalu`;
  const hours = Math.floor(minutes / 60);
  return hours < 24
    ? `${hours} jam yang lalu`
    : `${Math.floor(hours / 24)} hari yang lalu`;
}
export function DoaCard({ doa, onAmin }) {
  return (
    <article className="community-card">
      <div className="community-meta">
        <span className="avatar">
          <UserRound size={15} />
        </span>
        <time dateTime={doa.created_at}>{relativeTime(doa.created_at)}</time>
        <span className="card-ornament" aria-hidden="true">
          ✧
        </span>
      </div>
      <h3>{doa.category || "Titipan doa"}</h3>
      <p>{doa.message}</p>
      <div className="community-card-bottom">
        <span>{doa.sender_name || "Tanpa nama"}</span>
        <button
          aria-label={`Amin untuk ${doa.sender_name || "titipan ini"}`}
          onClick={() => onAmin(doa.id)}
        >
          <Heart size={17} />
          <span>{doa.amin_count || 0}</span>
        </button>
      </div>
    </article>
  );
}
export default function Home({
  navigate,
  onReadEntry,
  doas,
  isOwner,
  loading,
  onAmin,
}) {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="hero-title">
        <span className="edge-ornament edge-left" aria-hidden="true" />
        <span className="edge-ornament edge-right" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">SELAMAT DATANG KE TITIPAN DOA</p>
          <h1 id="hero-title">
            Setiap doa,
            <br />
            <span>sebuah harapan.</span>
          </h1>
          <span className="gold-rule" />
          <p className="hero-description">
            Ruang untuk menitipkan doa, membaca doa orang lain, dan saling
            menguatkan dalam kebaikan.
          </p>
          <div className="hero-actions">
            <button
              className="button-primary"
              onClick={() => navigate("submission")}
            >
              <Send size={19} />
              Titipkan Doa
              <ArrowRight size={19} />
            </button>
            <button
              className="button-outline"
              onClick={() => navigate("collection")}
            >
              <BookOpen size={21} />
              Baca Doa
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-arch">
            <div className="hero-arch-inner">
              <img
                src={`${import.meta.env.BASE_URL}images/mosque-sunset.svg`}
                alt="Ilustrasi masjid dengan kubah dan menara dalam cahaya senja keemasan"
                width="600"
                height="780"
                fetchPriority="high"
              />
              <blockquote>
                <p lang="ar" dir="rtl">
                  وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ
                </p>
                <span>
                  “Dan Tuhan kamu berfirman: Berdoalah kepada-Ku, nescaya Aku
                  perkenankan doa kamu.”
                </span>
                <cite>Surah Ghafir, 40:60</cite>
              </blockquote>
            </div>
          </div>
          <span className="arch-caption">
            MENYULAM HARAPAN, MENITIPKAN KEBAIKAN
          </span>
        </div>
      </section>
      <section className="feature-grid" aria-label="Teman perjalanan rohani">
        <FeatureCard
          icon={Send}
          title="Titipkan Doa"
          onClick={() => navigate("submission")}
        >
          Kongsikan doa anda untuk diri sendiri, keluarga, atau sesiapa yang
          memerlukan.
        </FeatureCard>
        <FeatureCard
          icon={BookOpen}
          title="Koleksi Doa & Zikrullah"
          onClick={() => navigate("collection")}
        >
          Terokai himpunan doa dan zikir daripada al-Quran dan sunnah.
        </FeatureCard>
        <FeatureCard
          icon={CircleDot}
          title="Tasbih Digital"
          onClick={() => navigate("tasbih")}
        >
          Zikir dengan lebih mudah di mana sahaja, bila-bila masa.
        </FeatureCard>
      </section>
      <section className="community-section" aria-labelledby="community-title">
        <div className="community-heading">
          <div>
            <p className="eyebrow">DOA TERKINI DARIPADA KOMUNITI</p>
            <h2 id="community-title">Kita saling mendoakan</h2>
            <span className="gold-rule" />
          </div>
          <button
            onClick={() => navigate(isOwner ? "dashboard" : "collection")}
          >
            {isOwner ? "Lihat semua titipan" : "Baca koleksi doa"}
            <ArrowRight size={17} />
          </button>
        </div>
        {isOwner ? (
          loading ? (
            <p className="community-empty" role="status">
              Memuatkan titipan doa…
            </p>
          ) : doas.length ? (
            <div className="community-grid">
              {doas.slice(0, 4).map((doa) => (
                <DoaCard key={doa.id} doa={doa} onAmin={onAmin} />
              ))}
            </div>
          ) : (
            <div className="community-empty">
              <BookOpen />
              <h3>Setiap doa bermula dengan sebuah harapan.</h3>
              <p>
                Belum ada titipan untuk dipaparkan. Titipan baharu akan muncul
                di sini.
              </p>
              <button
                className="button-cream"
                onClick={() => navigate("submission")}
              >
                Titipkan doa pertama
                <ArrowRight size={17} />
              </button>
            </div>
          )
        ) : (
          <div className="community-private">
            <span className="privacy-seal">
              <LockKeyhole size={25} strokeWidth={1.3} />
            </span>
            <div>
              <h3>Doa yang dititipkan, amanah yang dijaga.</h3>
              <p>
                Titipan peribadi hanya dipaparkan dalam ruang jemaah. Sementara
                itu, hayati doa-doa daripada al-Quran dan iringi orang tersayang
                dengan kebaikan.
              </p>
            </div>
            <button
              className="button-cream"
              onClick={() => navigate("collection")}
            >
              Terokai koleksi
              <BookOpen size={18} />
            </button>
          </div>
        )}
      </section>
      <DailyDoa onRead={onReadEntry} />
      <section className="home-closing">
        <span aria-hidden="true">✧</span>
        <p>Semoga setiap doa mendekatkan hati kepada-Nya.</p>
        <span aria-hidden="true">✧</span>
      </section>
    </div>
  );
}
