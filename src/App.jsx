import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Send, 
  Share2, 
  QrCode, 
  CheckCircle, 
  Sparkles, 
  Copy, 
  Eye, 
  BookOpen, 
  Moon, 
  Sun, 
  Flame, 
  Filter, 
  Bookmark, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Cloud, 
  HelpCircle, 
  Check, 
  RotateCcw,
  Trash2,
  Lock,
  Plus,
  Flower2,
  Crown,
  CheckSquare,
  Square,
  Calendar,
  Plane,
  Clock,
  MapPin,
  ListTodo,
  Edit3,
  X,
  Compass,
  ArrowRight,
  FileText
} from 'lucide-react';

const INITIAL_DOAS = [
  {
    id: 'doa-1',
    sender_name: 'Ahmad & Family',
    category: 'Kesihatan',
    message: 'Semoga diberikan kesihatan yang berpanjangan, kesempurnaan tubuh badan dan kemudahan sepanjang menunaikan ibadah Umrah di Tanah Suci. Amin.',
    is_read: true,
    is_bookmarked: true,
    amin_count: 14,
    created_at: '2026-09-24T08:30:00Z'
  },
  {
    id: 'doa-2',
    sender_name: 'Siti Nurhaliza',
    category: 'Rezeki',
    message: 'Moga dipermudahkan segala urusan rezeki halal yang berkat, dikurniakan keberkatan umur dan dikurniakan rezeki dapat kembali lagi ke Baitullah.',
    is_read: false,
    is_bookmarked: true,
    amin_count: 8,
    created_at: '2026-09-25T11:15:00Z'
  },
  {
    id: 'doa-3',
    sender_name: 'Ustaz Ridzuan',
    category: 'Ampunan',
    message: 'Semoga dikurniakan keampunan yang hakiki (Taubat Nasuha), diampunkan dosa-dosa lalu dan dikurniakan tempat di Syurga-Nya kelak.',
    is_read: false,
    is_bookmarked: false,
    amin_count: 22,
    created_at: '2026-09-25T14:45:00Z'
  },
  {
    id: 'doa-4',
    sender_name: 'Farah & Cousins',
    category: 'Zuriat',
    message: 'Mohon doakan kami dari depan Kaabah agar dikurniakan zuriat yang soleh dan solehah yang menyejukkan mata memandang.',
    is_read: true,
    is_bookmarked: false,
    amin_count: 5,
    created_at: '2026-09-26T09:00:00Z'
  },
  {
    id: 'doa-5',
    sender_name: 'Mak Long Khadijah',
    category: 'Umum',
    message: 'Selamat jalan buat Syahidah. Moga selamat pergi dan balik, mendapat Umrah yang mabrurah dan sentiasa dalam pelindungan Allah SWT.',
    is_read: false,
    is_bookmarked: false,
    amin_count: 31,
    created_at: '2026-09-26T15:20:00Z'
  }
];

const INITIAL_CHECKLIST = [
  { id: 'c-1', category: 'Dokumen & Kewangan', text: 'Pasport Antarabangsa (sahlilaku 6 bulan+)', completed: true },
  { id: 'c-2', category: 'Dokumen & Kewangan', text: 'Buku Suntikan Meningitis & Kad Vaksin', completed: true },
  { id: 'c-3', category: 'Dokumen & Kewangan', text: 'Duit Saudi Riyal (SAR) & Kad Debit Aktif Overseas', completed: false },
  { id: 'c-4', category: 'Ibadah & Kelengkapan Ihram', text: 'Baju Kurung / Abaya Longgar & Tudung Labuh (3-4 pasang)', completed: true },
  { id: 'c-5', category: 'Ibadah & Kelengkapan Ihram', text: 'Stok Stoking Tebal & Kasut Tawaf Mesra Masjid', completed: true },
  { id: 'c-6', category: 'Ibadah & Kelengkapan Ihram', text: 'Buku Doa Pocket & Unscented Toiletries (Sabun Tanpa Wangian)', completed: false },
  { id: 'c-7', category: 'Ubat-ubatan & Kesihatan', text: 'Panadol, Ubat Batuk, Lozenge Tekak & Multivitamin', completed: true },
  { id: 'c-8', category: 'Ubat-ubatan & Kesihatan', text: 'Vaseline / Pelembap Bibir & Sunscreen Unscented', completed: false },
  { id: 'c-9', category: 'Pakaian & Keperluan Harian', text: 'Universal Travel Adapter & Powerbank 20,000mAh', completed: true },
  { id: 'c-10', category: 'Pakaian & Keperluan Harian', text: 'Botol Spray Semburan Wuduk Pocket', completed: false }
];

const INITIAL_FLIGHTS = {
  departure: {
    airline: 'Malaysia Airlines (MH8024)',
    flightNo: 'MH8024',
    fromCode: 'KUL (KLIA)',
    toCode: 'JED (Jeddah)',
    date: '2026-10-10',
    depTime: '14:30',
    arrTime: '18:45',
    gate: 'C12',
    notes: 'Kumpul di KLIA Kaunter H 4 jam sebelum berlepas.'
  },
  return: {
    airline: 'Malaysia Airlines (MH8025)',
    flightNo: 'MH8025',
    fromCode: 'MED (Madinah)',
    toCode: 'KUL (KLIA)',
    date: '2026-10-22',
    depTime: '21:15',
    arrTime: '10:30',
    gate: 'G04',
    notes: 'Timbang beg di hotel Madinah jam 12:00 tengah hari.'
  }
};

const INITIAL_ITINERARY = [
  {
    id: 'it-1',
    date: '2026-10-10',
    time: '14:30',
    location: 'KLIA (KUL)',
    activity: 'Penerbangan ke Jeddah & Niat Ihram di Miqat Qarnul Manazil (dalam pesawat)',
    category: 'Perjalanan'
  },
  {
    id: 'it-2',
    date: '2026-10-10',
    time: '21:30',
    location: 'Makkah Al-Mukarramah',
    activity: 'Check-in Hotel Makkah & Menunaikan Umrah Pertama (Tawaf, Sa\'i & Tahallul)',
    category: 'Ibadah'
  },
  {
    id: 'it-3',
    date: '2026-10-12',
    time: '08:00',
    location: 'Ziarah Makkah',
    activity: 'Ziarah Luar Makkah (Jabal Thawr, Padang Arafah, Jabal Rahmah, Mina & Ja\'ranah)',
    category: 'Ziarah'
  },
  {
    id: 'it-4',
    date: '2026-10-16',
    time: '10:00',
    location: 'Perjalanan ke Madinah',
    activity: 'Tawaf Wada\' di Makkah & Naik Bas Ekspres ke Madinah Al-Munawwarah',
    category: 'Perjalanan'
  },
  {
    id: 'it-5',
    date: '2026-10-18',
    time: '14:00',
    location: 'Masjid Nabawi',
    activity: 'Ziarah Raudah (Raudhah) Wanita & Salam Rasulullah SAW',
    category: 'Ibadah'
  }
];

const PRESET_INSPIRATIONS = [
  "Dikurniakan kesihatan yang sihat walafiat sepanjang berada di Tanah Suci Makkah dan Madinah.",
  "Dipermudahkan urusan ibadah, tawaf, sa'i dan diberikan keampunan atas segala dosa lalu.",
  "Mohon titipkan doa agar keluargaku sentiasa berada di dalam rahmat & perlindungan Allah.",
  "Dikurniakan rezeki yang melimpah ruah dan kebahagiaan rumah tangga hingga ke jannah."
];

export default function App() {
  const [activeTab, setActiveTab] = useState('submission'); // 'submission', 'dashboard', 'checklist', 'itinerary', 'timeline', 'focus', 'tech_guide'
  const [doas, setDoas] = useState(INITIAL_DOAS);
  const [pilgrimName, setPilgrimName] = useState('Syahidah Zulkafli');
  const [pilgrimSlug, setPilgrimSlug] = useState('syahidahzulkafli');
  
  // Submission Form State
  const [senderName, setSenderName] = useState('');
  const [category, setCategory] = useState('Kesihatan');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Focus Reader State
  const [focusIndex, setFocusIndex] = useState(0);
  const [readerTheme, setReaderTheme] = useState('soft_rose');

  // Checklist State
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistCat, setNewChecklistCat] = useState('Dokumen & Kewangan');
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  // Flight & Itinerary State
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [isEditingFlights, setIsEditingFlights] = useState(false);
  const [itinerary, setItinerary] = useState(INITIAL_ITINERARY);
  
  // New Itinerary Form State
  const [itDate, setItDate] = useState('2026-10-11');
  const [itTime, setItTime] = useState('09:00');
  const [itLocation, setItLocation] = useState('Makkah');
  const [itActivity, setItActivity] = useState('');
  const [itCategory, setItCategory] = useState('Ibadah');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDoaSubmit = (e) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) {
      showToast('Sila isi nama dan pesanan doa anda.');
      return;
    }

    const newDoa = {
      id: `doa-${Date.now()}`,
      sender_name: senderName.trim(),
      category: category,
      message: message.trim(),
      is_read: false,
      is_bookmarked: false,
      amin_count: 0,
      created_at: new Date().toISOString()
    };

    setDoas([newDoa, ...doas]);
    setIsSubmitted(true);
    showToast('Titipan doa anda berjaya dihantar! Jazakallah Khair. 🌸');
  };

  const handleResetForm = () => {
    setSenderName('');
    setMessage('');
    setCategory('Kesihatan');
    setIsSubmitted(false);
  };

  const toggleReadStatus = (id) => {
    setDoas(doas.map(d => d.id === id ? { ...d, is_read: !d.is_read } : d));
  };

  const toggleBookmark = (id) => {
    setDoas(doas.map(d => d.id === id ? { ...d, is_bookmarked: !d.is_bookmarked } : d));
  };

  const incrementAmin = (id) => {
    setDoas(doas.map(d => d.id === id ? { ...d, amin_count: d.amin_count + 1 } : d));
    showToast('Satu ucapan Amin telah dititipkan dengan penuh kasih! 🤲💖');
  };

  const handleDeleteDoa = (id) => {
    setDoas(doas.filter(d => d.id !== id));
    showToast('Doa telah dipadam.');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://titipandoa.app/p/${pilgrimSlug}`);
    setCopiedLink(true);
    showToast('Pautan peribadi Titipan Doa berjaya disalin!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleChecklist = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: `c-${Date.now()}`,
      category: newChecklistCat,
      text: newChecklistItem.trim(),
      completed: false
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
    showToast('Item baru ditambah ke senarai semak!');
  };

  const startEditChecklist = (item) => {
    setEditingChecklistId(item.id);
    setEditingChecklistText(item.text);
  };

  const saveEditChecklist = (id) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, text: editingChecklistText } : item));
    setEditingChecklistId(null);
    showToast('Perkara disemak dikemas kini!');
  };

  const deleteChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
    showToast('Item dipadam dari senarai.');
  };

  const handleAddItinerary = (e) => {
    e.preventDefault();
    if (!itActivity.trim()) return;
    const newEntry = {
      id: `it-${Date.now()}`,
      date: itDate,
      time: itTime,
      location: itLocation,
      activity: itActivity.trim(),
      category: itCategory
    };
    setItinerary([...itinerary, newEntry].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)));
    setItActivity('');
    showToast('Atur cara baru berjaya ditambah!');
  };

  const handleDeleteItinerary = (id) => {
    setItinerary(itinerary.filter(it => it.id !== id));
    showToast('Atur cara dipadam.');
  };

  const stats = useMemo(() => {
    const total = doas.length;
    const read = doas.filter(d => d.is_read).length;
    const unread = total - read;
    const bookmarked = doas.filter(d => d.is_bookmarked).length;
    const totalAmins = doas.reduce((acc, d) => acc + d.amin_count, 0);

    const checklistTotal = checklist.length;
    const checklistDone = checklist.filter(c => c.completed).length;
    const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

    return { total, read, unread, bookmarked, totalAmins, checklistTotal, checklistDone, checklistPercent };
  }, [doas, checklist]);

  const filteredDoas = useMemo(() => {
    return doas.filter(doa => {
      const matchesSearch = doa.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doa.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || doa.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' ? true :
                            statusFilter === 'Read' ? doa.is_read :
                            statusFilter === 'Unread' ? !doa.is_read :
                            statusFilter === 'Starred' ? doa.is_bookmarked : true;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [doas, searchQuery, categoryFilter, statusFilter]);

  const timelineEvents = useMemo(() => {
    const events = [];

    if (flights.departure.date) {
      events.push({
        id: 'flight-dep',
        dateTime: `${flights.departure.date}T${flights.departure.depTime || '00:00'}`,
        title: `Penerbangan Pergi (${flights.departure.airline})`,
        location: `${flights.departure.fromCode} ➔ ${flights.departure.toCode}`,
        details: flights.departure.notes || 'Penerbangan berlepas ke Tanah Suci.',
        type: 'Flight',
        badgeColor: 'bg-rose-500 text-white'
      });
    }

    if (flights.return.date) {
      events.push({
        id: 'flight-ret',
        dateTime: `${flights.return.date}T${flights.return.depTime || '00:00'}`,
        title: `Penerbangan Pulang (${flights.return.airline})`,
        location: `${flights.return.fromCode} ➔ ${flights.return.toCode}`,
        details: flights.return.notes || 'Penerbangan pulang ke Tanah Air.',
        type: 'Flight',
        badgeColor: 'bg-rose-800 text-white'
      });
    }

    itinerary.forEach(it => {
      events.push({
        id: it.id,
        dateTime: `${it.date}T${it.time || '00:00'}`,
        title: it.activity,
        location: it.location,
        details: `Kategori: ${it.category}`,
        type: it.category,
        badgeColor: it.category === 'Ibadah' ? 'bg-pink-600 text-white' : 
                    it.category === 'Ziarah' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white'
      });
    });

    return events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }, [flights, itinerary]);

  return (
    <div className="min-h-screen bg-rose-50/40 text-slate-800 font-sans flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-rose-950 text-pink-100 px-5 py-3 rounded-2xl shadow-2xl border border-pink-700/50 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('submission')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-200">
              <Flower2 className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Titipan Doa
                </span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
                  Syahidah Zulkafli
                </span>
              </div>
              <p className="text-[10px] text-pink-500 font-medium hidden md:block">
                Titipkan doa, iringi perjalanan ke Tanah Suci.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-pink-50/60 p-1.5 rounded-2xl border border-pink-100 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('submission')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'submission' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Borang Titipan (/p/{pilgrimSlug})
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'dashboard' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Koleksi Doa
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'checklist' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" /> Checklist
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'itinerary' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Penerbangan & Itinerary
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Timeline View
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'focus' ? 'bg-white text-pink-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus Reader
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('focus')}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold px-3 py-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 transition shadow-md shadow-pink-200"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Makkah Reader</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex border-t border-pink-100 bg-white px-2 py-2 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('submission')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'submission' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            Borang Titipan
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            Doa Hub
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'checklist' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            Checklist ({stats.checklistPercent}%)
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'itinerary' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            Calendar & Flights
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'timeline' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('tech_guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'tech_guide' ? 'bg-pink-600 text-white' : 'text-pink-700'
            }`}
          >
            Supabase/Netlify
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">

        {/* TAB 1: PUBLIC SUBMISSION FORM VIEW */}
        {}
        {activeTab === 'submission' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-rose-700 to-rose-950 text-white p-6 sm:p-8 shadow-xl shadow-pink-200/50">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full border-4 border-pink-300/40 bg-pink-500/40 flex items-center justify-center text-3xl font-bold shadow-inner text-pink-100">
                  SZ
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-400/20 border border-pink-300/30 text-pink-200 text-xs font-medium mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-pink-300" /> Bakal Dhuyufullah (Tetamu Allah)
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Titipan Doa buat {pilgrimName}
                  </h1>
                  <p className="text-pink-100/90 text-xs sm:text-sm mt-1 italic font-serif">
                    "Titipkan doa, iringi perjalanan ke Tanah Suci."
                  </p>
                  <p className="text-pink-200/80 text-xs mt-1">
                    Hantarkan doa ikhlas anda untuk dibaca dan diaminkan oleh Syahidah di Makkah & Madinah.
                  </p>
                </div>
              </div>
            </div>

            {!isSubmitted ? (
              <div className="bg-white/90 backdrop-blur-xl border border-pink-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-100" /> Titipkan Doa Ikhlas Anda
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Setiap doa kebaikan yang anda titipkan akan dibalas dengan kebaikan oleh para malaikat.
                </p>

                <form onSubmit={handleDoaSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Nama Anda / Keluarga
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmad & Family / Sahabat Kolej"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-slate-800 text-sm transition bg-pink-50/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Kategori Doa
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['Kesihatan', 'Rezeki', 'Ampunan', 'Zuriat', 'Umum'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                            category === cat
                              ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                              : 'bg-pink-50/50 border-pink-100 text-slate-600 hover:bg-pink-100/60'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Isi Titipan Doa & Hajat
                      </label>
                      <span className="text-xs text-pink-600 font-medium">Bebas & Ikhlas</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Tuliskan titipan doa khusus anda di sini..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-slate-800 text-sm transition bg-pink-50/20"
                      required
                    />
                  </div>

                  <div className="bg-pink-50/60 rounded-2xl p-4 border border-pink-100">
                    <span className="text-xs font-bold text-pink-800 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Perlukan Inspirasi Ayat Doa?
                    </span>
                    <div className="flex flex-col gap-2">
                      {PRESET_INSPIRATIONS.slice(0, 2).map((insp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMessage(insp)}
                          className="text-left text-xs bg-white text-slate-700 p-2.5 rounded-xl border border-pink-100 hover:border-pink-300 hover:text-pink-700 transition"
                        >
                          "{insp}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition transform active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Titip Doa Kepada {pilgrimName}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-xl border border-pink-200 rounded-3xl p-8 text-center space-y-5 shadow-lg animate-fade-in">
                <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Alhamdulillah! 🌸</h3>
                  <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                    Titipan doa anda telah selamat disampaikan ke dalam koleksi doa <span className="font-semibold text-pink-600">{pilgrimName}</span>. Semoga Allah mengabulkan setiap permintaan baik anda.
                  </p>
                </div>

                <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 text-left text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Ringkasan Doa Dititip:</p>
                  <p><span className="font-medium">Pengirim:</span> {senderName}</p>
                  <p><span className="font-medium">Kategori:</span> {category}</p>
                  <p className="italic bg-white p-2.5 rounded-lg border border-pink-100 mt-2 text-slate-700">"{message}"</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleResetForm}
                    className="flex-1 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold rounded-xl text-sm transition"
                  >
                    Titip Doa Lain
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
                  >
                    Buka Pilgrim Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PILGRIM DASHBOARD */}
        {}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-pink-100/80 shadow-sm">
              <div>
                <span className="text-xs font-bold text-pink-600 tracking-wider uppercase">Pilgrim Dashboard</span>
                <h1 className="text-2xl font-extrabold text-slate-800">Selamat Datang, {pilgrimName} 🌸</h1>
                <p className="text-xs text-pink-600 italic font-serif mt-0.5">
                  "Titipkan doa, iringi perjalanan ke Tanah Suci."
                </p>
              </div>

              <div className="w-full md:w-auto bg-pink-50/80 border border-pink-100 p-3 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] text-pink-700 font-semibold uppercase">Pautan Titipan Doa Anda</span>
                    <span className="text-xs font-mono text-slate-700 truncate">titipandoa.app/p/{pilgrimSlug}</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-1 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Disalin' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl">
                  {stats.total}
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Jumlah Doa</span>
                  <p className="text-sm font-bold text-slate-800">Telah Dititip</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                  {stats.unread}
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Belum Dibaca</span>
                  <p className="text-sm font-bold text-slate-800">Doa Baru</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">
                  {stats.bookmarked}
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Ditanda Bintang</span>
                  <p className="text-sm font-bold text-slate-800">Fokus Utama</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl">
                  {stats.totalAmins}
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Sebutan Amin</span>
                  <p className="text-sm font-bold text-slate-800">Jumlah Diucap</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-pink-100/80 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-pink-50 pb-4">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama pengirim atau doa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-pink-50/30 border border-pink-100 rounded-xl text-xs focus:ring-2 focus:ring-pink-200 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-pink-50/40 border border-pink-100 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="All">Semua Kategori</option>
                    <option value="Kesihatan">Kesihatan</option>
                    <option value="Rezeki">Rezeki</option>
                    <option value="Ampunan">Ampunan</option>
                    <option value="Zuriat">Zuriat</option>
                    <option value="Umum">Umum</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-pink-50/40 border border-pink-100 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Unread">Belum Dibaca</option>
                    <option value="Read">Sudah Dibaca</option>
                    <option value="Starred">Bintang</option>
                  </select>

                  <button
                    onClick={() => setActiveTab('focus')}
                    className="ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Mula Membaca
                  </button>
                </div>
              </div>

              {filteredDoas.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-40 text-pink-300" />
                  <p className="text-sm font-medium">Tiada titipan doa dijumpai padan dengan carian.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDoas.map((doa) => (
                    <div
                      key={doa.id}
                      className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                        doa.is_read ? 'bg-pink-50/20 border-slate-200' : 'bg-white border-pink-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-lg text-[10px] font-bold">
                            {doa.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleBookmark(doa.id)}
                              className={`p-1.5 rounded-lg transition ${
                                doa.is_bookmarked ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-slate-400'
                              }`}
                              title="Tanda Bintang"
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoa(doa.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition"
                              title="Padam Doa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm">{doa.sender_name}</h4>
                        <p className="text-slate-600 text-xs mt-2 leading-relaxed whitespace-pre-line">
                          "{doa.message}"
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between text-xs">
                        <button
                          onClick={() => toggleReadStatus(doa.id)}
                          className={`flex items-center gap-1 font-medium ${
                            doa.is_read ? 'text-slate-400' : 'text-pink-600'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> {doa.is_read ? 'Dibaca' : 'Tanda Dibaca'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => incrementAmin(doa.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 font-semibold text-[11px] transition"
                          >
                            <Heart className="w-3 h-3 fill-pink-500" /> Amin ({doa.amin_count})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UMRAH CHECKLIST */}
        {}
        {activeTab === 'checklist' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                  <ListTodo className="w-6 h-6 text-pink-500" /> Senarai Semak Umrah (Checklist)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Urus persiapan ibadah, pakaian, dan dokumen Syahidah sebelum berangkat.
                </p>
              </div>

              <div className="w-full md:w-64 bg-pink-50/80 p-4 rounded-2xl border border-pink-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">Kemajuan Persiapan</span>
                  <span className="text-pink-600">{stats.checklistDone} / {stats.checklistTotal} ({stats.checklistPercent}%)</span>
                </div>
                <div className="w-full bg-pink-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-rose-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${stats.checklistPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
              <form onSubmit={handleAddChecklistItem} className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newChecklistCat}
                  onChange={(e) => setNewChecklistCat(e.target.value)}
                  className="px-3 py-2.5 bg-pink-50/50 border border-pink-100 rounded-xl text-xs font-semibold text-slate-700 outline-none shrink-0"
                >
                  <option value="Dokumen & Kewangan">Dokumen & Kewangan</option>
                  <option value="Ibadah & Kelengkapan Ihram">Ibadah & Kelengkapan Ihram</option>
                  <option value="Ubat-ubatan & Kesihatan">Ubat-ubatan & Kesihatan</option>
                  <option value="Pakaian & Keperluan Harian">Pakaian & Keperluan Harian</option>
                </select>

                <input
                  type="text"
                  placeholder="Tambah perkara baru ke dalam senarai semak..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200"
                />

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
              </form>
            </div>

            {['Dokumen & Kewangan', 'Ibadah & Kelengkapan Ihram', 'Ubat-ubatan & Kesihatan', 'Pakaian & Keperluan Harian'].map(cat => {
              const catItems = checklist.filter(item => item.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="bg-white rounded-3xl border border-pink-100/80 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                    <h3 className="font-bold text-sm text-pink-700 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-500" /> {cat}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {catItems.filter(i => i.completed).length}/{catItems.length} Selesai
                    </span>
                  </div>

                  <div className="space-y-2">
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          item.completed ? 'bg-pink-50/20 border-pink-100' : 'bg-white border-pink-100 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleChecklist(item.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 ${
                              item.completed ? 'bg-pink-500 text-white' : 'border-2 border-pink-300 hover:border-pink-500'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          {editingChecklistId === item.id ? (
                            <input
                              type="text"
                              value={editingChecklistText}
                              onChange={(e) => setEditingChecklistText(e.target.value)}
                              className="flex-1 px-3 py-1 bg-white border border-pink-300 rounded-lg text-xs font-medium outline-none"
                              autoFocus
                            />
                          ) : (
                            <span className={`text-xs font-medium leading-snug ${
                              item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}>
                              {item.text}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {editingChecklistId === item.id ? (
                            <button
                              onClick={() => saveEditChecklist(item.id)}
                              className="p-1.5 bg-pink-600 text-white rounded-lg text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditChecklist(item)}
                              className="p-1.5 text-slate-400 hover:text-pink-600 transition"
                              title="Edit Perkara"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteChecklistItem(item.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition"
                            title="Padam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: FLIGHT & ITINERARY PLANNER */}
        {}
        {activeTab === 'itinerary' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                  <Calendar className="w-6 h-6 text-pink-500" /> Kalendar, Penerbangan & Atur Cara
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Kemaskini jadual penerbangan dan susun jadual aktiviti harian Syahidah di Makkah & Madinah.
                </p>
              </div>

              <button
                onClick={() => setIsEditingFlights(!isEditingFlights)}
                className="px-4 py-2.5 bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> {isEditingFlights ? 'Tutup Suntingan' : 'Kemaskini Maklumat Penerbangan'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Departure Flight Card */}
              <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-rose-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-pink-200 transform -rotate-45" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-pink-100">Penerbangan Pergi</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold text-white">
                    {flights.departure.flightNo}
                  </span>
                </div>

                {!isEditingFlights ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-center">
                      <div>
                        <span className="text-2xl font-black">{flights.departure.fromCode}</span>
                        <p className="text-[10px] text-pink-100">{flights.departure.depTime}</p>
                      </div>
                      <div className="flex-1 px-4 flex flex-col items-center">
                        <span className="text-[10px] text-pink-200">{flights.departure.airline}</span>
                        <div className="w-full bg-white/30 h-0.5 relative my-1">
                          <Plane className="w-3 h-3 text-white absolute -top-1 left-1/2 -translate-x-1/2 rotate-90" />
                        </div>
                        <span className="text-[10px] text-pink-200 font-semibold">{flights.departure.date}</span>
                      </div>
                      <div>
                        <span className="text-2xl font-black">{flights.departure.toCode}</span>
                        <p className="text-[10px] text-pink-100">{flights.departure.arrTime}</p>
                      </div>
                    </div>
                    <p className="text-xs bg-white/10 p-2.5 rounded-xl border border-white/20 italic">
                      Note: {flights.departure.notes}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-800 text-xs">
                    <input
                      type="text"
                      placeholder="Syarikat Penerbangan"
                      value={flights.departure.airline}
                      onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, airline: e.target.value } })}
                      className="w-full p-2 bg-white rounded-lg outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dari (e.g. KUL)"
                        value={flights.departure.fromCode}
                        onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, fromCode: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Ke (e.g. JED)"
                        value={flights.departure.toCode}
                        onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, toCode: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={flights.departure.date}
                        onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, date: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                      <input
                        type="time"
                        value={flights.departure.depTime}
                        onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, depTime: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nota Penerbangan"
                      value={flights.departure.notes}
                      onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, notes: e.target.value } })}
                      className="w-full p-2 bg-white rounded-lg outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Return Flight Card */}
              <div className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-pink-300 transform rotate-135" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-pink-200">Penerbangan Pulang</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold text-white">
                    {flights.return.flightNo}
                  </span>
                </div>

                {!isEditingFlights ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-center">
                      <div>
                        <span className="text-2xl font-black">{flights.return.fromCode}</span>
                        <p className="text-[10px] text-pink-200">{flights.return.depTime}</p>
                      </div>
                      <div className="flex-1 px-4 flex flex-col items-center">
                        <span className="text-[10px] text-pink-300">{flights.return.airline}</span>
                        <div className="w-full bg-white/30 h-0.5 relative my-1">
                          <Plane className="w-3 h-3 text-white absolute -top-1 left-1/2 -translate-x-1/2 rotate-90" />
                        </div>
                        <span className="text-[10px] text-pink-300 font-semibold">{flights.return.date}</span>
                      </div>
                      <div>
                        <span className="text-2xl font-black">{flights.return.toCode}</span>
                        <p className="text-[10px] text-pink-200">{flights.return.arrTime}</p>
                      </div>
                    </div>
                    <p className="text-xs bg-white/10 p-2.5 rounded-xl border border-white/20 italic">
                      Note: {flights.return.notes}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-800 text-xs">
                    <input
                      type="text"
                      placeholder="Syarikat Penerbangan"
                      value={flights.return.airline}
                      onChange={(e) => setFlights({ ...flights, return: { ...flights.return, airline: e.target.value } })}
                      className="w-full p-2 bg-white rounded-lg outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dari (e.g. MED)"
                        value={flights.return.fromCode}
                        onChange={(e) => setFlights({ ...flights, return: { ...flights.return, fromCode: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Ke (e.g. KUL)"
                        value={flights.return.toCode}
                        onChange={(e) => setFlights({ ...flights, return: { ...flights.return, toCode: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={flights.return.date}
                        onChange={(e) => setFlights({ ...flights, return: { ...flights.return, date: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                      <input
                        type="time"
                        value={flights.return.depTime}
                        onChange={(e) => setFlights({ ...flights, return: { ...flights.return, depTime: e.target.value } })}
                        className="p-2 bg-white rounded-lg outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nota Penerbangan"
                      value={flights.return.notes}
                      onChange={(e) => setFlights({ ...flights, return: { ...flights.return, notes: e.target.value } })}
                      className="w-full p-2 bg-white rounded-lg outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-pink-600" /> Tambah Aktiviti / Atur Cara Harian
              </h3>

              <form onSubmit={handleAddItinerary} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                <input
                  type="date"
                  value={itDate}
                  onChange={(e) => setItDate(e.target.value)}
                  className="p-2.5 bg-pink-50/40 border border-pink-100 rounded-xl text-xs outline-none"
                  required
                />
                <input
                  type="time"
                  value={itTime}
                  onChange={(e) => setItTime(e.target.value)}
                  className="p-2.5 bg-pink-50/40 border border-pink-100 rounded-xl text-xs outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Lokasi (e.g. Makkah)"
                  value={itLocation}
                  onChange={(e) => setItLocation(e.target.value)}
                  className="p-2.5 bg-pink-50/40 border border-pink-100 rounded-xl text-xs outline-none"
                  required
                />
                <select
                  value={itCategory}
                  onChange={(e) => setItCategory(e.target.value)}
                  className="p-2.5 bg-pink-50/40 border border-pink-100 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="Ibadah">Ibadah</option>
                  <option value="Ziarah">Ziarah</option>
                  <option value="Perjalanan">Perjalanan</option>
                </select>
                <input
                  type="text"
                  placeholder="Aktiviti / Catatan..."
                  value={itActivity}
                  onChange={(e) => setItActivity(e.target.value)}
                  className="md:col-span-2 p-2.5 bg-pink-50/40 border border-pink-100 rounded-xl text-xs outline-none"
                  required
                />
                <button
                  type="submit"
                  className="md:col-span-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Simpan Aktiviti Harian
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Senarai Atur Cara Terjadual ({itinerary.length})</h3>

              <div className="space-y-3">
                {itinerary.map(it => (
                  <div key={it.id} className="p-4 rounded-2xl bg-pink-50/30 border border-pink-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 flex flex-col items-center justify-center font-bold shrink-0">
                        <Clock className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px]">{it.time}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-200 text-pink-800 rounded-md">
                            {it.date}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-pink-500" /> {it.location}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{it.activity}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItinerary(it.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TIMELINE VIEW */}
        {}
        {activeTab === 'timeline' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                <Compass className="w-6 h-6 text-pink-500" /> Timeline Perjalanan Umrah Syahidah
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Gambaran kronologi berurutan mengikut tarikh penerbangan, ibadah, dan ziarah di Holy Land.
              </p>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-pink-200 space-y-8 my-6">
              {timelineEvents.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-pink-500 border-4 border-white shadow-md group-hover:scale-125 transition" />

                  <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm space-y-2 hover:border-pink-300 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${event.badgeColor}`}>
                        {event.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-lg border border-pink-100">
                        {new Date(event.dateTime).toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })} @ {new Date(event.dateTime).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800">{event.title}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-pink-500" />
                      <span>{event.location}</span>
                    </div>

                    <p className="text-xs text-slate-600 bg-pink-50/30 p-2.5 rounded-xl border border-pink-50 italic">
                      {event.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: FOCUS READER (MAKKAH MODE) */}
        {}
        {activeTab === 'focus' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-pink-100 shadow-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Keluar Focus Mode
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-2">
                  {focusIndex + 1} dari {doas.length} Doa
                </span>
                <button
                  onClick={() => setReaderTheme('soft_rose')}
                  className={`w-6 h-6 rounded-full bg-pink-400 border-2 ${
                    readerTheme === 'soft_rose' ? 'border-pink-700 ring-2 ring-pink-200' : 'border-transparent'
                  }`}
                  title="Soft Rose Theme"
                />
                <button
                  onClick={() => setReaderTheme('velvet_dark')}
                  className={`w-6 h-6 rounded-full bg-rose-950 border-2 ${
                    readerTheme === 'velvet_dark' ? 'border-pink-400 ring-2 ring-pink-900' : 'border-transparent'
                  }`}
                  title="Velvet Dark Night Theme"
                />
                <button
                  onClick={() => setReaderTheme('cream_blossom')}
                  className={`w-6 h-6 rounded-full bg-rose-100 border-2 ${
                    readerTheme === 'cream_blossom' ? 'border-pink-500 ring-2 ring-pink-200' : 'border-transparent'
                  }`}
                  title="Cream Blossom Theme"
                />
              </div>
            </div>

            {doas.length > 0 ? (
              <div
                className={`min-h-[460px] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden ${
                  readerTheme === 'soft_rose'
                    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white border border-pink-300/40'
                    : readerTheme === 'velvet_dark'
                    ? 'bg-gradient-to-br from-rose-950 via-slate-950 to-rose-950 text-pink-100 border border-pink-900/60'
                    : 'bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 text-slate-900 border border-pink-200'
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Flower2 className="w-64 h-64 text-pink-200" />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ${
                      readerTheme === 'cream_blossom'
                        ? 'bg-pink-100 text-pink-800 border border-pink-200'
                        : 'bg-white/20 text-white border border-white/30'
                    }`}>
                      {doas[focusIndex].category}
                    </span>
                    <button
                      onClick={() => toggleBookmark(doas[focusIndex].id)}
                      className={`p-2 rounded-full ${
                        doas[focusIndex].is_bookmarked ? 'text-pink-200 bg-white/20' : 'text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  <div>
                    <h3 className={`text-xl sm:text-2xl font-extrabold tracking-wide ${
                      readerTheme === 'cream_blossom' ? 'text-pink-700' : 'text-pink-100'
                    }`}>
                      Titipan Doa Dari: {doas[focusIndex].sender_name}
                    </h3>
                    <p className="text-xs opacity-75 mt-1">
                      Diterima pada: {new Date(doas[focusIndex].created_at).toLocaleDateString('ms-MY')}
                    </p>
                  </div>

                  <div className="py-4">
                    <p className="text-lg sm:text-2xl font-serif leading-relaxed italic">
                      "{doas[focusIndex].message}"
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => incrementAmin(doas[focusIndex].id)}
                      className="px-5 py-3 bg-white text-pink-700 hover:bg-pink-50 font-extrabold rounded-2xl shadow-lg flex items-center gap-2 text-sm transition transform active:scale-95"
                    >
                      <Heart className="w-4 h-4 fill-pink-500" /> Sebut & Hantar Amin ({doas[focusIndex].amin_count})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={focusIndex === 0}
                      onClick={() => setFocusIndex(prev => Math.max(0, prev - 1))}
                      className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl transition"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      disabled={focusIndex === doas.length - 1}
                      onClick={() => setFocusIndex(prev => Math.min(doas.length - 1, prev + 1))}
                      className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-2xl transition"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Tiada doa untuk dibaca.</div>
            )}
          </div>
        )}

        {/* TAB 7: SUPABASE & NETLIFY TECH GUIDE */}
        {}
        {activeTab === 'tech_guide' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-rose-950 via-pink-900 to-rose-950 text-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-8 h-8 text-pink-400" />
                <Cloud className="w-8 h-8 text-rose-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Titipan Doa Architecture Blueprint</h1>
              <p className="text-pink-100/90 text-sm mt-2 max-w-2xl">
                Panduan penuh penyepaduan pangkalan data Supabase PostgreSQL dan penyebaran ke Netlify untuk aplikasi Titipan Doa anda.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-pink-600" /> 1. Supabase SQL Schema Setup
                </h3>
                <span className="text-xs bg-pink-100 text-pink-800 font-bold px-2.5 py-1 rounded-full">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jalankan skrip SQL berikut di Supabase SQL Editor untuk mencipta jadual `profiles` dan `titipan_doas` beserta polisi keselamatan Row Level Security (RLS).
              </p>

              <pre className="bg-slate-900 text-pink-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed">
{`-- 1. Create Profiles Table for Pilgrims
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Titipan Doas Table
create table public.titipan_doas (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text not null,
  category text default 'Umum'::text not null,
  message text not null,
  is_read boolean default false,
  is_bookmarked boolean default false,
  amin_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.titipan_doas enable row level security;

-- 4. RLS Policy: Anyone can submit a Titipan Doa (Public Insert)
create policy "Public can insert titipan doas" 
  on public.titipan_doas for insert 
  with check (true);

-- 5. RLS Policy: Only Pilgrim can view their received Titipan Doas
create policy "Pilgrims can view own titipan doas" 
  on public.titipan_doas for select 
  using (auth.uid() = profile_id);`}
              </pre>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white border-t border-pink-100 py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-medium text-pink-700">Titipan Doa — "Titipkan doa, iringi perjalanan ke Tanah Suci."</p>
        <p className="mt-1 opacity-70">© 2026 Titipan Doa Platform. Custom personal dashboard built for Syahidah Zulkafli.</p>
      </footer>
    </div>
  );
}