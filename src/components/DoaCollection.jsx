export function About({navigate}) {
  return (
    <section className="editorial-page about-page">
      <header className="page-intro">
        <span className="eyebrow">SEBUAH RUANG, SEJUTA HARAPAN</span>
        <h1>Tentang Tumpang Doa</h1>
        <p>
          Mengiringi perjalanan ke Tanah Suci dengan doa dan ingatan yang baik.
        </p>
      </header>
      <div className="about-card">
        <h2>Doa menghubungkan kita.</h2>
        <p>
          Tumpang Doa ialah ruang untuk keluarga dan sahabat menitipkan doa
          kepada jemaah bagi dibaca dan diaminkan sepanjang perjalanan umrah.
          Setiap titipan ialah amanah peribadi, bukan hantaran awam.
        </p>
        <h2>Teman untuk beribadah</h2>
        <p>
          Koleksi doa al-Quran dan Tasbih Digital tersedia tanpa log masuk.
          Kemajuan tasbih disimpan pada pelayar anda sahaja. Kemajuan anda kekal
          peribadi.
        </p>
        <h2>Privasi yang dihormati</h2>
        <p>
          Titipan yang diterima hanya dipaparkan dalam ruang jemaah. Akses
          jemaah menggunakan akaun Supabase pemilik yang disahkan, manakala koleksi doa dan tasbih
          terbuka untuk semua.
        </p>
        <div className="workspace-actions"><button className="secondary" onClick={()=>navigate('collection')}>Doa & Zikir</button><button className="secondary" onClick={()=>navigate('tasbih')}>Tasbih Digital</button></div>
      </div>
    </section>
  );
}
