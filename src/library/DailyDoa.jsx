import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { dailyEntry } from "./model.js";
export default function DailyDoa({ onRead }) {
  const [entry, setEntry] = useState(dailyEntry);
  useEffect(() => {
    const timer = setInterval(() => setEntry(dailyEntry()), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="daily-doa" aria-labelledby="daily-doa-title">
      <div>
        <p className="eyebrow">DOA PILIHAN HARI INI</p>
        <h2 id="daily-doa-title">{entry.title_ms}</h2>
        <button onClick={() => onRead(entry.id)}>
          Baca & hayati
          <ArrowRight size={16} />
        </button>
        <small>Pilihan harian mengikut waktu Malaysia.</small>
      </div>
      <div>
        <p className="daily-arabic" lang="ar" dir="rtl">
          {entry.arabic_text}
        </p>
        <p className="daily-meaning">{entry.translation_ms}</p>
        <small>{entry.source_reference}</small>
      </div>
    </section>
  );
}
