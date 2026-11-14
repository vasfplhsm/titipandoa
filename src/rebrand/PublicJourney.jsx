import { useState, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  LockKeyhole,
  Heart,
  Send,
} from "lucide-react";
import { CATEGORIES } from "./model";
const EXAMPLES = {
  Kesihatan:
    "Ya Allah, kurniakanlah kesembuhan dan kesihatan yang baik buat ibu bapa saya.",
  Rezeki:
    "Ya Allah, lapangkanlah rezeki kami dengan rezeki yang halal dan berkat.",
  Keluarga:
    "Ya Allah, peliharalah keluarga kami dalam kasih sayang dan lindungan-Mu.",
  Jodoh: "Ya Allah, permudahkanlah urusan jodoh saya pada waktu yang terbaik.",
  Zuriat: "Ya Allah, kurniakanlah kami zuriat yang soleh dan solehah.",
  Keampunan: "Ya Allah, ampunkanlah dosa kami dan kedua-dua ibu bapa kami.",
  "Lain-lain":
    "Ya Allah, tenangkanlah hati saya dan permudahkanlah urusan saya.",
};
export default function PublicJourney({
  profile,
  senderName,
  setSenderName,
  category,
  setCategory,
  message,
  setMessage,
  onSubmit,
  submitted,
  onReset,
  navigate,
  busy,
  pending,
  error,
}) {
  const form = useRef(null);
  const [exampleCategory, setExampleCategory] = useState("Kesihatan");
  function start() {
    form.current?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    form.current?.querySelector("textarea")?.focus({ preventScroll: true });
  }
  if (submitted)
    return (
      <section className="journey-success" aria-live="polite">
        <span className="success-seal">
          <Check size={32} />
        </span>
        <span className="kicker">SATU DOA, SEBUAH HARAPAN</span>
        <h1>Alhamdulillah, doa anda telah diterima.</h1>
        <p>
          Terima kasih kerana berkongsi doa. Insya-Allah saya akan cuba bacakan
          di Tanah Suci.
        </p>
        <button className="primary" onClick={onReset}>
          Hantar Doa Lain <ArrowRight size={18} />
        </button>
        <button
          className="text-button"
          onClick={() => {
            onReset();
            navigate("home");
          }}
        >
          Kembali ke Laman Utama
        </button>
      </section>
    );
  return (
    <div className="public-journey">
      <section className="invitation-hero">
        <div className="hero-copy">
          <span className="kicker">
            <span /> SEBUAH PERJALANAN, DOA BERSAMA
          </span>
          <h1>
            Ada doa
            <br />
            nak <em>dikirim?</em>
          </h1>
          <p className="hero-caption">{profile.welcome_message}</p>
          <p className="hero-description">
            Insya-Allah saya akan menunaikan umrah tidak lama lagi. Kalau ada
            doa atau hajat yang ingin dititipkan, bolehlah tinggalkan di sini.
            Insya-Allah saya cuba bacakan satu persatu di Tanah Suci.
          </p>
          <div className="hero-buttons">
            <button className="primary" onClick={start}>
              Tumpang Doa <ArrowUpRight size={19} />
            </button>
            <a
              href="#perjalanan"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("perjalanan")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Tentang Perjalanan Ini <ArrowRight size={16} />
            </a>
          </div>
          <small className="reassurance">
            <LockKeyhole size={13} /> Tanpa akaun · Doa anda untuk bacaan
            peribadi jemaah
          </small>
        </div>
        <aside className="prayer-note" aria-label="Pesanan perjalanan">
          <div className="note-arch">
            <Heart size={27} strokeWidth={1.2} />
            <span>
              JAUH DI MATA,
              <br />
              DEKAT DALAM DOA.
            </span>
            <p>
              “Walaupun kita tidak berada di tempat yang sama, doa tetap boleh
              dibawa bersama.”
            </p>
            <i>Dengan ingatan yang baik.</i>
            <div className="note-line" />
          </div>
        </aside>
      </section>
      <section id="perjalanan" className="personal-note">
        <span className="note-avatar">
          <Heart size={21} />
        </span>
        <div>
          <span className="kicker">
            PESANAN{" "}
            {profile.display_name
              ? `DARIPADA ${profile.display_name.toLocaleUpperCase()}`
              : "BUAT YANG DIINGATI"}
          </span>
          <p>{profile.announcement}</p>
          {profile.departure_date && (
            <small>
              Berangkat:{" "}
              {new Date(
                profile.departure_date + "T12:00:00",
              ).toLocaleDateString("ms-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {profile.return_date &&
                ` · Pulang: ${new Date(profile.return_date + "T12:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}`}
            </small>
          )}
        </div>
      </section>
      <section className="submission-layout" ref={form} id="tumpang-doa">
        <div className="submission-intro">
          <span className="kicker">RUANG UNTUK HARAPAN ANDA</span>
          <h2>
            Yang tersimpan di hati,
            <br />
            <em>titipkan di sini.</em>
          </h2>
          <p>
            Doa yang ringkas pun bermakna. Tulislah dengan kata-kata anda
            sendiri.
          </p>
          <div className="privacy-note">
            <LockKeyhole size={18} />
            <p>
              Doa anda tidak dipaparkan kepada pengunjung lain. Hanya jemaah
              yang menguruskannya boleh membacanya.
            </p>
          </div>
          <details className="prayer-examples">
            <summary>Tak pasti nak tulis apa?</summary>
            <label htmlFor="example-category">Contoh mengikut kategori</label>
            <select
              id="example-category"
              value={exampleCategory}
              onChange={(e) => setExampleCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <p>{EXAMPLES[exampleCategory]}</p>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                if (
                  message.trim() &&
                  !window.confirm("Gantikan draf anda dengan contoh ini?")
                )
                  return;
                setCategory(exampleCategory);
                setMessage(EXAMPLES[exampleCategory]);
              }}
            >
              Gunakan sebagai draf
            </button>
            <small>
              Contoh susunan kata, bukan petikan al-Quran atau hadis. Boleh
              diubah.
            </small>
          </details>
        </div>
        <form
          className="prayer-form"
          onSubmit={onSubmit}
          aria-label="Tumpang Doa"
        >
          <label htmlFor="sender-name">
            Nama <span>(pilihan)</span>
          </label>
          <input
            id="sender-name"
            autoComplete="name"
            maxLength={200}
            placeholder="Nama anda (pilihan)"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={busy || pending}
          />
          <fieldset disabled={busy || pending}>
            <legend>
              Kategori Doa <span>(pilihan)</span>
            </legend>
            <div className="category-chips">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  aria-pressed={category === c}
                  key={c}
                  onClick={() => setCategory(category === c ? "" : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor="prayer-message">
            Doa / Hajat <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="prayer-message"
            required
            maxLength={10000}
            rows={6}
            placeholder="Tuliskan doa atau hajat yang ingin saya bacakan..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={busy || pending}
            aria-describedby="prayer-help"
          />
          <small id="prayer-help">
            {message.length.toLocaleString("ms-MY")} / 10,000 aksara · Tidak
            perlu berkongsi maklumat sensitif.
          </small>
          {!profile.accepting_submissions && (
            <p role="status">
              Kiriman doa baharu sedang ditutup. Terima kasih atas ingatan anda.
            </p>
          )}
          {error && (
            <p role="alert" className="form-message">
              {error}
            </p>
          )}
          {pending && (
            <div className="pending-message" role="status">
              <strong>Doa disimpan, menunggu pengesahan.</strong>
              <p>
                Belum diterima oleh server. Pesanan akan dicuba semula apabila
                sambungan kembali. Jangan hantar salinan baharu.
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => navigate("offline")}
              >
                Semak status kiriman <ArrowRight size={15} />
              </button>
            </div>
          )}
          <button
            className="primary submit-prayer"
            type="submit"
            disabled={busy || pending || !profile.accepting_submissions}
          >
            {busy
              ? "Sedang menghantar…"
              : pending
                ? "Menunggu penyegerakan"
                : "Hantar Doa"}{" "}
            <Send size={17} />
          </button>
          <small className="form-footnote">
            Dengan penuh amanah, insya-Allah.
          </small>
        </form>
      </section>
      <section className="journey-faq">
        <span className="kicker">SEDIKIT PENJELASAN</span>
        <h2>Doa yang dekat, walau berjauhan.</h2>
        <details>
          <summary>Perlu daftar akaun?</summary>
          <p>
            Tidak perlu. Anda boleh kirim doa tanpa nama dan tanpa memasang
            aplikasi.
          </p>
        </details>
        <details>
          <summary>Siapa yang boleh baca doa saya?</summary>
          <p>
            Kiriman ditujukan untuk bacaan peribadi jemaah. Ia bukan paparan doa
            umum.
          </p>
        </details>
        <details>
          <summary>Adakah setiap doa akan dibacakan?</summary>
          <p>
            Insya-Allah saya cuba bacakan satu persatu mengikut kelapangan.
            Penerimaan doa adalah urusan Allah.
          </p>
        </details>
      </section>
    </div>
  );
}
