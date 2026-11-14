import { useState, useRef, useEffect } from "react";
import { ArrowRight, Check, LockKeyhole, Heart, Send } from "lucide-react";
import { CATEGORIES, ANNOUNCEMENT } from "./model";
import { INTRO_NOTE } from "../content/intro-note";
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
  formOpen = false,
  introNote = INTRO_NOTE,
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
  const heading = useRef(null);
  const [exampleCategory, setExampleCategory] = useState("Kesihatan");
  useEffect(() => {
    if (formOpen) heading.current?.focus({ preventScroll: true });
  }, [formOpen, submitted]);
  if (!formOpen)
    return (
      <div className="public-journey announcement-home">
        <header className="invitation-welcome">
          <span className="welcome-mark" aria-hidden="true">
            <Heart size={22} strokeWidth={1.25} />
          </span>
          <span className="kicker">SEUNTAI DOA, DIBAWA BERSAMA.</span>
          <h1>Assalamualaikum w.b.t.</h1>
          <p>Sebuah pesanan sebelum menuju Tanah Suci.</p>
        </header>
        <article
          className="original-announcement"
          aria-label="Pengumuman Umrah asal"
        >
          {introNote.map((paragraph, index) => (
            <p data-intro-paragraph={index + 1} key={index}>
              {paragraph}
            </p>
          ))}
        </article>
        {profile.announcement && profile.announcement !== ANNOUNCEMENT && (
          <aside className="additional-announcement">
            <span className="kicker">
              PESANAN TAMBAHAN
              {profile.display_name
                ? ` DARIPADA ${profile.display_name.toLocaleUpperCase()}`
                : ""}
            </span>
            <p>{profile.announcement}</p>
          </aside>
        )}
        <section
          className="prayer-invitation"
          aria-labelledby="prayer-invitation-title"
        >
          <span className="kicker">SATU DOA, SEBUAH HARAPAN</span>
          <h2 id="prayer-invitation-title">Ada doa nak dikirim?</h2>
          <p>Tinggalkan di sini, saya bacakan di Tanah Suci.</p>
          <button className="primary" onClick={() => navigate("submission")}>
            Tumpang Doa <ArrowRight size={18} />
          </button>
          <small className="reassurance">
            <LockKeyhole size={13} /> Tanpa akaun · Kiriman untuk bacaan
            peribadi jemaah
          </small>
        </section>
      </div>
    );
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
    <div className="public-journey submission-page">
      <header className="submission-page-heading">
        <button className="text-button" onClick={() => navigate("home")}>
          ← Kembali ke pengumuman
        </button>
        <span className="kicker">SEUNTAI DOA, DIBAWA BERSAMA.</span>
        <h1 ref={heading} tabIndex={-1}>
          Borang Tumpang Doa
        </h1>
        <p>Tuliskan doa anda dengan tenang. Tidak perlu mendaftar akaun.</p>
      </header>
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
