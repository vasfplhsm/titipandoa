import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import Tasbih from './tasbih/Tasbih';
import SiteHeader from './components/SiteHeader';
import PublicJourney from './rebrand/PublicJourney';
import { INTRO_NOTE } from './content/intro-note';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import {OwnerInbox, PrayerReader, OwnerSettings, OwnerSignIn} from './rebrand/OwnerWorkspace';
import {DEFAULT_PROFILE, cleanProfile, validatePrayer} from './rebrand/model';
import { About } from './components/DoaCollection';
import DoaLibrary from './library/DoaLibrary';
import './design.css';
import { BottomNavigation, FeatureHub } from './mobile/Navigation';

import OfflinePanel from './offline/OfflinePanel';
import OfflineChrome from './offline/Chrome';
import { flushPersistence } from './offline/persistence.js';
import './mobile/mobile.css';
import './rebrand/rebrand.css';
import './rebrand/announcement.css';
import './theme/themes.css';
import { get, put, remove, flushDatabase } from './offline/db.js';
import { queueDoa, localPatch, synchronize, cachePrivate, overlayPending, startSyncTriggers, pendingOperations, syncIsActive, retryOperation, verifiedOwner } from './offline/sync.js';
import {Sparkles, Check, Trash2, Lock, Plus, Flower2, Calendar, Plane, Clock, MapPin, ListTodo, Edit3, X, Compass, FileText, DollarSign, TrendingUp, Download, PieChart, Wallet} from 'lucide-react';


const CHECKLIST_CATEGORIES = [
  'Dokumen & Kewangan',
  'Ibadah & Kelengkapan Ihram',
  'Ubat-ubatan & Kesihatan',
  'Pakaian & Keperluan Harian',
  'Lain-lain',
];


const INITIAL_FLIGHTS = {
 departure: {airline:'',flightNo:'',fromCode:'',toCode:'',date:'',depTime:'',arrTime:'',gate:'',notes:''},
 return: {airline:'',flightNo:'',fromCode:'',toCode:'',date:'',depTime:'',arrTime:'',gate:'',notes:''}
};




const EXPENSE_CATEGORIES = [
  { id: 'pakej', label: 'Pakej Umrah', icon: '🕌', color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'food', label: 'Makanan & Minuman', icon: '🍽️', color: 'from-orange-400 to-amber-500', light: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'simcard', label: 'Kad SIM', icon: '📶', color: 'from-blue-400 to-cyan-500', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'transport', label: 'Pengangkutan', icon: '🚌', color: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'accommodation', label: 'Penginapan', icon: '🏨', color: 'from-rose-500 to-pink-600', light: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'shopping', label: 'Membeli-belah', icon: '🛍️', color: 'from-pink-500 to-fuchsia-600', light: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'health', label: 'Kesihatan & Ubat', icon: '💊', color: 'from-red-400 to-rose-500', light: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'insuran', label: 'Insuran', icon: '🛡️', color: 'from-indigo-500 to-blue-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'souvenir', label: 'Souvenir', icon: '🎁', color: 'from-yellow-400 to-amber-500', light: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'others', label: 'Lain-lain', icon: '📦', color: 'from-slate-400 to-slate-500', light: 'bg-slate-50 text-slate-700 border-slate-200' },
];

function libraryRoute() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('doa/')) return { entryId: hash.slice(4), guideId: null, active: true };
  if (hash.startsWith('panduan/')) return { entryId: null, guideId: hash.slice(8), active: true };
  return { entryId: null, guideId: null, active: hash === 'collection' };
}

function AppFrame({children}) {
 const {palette,resolvedAppearance,themeStyle}=useTheme();
 return <div className="td-app min-h-screen font-sans flex flex-col" data-palette={palette} data-theme={resolvedAppearance} style={themeStyle}>{children}</div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() =>
    libraryRoute().active ? 'collection' : 'home',
  ); // 'submission', 'dashboard', 'checklist', 'itinerary', 'timeline', 'focus', 'expenses'
  const [tasbihFocus, setTasbihFocus] = useState(false);
  const [readingFocus, setReadingFocus] = useState(false);
  const [connected, setConnected] = useState(navigator.onLine);
  useEffect(() => {
    const changed = () => setConnected(navigator.onLine);
    window.addEventListener('online', changed);
    window.addEventListener('offline', changed);
    return () => {
      window.removeEventListener('online', changed);
      window.removeEventListener('offline', changed);
    };
  }, []);

  useEffect(() => {

    const keyboard = () =>
      document.documentElement.classList.toggle(
        'pwa-keyboard-open',
        !!window.visualViewport &&
          window.innerHeight - window.visualViewport.height > 150,
      );
    window.visualViewport?.addEventListener('resize', keyboard);
    return () => {

      window.visualViewport?.removeEventListener('resize', keyboard);
    };
  }, []);
  const openOwner = () => {
    if (isOwner) navigate('dashboard');
    else {
      setShowPinModal(true);
    }
  };
  async function saveBeforeUpdate() {
    await flushDatabase();
    await flushPersistence();
    if (syncIsActive() || (await pendingOperations()).length)
      throw new Error('Selesaikan perubahan tertunda sebelum mengemas kini.');
    if (
      activeTab === 'settings' ||
      editingBudget ||
      editingSarWallet ||
      editingChecklistId ||
      isEditingFlights ||
      itActivity ||
      newChecklistItem ||
      expForm.description ||
      expForm.amount ||
      expForm.notes
    )
      throw new Error('Selesaikan suntingan aktif sebelum mengemas kini.');
    if ((senderName || message) && !isSubmitted) {
      if (
        !window.confirm('Simpan draf doa pada peranti sebelum mengemas kini?')
      )
        throw new Error(
          'Kemas kini dibatalkan; draf anda dikekalkan pada halaman.',
        );
      const existing = await get('drafts', 'doa-submission');
      await put('drafts', {
        ...existing,
        id: 'doa-submission',
        value: { senderName, message, category },
        updatedAt: new Date().getTime(),
      });
    }
  }

  const [readingRoute, setReadingRoute] = useState(libraryRoute);
  const [libraryVisited, setLibraryVisited] = useState(
    () => libraryRoute().active,
  );
  const [tasbihRequest, setTasbihRequest] = useState(null);
  const tasbihRequestId = useRef(0);
  useEffect(() => {
    function syncRoute() {
      const route = libraryRoute();
      setReadingRoute(route);
      if (route.active) {
        setActiveTab('collection');
        setLibraryVisited(true);
      }
      setReadingFocus(false);
    }
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  function openLibraryEntry(id) {
    setLibraryVisited(true);
    window.location.assign(id ? `#doa/${id}` : '#collection');
    setReadingFocus(false);
    setReadingRoute({ entryId: id, guideId: null, active: true });
    setActiveTab('collection');
    window.scrollTo(0, 0);
  }
  function openLibraryGuide(id) {
    setLibraryVisited(true);
    window.location.assign(`#panduan/${id}`);
    setReadingRoute({ entryId: null, guideId: id, active: true });
    setActiveTab('collection');
    window.scrollTo(0, 0);
  }
  function openTasbihEntry(entry) {
    setTasbihRequest({ entry, nonce: ++tasbihRequestId.current });
    navigate('tasbih');
  }
  function navigate(tab) {
    setReadingFocus(false);
    if (tab === 'collection') {
      openLibraryEntry(null);
      return;
    }
    if (libraryRoute().active)
      history.pushState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const [doas, setDoas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const profileRevision = useRef(0);
  const [submissionBusy, setSubmissionBusy] = useState(false);
  const submissionLock = useRef(false);
  const [submissionPending, setSubmissionPending] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const [isOwner, setIsOwner] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  async function acceptOwner(owner) {
    await put('meta', {id:'verified-owner-session', value:owner.id});
    setIsOwner(true); setShowPinModal(false); navigate('dashboard');
  }
  useEffect(()=>{
    let cancelled=false;
    let loadRequest=0;
    async function load(){
      const request=++loadRequest, revision=profileRevision.current;
      const current=()=>!cancelled && request===loadRequest && revision===profileRevision.current;
      try {
        const cached=await get('publicContent','tumpangdoa-profile');
        if(cached && current())setProfile(cleanProfile(cached.value));
        if(supabase && navigator.onLine){
          const {data,error}=await supabase.from('tumpangdoa_public_profile').select('*').eq('id','default').maybeSingle();
          if(!error&&data&&current()){const value=cleanProfile(data);setProfile(value);await put('publicContent',{id:'tumpangdoa-profile',value});}
        }
      }catch{/* The welcoming default remains available offline. */}
    }
    load();window.addEventListener('online',load);return()=>{cancelled=true;window.removeEventListener('online',load);};
  },[]);
  // Public visitors can submit doa and use their private tasbih.
  useEffect(() => {
    if (!isOwner && !['home', 'submission', 'tasbih', 'collection', 'about', 'doahub', 'zikrhub', 'offline'].includes(activeTab)) {
      setActiveTab('home');
    }
  }, [isOwner, activeTab]);

  // Submission Form State
  const [senderName, setSenderName] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Checklist State
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistCat, setNewChecklistCat] = useState('Dokumen & Kewangan');
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  // Flight & Itinerary State
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [isEditingFlights, setIsEditingFlights] = useState(false);
  const [itinerary, setItinerary] = useState([]);

  // ─── Expenses Tracker State ────────────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState({ total: 0, currency: 'MYR', sarWallet: 0 });
  const [expForm, setExpForm] = useState({
    description: '',
    amount: '',
    currency: 'SAR',
    category: 'food',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const expenseFormRef = useRef(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingSarWallet, setEditingSarWallet] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [sarWalletInput, setSarWalletInput] = useState('');
  const [expFilter, setExpFilter] = useState('all');
  const [expCurrencyFilter, setExpCurrencyFilter] = useState('all');

  useEffect(() => {
    let cancelled=false;
    let verification=0;
    async function check() {
      const request=++verification;
      if(!supabase) return;
      try {
        let owner;
        if(navigator.onLine) owner=await verifiedOwner();
        else {
          const [verified,download,privateOwner] = await Promise.all([get('meta','verified-owner-session'),get('preferences','private-download'),get('meta','private-owner')]);
          // A downloaded plaintext copy is a trusted-device convenience, not server authority.
          // Avoid refreshing an expired network token when only reading offline.
          if(download && verified?.value && privateOwner?.value===verified.value) owner={id:verified.value};
        }
        if(cancelled || request!==verification)return;
        setIsOwner(Boolean(owner));
        if(owner && navigator.onLine) await put('meta',{id:'verified-owner-session',value:owner.id});
        if(!owner){setDoas([]);setChecklist([]);setItinerary([]);setExpenses([]);}
        if(window.location.hash==='#owner' || new URLSearchParams(window.location.search).get('admin')==='true') {
          if(owner)setActiveTab('dashboard');else setShowPinModal(true);
        }
      } catch { if(!cancelled && request===verification)setIsOwner(false); }
    }
    check(); window.addEventListener('online',check); window.addEventListener('offline',check);
    const subscription=supabase?.auth.onAuthStateChange(()=>{setTimeout(check,0);});
    return ()=>{cancelled=true;window.removeEventListener('online',check);window.removeEventListener('offline',check);subscription?.data.subscription.unsubscribe();};
  },[]);

  const handleStartEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setExpForm({
      description: exp.description || '',
      amount: exp.amount ? exp.amount.toString() : '',
      currency: exp.currency || 'SAR',
      category: exp.category || 'food',
      date: exp.date || new Date().toISOString().slice(0, 10),
      notes: exp.notes || ''
    });
    if (expenseFormRef.current) {
      expenseFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setExpForm({
      description: '',
      amount: '',
      currency: 'SAR',
      category: 'food',
      date: new Date().toISOString().slice(0, 10),
      notes: ''
    });
  };

  const handleSubmitExpense = async (event) => {
    event.preventDefault();
    if (!navigator.onLine || !supabase) {
      showToast(
        'Perbelanjaan memerlukan sambungan dalam talian. Draf dikekalkan.',
      );
      return;
    }
    const amount = Number(expForm.amount);
    if (
      !expForm.description.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showToast('Sila isi butiran dan amaun yang sah.');
      return;
    }
    const payload = {
      description: expForm.description.trim(),
      amount,
      currency: expForm.currency,
      category: expForm.category,
      date: expForm.date,
      notes: expForm.notes.trim(),
    };
    const result =
      editingExpenseId && !String(editingExpenseId).startsWith('temp-')
        ? await supabase
            .from('expenses')
            .update(payload)
            .eq('id', editingExpenseId)
            .select()
            .single()
        : await supabase.from('expenses').insert([payload]).select().single();
    if (result.error || !result.data) {
      showToast('Perbelanjaan belum disahkan server. Draf dikekalkan.');
      return;
    }
    setExpenses((rows) =>
      editingExpenseId
        ? rows.map((row) => (row.id === editingExpenseId ? result.data : row))
        : [result.data, ...rows],
    );
    setEditingExpenseId(null);
    setExpForm((value) => ({
      ...value,
      description: '',
      amount: '',
      notes: '',
    }));
    broadcastSync('expense_saved');
    showToast('Perbelanjaan disahkan server.');
  };
  const handleDeleteExpense = async (id) => {
    if (!navigator.onLine || !supabase) {
      showToast('Pemadaman memerlukan sambungan dalam talian.');
      return;
    }
    if (!window.confirm('Padam rekod perbelanjaan ini dari server?')) return;
    if (!String(id).startsWith('temp-')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        showToast(error.message);
        return;
      }
    }
    setExpenses((rows) => rows.filter((row) => row.id !== id));
    if (editingExpenseId === id) handleCancelEditExpense();
    broadcastSync('delete_expense');
    showToast('Perbelanjaan dipadam selepas pengesahan.');
  };

  const handleSaveBudget = async (e) => {
    if (!navigator.onLine || !supabase) {
      e?.preventDefault();
      showToast(
        'Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.',
      );
      return;
    }
    if (e) e.preventDefault();
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) {
      showToast('Sila masukkan amaun bajet yang sah.');
      return;
    }
    const newBudget = { ...budget, total: val };
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'budget', value: newBudget }, { onConflict: 'key' });
    if (error) {
      showToast(error.message);
      return;
    }
    setBudget(newBudget);
    broadcastSync('update_budget');
    setEditingBudget(false);
    showToast(`Bajet MYR dikemas kini: RM ${val.toLocaleString()}`);
  };

  const handleSaveSarWallet = async (e) => {
    if (!navigator.onLine || !supabase) {
      e?.preventDefault();
      showToast('Tindakan ini memerlukan sambungan dalam talian.');
      return;
    }
    if (e) e.preventDefault();
    const val = parseFloat(sarWalletInput);
    if (isNaN(val) || val <= 0) {
      showToast('Sila masukkan amaun SAR yang sah.');
      return;
    }
    const newBudget = { ...budget, sarWallet: val };
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'budget', value: newBudget }, { onConflict: 'key' });
    if (error) {
      showToast(error.message);
      return;
    }
    setBudget(newBudget);
    broadcastSync('update_budget');
    setEditingSarWallet(false);
    showToast(`Duit tukaran SAR dikemas kini: SAR ${val.toLocaleString()}`);
  };

  const expenseStats = useMemo(() => {
    const myrExpenses = expenses.filter(e => !e.currency || e.currency === 'MYR');
    const sarExpenses = expenses.filter(e => e.currency === 'SAR');

    const myrTotal = myrExpenses.reduce((s, e) => s + e.amount, 0);
    const sarTotal = sarExpenses.reduce((s, e) => s + e.amount, 0);

    const myrRemaining = budget.total - myrTotal;
    const sarRemaining = (budget.sarWallet || 0) - sarTotal;

    const myrPct = budget.total > 0 ? Math.min(100, Math.round((myrTotal / budget.total) * 100)) : 0;
    const sarPct = (budget.sarWallet || 0) > 0 ? Math.min(100, Math.round((sarTotal / (budget.sarWallet || 1)) * 100)) : 0;

    const byCategory = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      myrSpent: myrExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
      sarSpent: sarExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
      count: expenses.filter(e => e.category === cat.id).length
    })).filter(c => c.myrSpent > 0 || c.sarSpent > 0);

    return { myrTotal, sarTotal, myrRemaining, sarRemaining, myrPct, sarPct, byCategory,
             total: myrTotal, remaining: myrRemaining, pct: myrPct };
  }, [expenses, budget]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const currMatch = expCurrencyFilter === 'all' || (e.currency || 'MYR') === expCurrencyFilter;
      const catMatch = expFilter === 'all' || e.category === expFilter;
      return currMatch && catMatch;
    });
  }, [expenses, expFilter, expCurrencyFilter]);

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const catMap = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c.label]));
    const rows = expenses.map(e => ({
      Tarikh: e.date,
      Kategori: catMap[e.category] || e.category,
      Penerangan: e.description,
      Amaun: e.amount,
      Mata_Wang: e.currency || 'MYR',
      Nota: e.notes || ''
    }));
    // Summary rows
    const summaryRows = [
      {},
      { Tarikh: '--- RINGKASAN ---' },
      { Tarikh: 'Bajet MYR', Amaun: budget.total, Mata_Wang: 'MYR' },
      { Tarikh: 'Dibelanjakan (MYR)', Amaun: expenseStats.myrTotal, Mata_Wang: 'MYR' },
      { Tarikh: 'Baki MYR', Amaun: expenseStats.myrRemaining, Mata_Wang: 'MYR' },
      {},
      { Tarikh: 'Duit Tukaran SAR', Amaun: budget.sarWallet || 0, Mata_Wang: 'SAR' },
      { Tarikh: 'Dibelanjakan (SAR)', Amaun: expenseStats.sarTotal, Mata_Wang: 'SAR' },
      { Tarikh: 'Baki SAR', Amaun: expenseStats.sarRemaining, Mata_Wang: 'SAR' },
      {},
      ...expenseStats.byCategory.map(c => ({ Tarikh: c.label, 'MYR': c.myrSpent || 0, 'SAR': c.sarSpent || 0, Penerangan: `${c.count} transaksi` }))
    ];
    const ws = XLSX.utils.json_to_sheet([...rows, ...summaryRows]);
    ws['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Perbelanjaan Umrah');
    XLSX.writeFile(wb, `perbelanjaan_umrah_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Fail Excel berjaya dimuat turun! 📊');
  };

  // New Itinerary Form State
  const [itDate, setItDate] = useState(new Date().toISOString().slice(0,10));
  const [itTime, setItTime] = useState('09:00');
  const [itLocation, setItLocation] = useState('Makkah');
  const [itActivity, setItActivity] = useState('');
  const [itCategory, setItCategory] = useState('Ibadah');

  // ─── Supabase: Real-time Auto-Sync Engine ──────────────────────────────────
  const realtimeChannelRef = useRef(null);
  const isEditingFlightsRef = useRef(false);
  const loadingRef = useRef(false);

  // Broadcast any local mutations immediately to all other connected devices
  const broadcastSync = useCallback((action) => {
    if (realtimeChannelRef.current) {
      try {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'sync',
          payload: { action, timestamp: Date.now() }
        });
      } catch (e) {
        console.warn('Realtime broadcast failed:', e);
      }
    }
  }, []);

  const loadAllData = useCallback(
    async (silent = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (!silent) setIsLoading(true);
      try {
        if (!isOwner) return;
        if (!supabase)return;
        if (!navigator.onLine) {
          const [savedDoas, savedChecklist, savedItinerary, savedFlights] =
            await Promise.all(
              ['doas', 'checklist', 'itinerary', 'flights'].map((table) =>
                get('privateRecords', table),
              ),
            );
          const verified=await get('meta','verified-owner-session');
          const uid=verified?.value;
          if (savedDoas?.ownerId===uid) setDoas(savedDoas.rows);
          if (savedChecklist?.ownerId===uid) setChecklist(savedChecklist.rows);
          if (savedItinerary?.ownerId===uid) setItinerary(savedItinerary.rows);
          if (savedFlights?.ownerId===uid && savedFlights.value) setFlights(savedFlights.value);
          return;
        }
        const sessionOwner=await verifiedOwner();
        if(!sessionOwner){setIsOwner(false);return;}
        const [
          doasRes,
          checklistRes,
          flightsRes,
          itineraryRes,
          expensesRes,
          budgetRes,
        ] = await Promise.all([
          supabase
            .from('doas')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('checklist')
            .select('*')
            .order('id', { ascending: true }),
          supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'flights')
            .single(),
          supabase
            .from('itinerary')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true }),
          supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'budget')
            .single(),
        ]);
        const owner = {value:sessionOwner.id};
        for (const [table, result, setter] of [
          ['doas', doasRes, setDoas],
          ['checklist', checklistRes, setChecklist],
          ['itinerary', itineraryRes, setItinerary],
        ]) {
          if (!result.error && result.data) {
            const rows = await overlayPending(table, result.data).catch(
              () => result.data,
            );
            setter(rows);
            if (owner)
              await cachePrivate(table, result.data, owner.value).catch(
                () => {},
              );
          }
        }
        if (flightsRes.data?.value && !isEditingFlightsRef.current)
          setFlights(flightsRes.data.value);
        if (expensesRes.data) setExpenses(expensesRes.data);
        if (budgetRes.data?.value) setBudget(budgetRes.data.value);
        // No automatic seeding or settings writes on startup/reconnect.
      } catch (error) {
        console.warn('Data belum dimuatkan:', error.message);
      } finally {
        loadingRef.current = false;
        if (!silent) setIsLoading(false);
      }
    },
    [isOwner],
  );

  useEffect(() => {
    isEditingFlightsRef.current = isEditingFlights;
  }, [isEditingFlights]);
  useEffect(() => {
    loadAllData(false);
    let channel;
    let timer;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      timer = setTimeout(() => loadAllData(true), 250);
    };
    const connect = () => {
      if (
        !supabase ||
        !isOwner ||
        !navigator.onLine ||
        document.visibilityState !== 'visible'
      )
        return;
      if (channel) return;
      channel = supabase.channel('titipandoa_realtime');
      realtimeChannelRef.current = channel;
      for (const table of [
        'doas',
        'checklist',
        'itinerary',
        'expenses',
        'app_settings',
      ])
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          refresh,
        );
      channel.on('broadcast', { event: 'sync' }, refresh).subscribe();
    };
    const disconnect = () => {
      if (channel) {
        supabase?.removeChannel(channel);
        channel = null;
        realtimeChannelRef.current = null;
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        connect();
        refresh();
      } else disconnect();
    };
    const offline = () => {
      disconnect();
      loadAllData(true);
    };
    connect();
    window.addEventListener('online', visibility);
    window.addEventListener('offline', offline);
    window.addEventListener('titipandoa:offline-change', refresh);
    document.addEventListener('visibilitychange', visibility);
    const stopSync = startSyncTriggers();
    return () => {
      clearTimeout(timer);
      disconnect();
      stopSync();
      window.removeEventListener('online', visibility);
      window.removeEventListener('offline', offline);
      window.removeEventListener('titipandoa:offline-change', refresh);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [loadAllData, isOwner]);

  useEffect(() => {
    let mounted = true;
    get('drafts', 'doa-submission')
      .then((draft) => {
        if (mounted && draft) {
          setSenderName(draft.value.senderName || '');
          setMessage(draft.value.message || '');
          setCategory(draft.value.category || 'Kesihatan');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setDraftHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!draftHydrated) return;
    let cancelled = false;
    get('preferences', 'save-drafts')
      .then((setting) => {
        if (!cancelled && setting?.value)
          return get('drafts', 'doa-submission').then((existing) =>
            put('drafts', {
              ...existing,
              id: 'doa-submission',
              value: { senderName, message, category },
              updatedAt: new Date().getTime(),
            }),
          );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [senderName, message, category, draftHydrated]);

  useEffect(()=>{
    let cancelled=false;
    async function check(){
      const draft=await get('drafts','doa-submission').catch(()=>null);
      if(!draft?.submissionId)return;
      const op=await get('outbox','doa-'+draft.submissionId).catch(()=>null);
      if(cancelled||!op)return;
      if(op.status==='synced'){setIsSubmitted(true);setSubmissionPending(false);setSubmissionError('');await remove('drafts','doa-submission');}
      else if(op.status==='discarded'){setSubmissionPending(false);await remove('drafts','doa-submission');}
      else setSubmissionPending(true);
    }
    check();window.addEventListener('titipandoa:offline-change',check);
    return()=>{cancelled=true;window.removeEventListener('titipandoa:offline-change',check);};
  },[]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDoaSubmit = async (e) => {
    e.preventDefault();
    if(submissionLock.current || submissionPending)return;
    const validation=validatePrayer(senderName,message,category);
    if(validation){setSubmissionError(validation);return;}
    if(!profile.accepting_submissions){setSubmissionError('Kiriman doa baharu sedang ditutup.');return;}
    submissionLock.current=true;setSubmissionBusy(true);setSubmissionError('');

    const newDoa = {
      sender_name: senderName.trim() || 'Tanpa nama',
      category: category || 'Lain-lain',
      message: message.trim(),
      is_read: false,
      is_bookmarked: false,
      amin_count: 0,
      created_at: new Date().toISOString()
    };

    try {
      if (!navigator.onLine && !window.confirm('Simpan doa ini pada peranti dan hantar apabila sambungan kembali?')) return;
      const draft = await get('drafts','doa-submission');
      const stableId = draft?.submissionId || crypto.randomUUID();
      await put('drafts',{id:'doa-submission',submissionId:stableId,value:{senderName,message,category},updatedAt:new Date().getTime()});
      const queued = await queueDoa({...newDoa,id:stableId});
      if (!['queued','running','synced'].includes(queued.status)) await retryOperation(queued.id);
      if (navigator.onLine) await synchronize();
      const operation = await get('outbox','doa-'+stableId);
      if (operation?.status === 'synced') {
        setDoas(prev => prev.some(row => row.id === stableId) ? prev : [{...newDoa,id:stableId},...prev]);
        setIsSubmitted(true); await remove('drafts','doa-submission');
        showToast('Titipan doa disahkan oleh server. Jazakallah Khair.');
      } else {setSubmissionPending(true);setSubmissionError(operation?.error || 'Doa belum disahkan oleh server.');}
    } catch (error) { setSubmissionError(error.message || 'Pesanan belum dapat disimpan. Jangan tutup halaman ini.'); } finally {submissionLock.current=false;setSubmissionBusy(false);}
  };

  const handleResetForm = () => {
    setSenderName('');
    setMessage('');
    setCategory('');
    setIsSubmitted(false);setSubmissionPending(false);setSubmissionError('');
  };

  const toggleReadStatus = async (id) => {
    if (!navigator.onLine || !supabase) {
      showToast('Tindakan ini memerlukan sambungan dalam talian.');
      return;
    }
    const doa = doas.find((row) => row.id === id);
    if (!doa) return;
    if(!await verifiedOwner())throw Error('Akses pemilik belum disahkan.');
    const updated = { is_read: !doa.is_read };
    const {data, error} = await supabase.from('doas').update(updated).eq('id', id).eq('is_read',Boolean(doa.is_read)).select('id,is_read');
    if(!error && !data?.length)throw Error('Status belum disahkan. Muat semula doa sebelum mencuba lagi.');
    if (error) {
      showToast(error.message);
      return;
    }
    setDoas((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...updated } : row)),
    );
    const owner=await verifiedOwner();
    if(owner) await cachePrivate('doas',doas.map(row=>row.id===id?{...row,...updated}:row),owner.id);
    broadcastSync('toggle_read');
  };
  const handleLock = async () => {
    const result=await supabase?.auth.signOut({scope:'local'});
    if(result?.error){showToast('Log keluar belum berjaya. Cuba semula sebelum berkongsi peranti.');return;}
    setIsOwner(false);setDoas([]);setChecklist([]);setItinerary([]);setExpenses([]);
    await remove('meta','verified-owner-session');
    history.replaceState(null,'',window.location.pathname);navigate('home');
  };

  const toggleChecklist = async (id) => {
    const item = checklist.find((c) => c.id === id);
    if (!item) return;
    const updated = { completed: !item.completed };
    try {
      const cached = await get('privateRecords', 'checklist');
      if (cached) {
        await localPatch('checklist', id, updated);
        setChecklist((prev) =>
          prev.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
        showToast(
          'Perubahan disimpan pada peranti. Menunggu pengesahan penyegerakan.',
        );
        if (navigator.onLine) synchronize();
      } else {
        if (!navigator.onLine || !supabase)
          throw new Error(
            'Muat turun senarai semak dahulu untuk mengubahnya luar talian.',
          );
        const { error } = await supabase
          .from('checklist')
          .update(updated)
          .eq('id', id);
        if (error) throw error;
        setChecklist((prev) =>
          prev.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
        broadcastSync('toggle_checklist');
      }
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleAddChecklistItem = async (e) => {
    if (!navigator.onLine || !supabase) { showToast('Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.'); return; }
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = {
      category: newChecklistCat,
      text: newChecklistItem.trim(),
      completed: false
    };
    const { data, error } = await supabase.from('checklist').insert([newItem]).select().single();
    if (!error && data) {
      setChecklist(prev => [...prev, data]);
    }
    if (error || !data) { showToast('Item belum disahkan server. Draf dikekalkan.'); return; }
    broadcastSync('add_checklist');
    setNewChecklistItem('');
    showToast('Item baru ditambah ke senarai semak!');
  };

  const startEditChecklist = (item) => {
    setEditingChecklistId(item.id);
    setEditingChecklistText(item.text);
  };

  const saveEditChecklist = async (id) => {
    if (!navigator.onLine || !supabase) { showToast('Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.'); return; }
    const updated = { text: editingChecklistText };
    const {error} = await supabase.from('checklist').update(updated).eq('id', id);
    if (error) { showToast(error.message); return; }
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    setEditingChecklistId(null);
    broadcastSync('edit_checklist');
    showToast('Perkara disemak dikemas kini!');
  };

  const deleteChecklistItem = async (id) => {
    if (!navigator.onLine || !supabase) { showToast('Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.'); return; }
    if (!window.confirm('Padam item senarai semak ini dari server?')) return;
    const {error} = await supabase.from('checklist').delete().eq('id', id);
    if (error) { showToast(error.message); return; }
    setChecklist(prev => prev.filter(item => item.id !== id));
    broadcastSync('delete_checklist');
    showToast('Item dipadam dari senarai.');
  };

  const handleAddItinerary = async (e) => {
    if (!navigator.onLine || !supabase) { showToast('Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.'); return; }
    e.preventDefault();
    if (!itActivity.trim()) return;
    const newEntry = {
      date: itDate,
      time: itTime,
      location: itLocation,
      activity: itActivity.trim(),
      category: itCategory
    };
    const { data, error } = await supabase.from('itinerary').insert([newEntry]).select().single();
    if (!error && data) {
      setItinerary(prev => [...prev, data].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)));
    }
    if (error || !data) { showToast('Atur cara belum disahkan server. Draf dikekalkan.'); return; }
    broadcastSync('add_itinerary');
    setItActivity('');
    showToast('Atur cara baru berjaya ditambah!');
  };

  const handleDeleteItinerary = async (id) => {
    if (!navigator.onLine || !supabase) { showToast('Tindakan ini memerlukan sambungan dalam talian. Tiada perubahan dihantar.'); return; }
    if (!window.confirm('Padam atur cara ini dari server?')) return;
    const {error} = await supabase.from('itinerary').delete().eq('id', id);
    if (error) { showToast(error.message); return; }
    setItinerary(prev => prev.filter(it => it.id !== id));
    broadcastSync('delete_itinerary');
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
    <ThemeProvider publicTheme={profile.public_theme} publicAppearance={profile.public_appearance}><AppFrame>
      <a className="skip-link" href="#main-content">Langkau ke kandungan</a>
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed top-5 right-5 z-50 bg-rose-950 text-pink-100 px-5 py-3 rounded-2xl shadow-2xl border border-pink-700/50 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !['home', 'submission', 'tasbih', 'collection', 'about', 'doahub', 'zikrhub', 'offline'].includes(activeTab) && (
        <div className="fixed inset-x-0 bottom-0 top-[70px] z-[60] bg-rose-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200 animate-pulse">
            <Flower2 className="w-7 h-7 text-white fill-white/20" />
          </div>
          <div className="data-skeleton" aria-hidden="true"><div/><div/><div/></div>
          <p className="text-sm font-semibold text-pink-700">Memuatkan data...</p>
        </div>
      )}

      <SiteHeader activeTab={activeTab} navigate={navigate}
        isOwner={isOwner} hidden={tasbihFocus || readingFocus || activeTab === 'focus'}
        openOwner={openOwner} />
      <OfflineChrome publicMode={!isOwner} navigate={navigate} hidden={tasbihFocus || readingFocus || activeTab === 'focus'} saveBeforeUpdate={saveBeforeUpdate} />
      {isOwner && activeTab!=='focus' && <nav className="owner-navigation" aria-label="Ruang jemaah">{[['dashboard','Senarai Doa'],['focus','Mod Bacaan'],['umrahhub','Perjalanan'],['collection','Doa & Zikir'],['tasbih','Tasbih'],['settings','Tetapan']].map(([id,label])=><button key={id} aria-current={activeTab===id?'page':undefined} onClick={()=>navigate(id)}>{label}</button>)}</nav>}
      {/* Main Content Area */}
      <main id="main-content" className={`site-main flex-1 w-full mx-auto ${activeTab === 'home' ? 'is-home' : 'p-4 sm:p-6 md:p-8'}`}>
        {['home','submission'].includes(activeTab) && <PublicJourney introNote={INTRO_NOTE} formOpen={activeTab==='submission'} profile={profile} senderName={senderName} setSenderName={setSenderName} category={category} setCategory={setCategory} message={message} setMessage={setMessage} onSubmit={handleDoaSubmit} submitted={isSubmitted} onReset={handleResetForm} navigate={navigate} busy={submissionBusy} pending={submissionPending} error={submissionError}/>}
        {activeTab==='settings' && isOwner && <OwnerSettings profile={profile} flights={flights} onSaved={async value=>{profileRevision.current++;setProfile(value);await put('publicContent',{id:'tumpangdoa-profile',value});}} onError={showToast}/>}
        {['doahub','zikrhub','umrahhub','more'].includes(activeTab) && <FeatureHub kind={activeTab} navigate={navigate} isOwner={isOwner} openOwner={openOwner} openGuide={openLibraryGuide} departureDate={profile.departure_date || flights.departure.date} />}
        {activeTab === 'offline' && <OfflinePanel isOwner={isOwner} />}
        {libraryVisited && <div hidden={activeTab !== 'collection'}><DoaLibrary entryId={readingRoute.entryId} guideId={readingRoute.guideId} onOpenEntry={openLibraryEntry} onOpenGuide={openLibraryGuide} onReadingChange={setReadingFocus} onTasbih={openTasbihEntry} /></div>}
        {activeTab === 'about' && <About navigate={navigate} />}

        {/* TAB 1: PUBLIC SUBMISSION FORM VIEW */}
        {}
        <div hidden={activeTab !== 'tasbih'}><Tasbih libraryRequest={tasbihRequest} onFocusChange={setTasbihFocus} onBack={() => navigate('home')} /></div>
        {activeTab==='dashboard' && isOwner && <OwnerInbox rows={doas} onRead={toggleReadStatus} navigate={navigate} onLogout={handleLock} onError={showToast}/>}
        {/* TAB 3: UMRAH CHECKLIST */}
        {}
        {activeTab === 'checklist' && isOwner && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                  <ListTodo className="w-6 h-6 text-pink-500" /> Senarai Semak Umrah (Checklist)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Urus persiapan ibadah, pakaian, dan dokumen anda sebelum berangkat.
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
                  {CHECKLIST_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
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

            {CHECKLIST_CATEGORIES.map(cat => {
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
                            aria-label={`Tandakan ${item.text}`} aria-pressed={item.completed}
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
        {activeTab === 'itinerary' && isOwner && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
                <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                  <Calendar className="w-6 h-6 text-pink-500" /> Kalendar, Penerbangan & Atur Cara
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Kemaskini jadual penerbangan dan susun jadual aktiviti harian anda di Makkah & Madinah.
                </p>
              </div>

              <button
                onClick={async () => {
                  if (isEditingFlights) {
                    // Save flights to Supabase when closing edit mode
                    if (!supabase)return;
        if (!navigator.onLine) { showToast('Sambungan diperlukan untuk menyimpan penerbangan. Suntingan dikekalkan.'); return; }
                    const {error} = await supabase.from('app_settings').upsert({ key: 'flights', value: flights }, { onConflict: 'key' });
                    if (error) { showToast(error.message); return; }
                    broadcastSync('flights_saved');
                    showToast('Maklumat penerbangan berjaya disimpan! ✈️');
                  }
                  setIsEditingFlights(!isEditingFlights);
                }}
                className="px-4 py-2.5 bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> {isEditingFlights ? 'Simpan & Tutup' : 'Kemaskini Maklumat Penerbangan'}
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
                    <input
                      type="text"
                      placeholder="No. Penerbangan (e.g. SV 834)"
                      value={flights.departure.flightNo}
                      onChange={(e) => setFlights({ ...flights, departure: { ...flights.departure, flightNo: e.target.value } })}
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
                    <input
                      type="text"
                      placeholder="No. Penerbangan (e.g. SV 835)"
                      value={flights.return.flightNo}
                      onChange={(e) => setFlights({ ...flights, return: { ...flights.return, flightNo: e.target.value } })}
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

              {itinerary.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada atur cara. Tambah di atas.</p>
              )}

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
        {activeTab === 'timeline' && isOwner && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Personal Dashboard</span>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-1">
                <Compass className="w-6 h-6 text-pink-500" /> Garis Masa Perjalanan Umrah
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
        {activeTab==='focus' && isOwner && <PrayerReader connected={connected} rows={doas} onRead={toggleReadStatus} navigate={navigate} onError={showToast}/>}
        {/* TAB 7: EXPENSES TRACKER */}
        {activeTab === 'expenses' && isOwner && !connected && <div className="offline-notice" role="status">Perbelanjaan dan bajet tidak dimuat turun pada peranti ini. Buka semula dalam talian untuk melihat data server.</div>}
        {activeTab === 'expenses' && isOwner && connected && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 rounded-full bg-purple-300/20 blur-xl" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-violet-200 uppercase tracking-widest">Personal Dashboard</span>
                  <h1 className="text-2xl font-extrabold mt-1 flex items-center gap-2">
                    <Wallet className="w-7 h-7 text-violet-200" /> Penjejak Perbelanjaan Umrah
                  </h1>
                  <p className="text-violet-200 text-xs mt-1">Jejak perbelanjaan MYR & SAR anda sepanjang perjalanan ke Tanah Suci.</p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl text-sm font-bold transition backdrop-blur-sm shadow-lg"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>

            {/* ── MYR Budget Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">🇲🇾 Bajet Ringgit Malaysia (MYR)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* MYR Budget Card */}
                <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-violet-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">Bajet Keseluruhan</span>
                    </div>
                    <button
                      onClick={() => { setEditingBudget(!editingBudget); setBudgetInput(budget.total.toString()); }}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 transition"
                    >
                      {editingBudget ? 'Batal' : 'Edit'}
                    </button>
                  </div>
                  {editingBudget ? (
                    <form onSubmit={handleSaveBudget} className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">RM</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={budgetInput}
                          onChange={e => setBudgetInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-violet-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"><Check className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <div>
                      <p className="text-2xl font-black text-violet-700">RM {budget.total.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Digunakan</span>
                          <span className={expenseStats.myrPct >= 90 ? 'text-red-600' : expenseStats.myrPct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
                            {expenseStats.myrPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              expenseStats.myrPct >= 90 ? 'bg-gradient-to-r from-red-500 to-rose-600'
                              : expenseStats.myrPct >= 70 ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-violet-500 to-purple-600'
                            }`}
                            style={{ width: `${expenseStats.myrPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MYR Spent */}
                <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Dibelanjakan (MYR)</span>
                  </div>
                  <p className="text-2xl font-black text-rose-600">RM {expenseStats.myrTotal.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-500 mt-1">{expenses.filter(e => !e.currency || e.currency === 'MYR').length} rekod</p>
                </div>

                {/* MYR Remaining */}
                <div className={`rounded-2xl p-5 shadow-sm border ${
                  expenseStats.myrRemaining >= 0 ? 'bg-white border-emerald-100' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      expenseStats.myrRemaining >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${expenseStats.myrRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Baki MYR</span>
                  </div>
                  <p className={`text-2xl font-black ${
                    expenseStats.myrRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    RM {Math.abs(expenseStats.myrRemaining).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {expenseStats.myrRemaining >= 0 ? 'Masih dalam bajet 🎉' : 'Melebihi bajet ⚠️'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── SAR Wallet Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">🇸🇦 Duit Tukaran Saudi Riyal (SAR)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* SAR Wallet Card */}
                <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg">💱</div>
                      <span className="text-sm font-bold text-slate-800">Duit Tukaran</span>
                    </div>
                    <button
                      onClick={() => { setEditingSarWallet(!editingSarWallet); setSarWalletInput((budget.sarWallet || 0).toString()); }}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-50 transition"
                    >
                      {editingSarWallet ? 'Batal' : 'Edit'}
                    </button>
                  </div>
                  {editingSarWallet ? (
                    <form onSubmit={handleSaveSarWallet} className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">SAR</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={sarWalletInput}
                          onChange={e => setSarWalletInput(e.target.value)}
                          className="w-full pl-12 pr-3 py-2 border border-amber-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200"
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold"><Check className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <div>
                      <p className="text-2xl font-black text-amber-600">SAR {(budget.sarWallet || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Digunakan</span>
                          <span className={expenseStats.sarPct >= 90 ? 'text-red-600' : expenseStats.sarPct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
                            {expenseStats.sarPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              expenseStats.sarPct >= 90 ? 'bg-gradient-to-r from-red-500 to-rose-600'
                              : expenseStats.sarPct >= 70 ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                            }`}
                            style={{ width: `${expenseStats.sarPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SAR Spent */}
                <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Dibelanjakan (SAR)</span>
                  </div>
                  <p className="text-2xl font-black text-amber-600">SAR {expenseStats.sarTotal.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-500 mt-1">{expenses.filter(e => e.currency === 'SAR').length} rekod</p>
                </div>

                {/* SAR Remaining */}
                <div className={`rounded-2xl p-5 shadow-sm border ${
                  expenseStats.sarRemaining >= 0 ? 'bg-white border-emerald-100' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      expenseStats.sarRemaining >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${expenseStats.sarRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Baki SAR</span>
                  </div>
                  <p className={`text-2xl font-black ${
                    expenseStats.sarRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    SAR {Math.abs(expenseStats.sarRemaining).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {expenseStats.sarRemaining >= 0 ? 'Masih ada baki 🎉' : 'Melebihi duit tukaran ⚠️'}
                  </p>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            {expenseStats.byCategory.length > 0 && (
              <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-violet-500" /> Pecahan Mengikut Kategori
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {expenseStats.byCategory.map(cat => (
                    <div key={cat.id} className={`p-3 rounded-xl border ${cat.light} space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-[10px] font-bold opacity-70">{cat.count}x</span>
                      </div>
                      <p className="text-[11px] font-semibold leading-tight">{cat.label}</p>
                      {cat.myrSpent > 0 && <p className="text-xs font-black text-violet-700">RM {cat.myrSpent.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>}
                      {cat.sarSpent > 0 && <p className="text-xs font-black text-amber-600">SAR {cat.sarSpent.toLocaleString('en', { minimumFractionDigits: 2 })}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add / Edit Expense Form */}
            <div
              ref={expenseFormRef}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                editingExpenseId ? 'ring-2 ring-amber-400 border-amber-300 shadow-md bg-amber-50/20' : 'border-violet-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  {editingExpenseId ? (
                    <>
                      <Edit3 className="w-4 h-4 text-amber-500" /> Kemaskini Rekod Perbelanjaan
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-violet-600" /> Tambah Rekod Perbelanjaan
                    </>
                  )}
                </h3>
                {editingExpenseId && (
                  <button
                    type="button"
                    onClick={handleCancelEditExpense}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Batal Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                {/* Category chips */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExpForm(prev => ({ ...prev, category: cat.id }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          expForm.category === cat.id
                            ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                            : `${cat.light} hover:opacity-80`
                        }`}
                      >
                        <span>{cat.icon}</span> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Penerangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sarapan di Hotel Madinah"
                      value={expForm.description}
                      onChange={e => setExpForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-violet-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                      required
                    />
                  </div>

                  {/* Currency + Amount side by side */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Mata Wang & Amaun</label>
                    <div className="flex gap-2">
                      <select
                        value={expForm.currency}
                        onChange={e => setExpForm(prev => ({ ...prev, currency: e.target.value }))}
                        className={`shrink-0 px-3 py-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition ${
                          expForm.currency === 'SAR'
                            ? 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-200'
                            : 'border-violet-200 bg-violet-50 text-violet-700 focus:ring-violet-200'
                        }`}
                      >
                        <option value="SAR">🇸🇦 SAR</option>
                        <option value="MYR">🇲🇾 MYR</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          {expForm.currency === 'SAR' ? 'SAR' : 'RM'}
                        </span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0.00"
                          value={expForm.amount}
                          onChange={e => setExpForm(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full pl-12 pr-4 py-2.5 border border-violet-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tarikh</label>
                    <input
                      type="date"
                      value={expForm.date}
                      onChange={e => setExpForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-violet-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Nota (pilihan)</label>
                    <input
                      type="text"
                      placeholder="Nota tambahan..."
                      value={expForm.notes}
                      onChange={e => setExpForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-violet-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-200"
                    />
                  </div>
                </div>

                {editingExpenseId ? (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-200"
                    >
                      <Check className="w-4 h-4" /> Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditExpense}
                      className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition text-sm"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className={`w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg ${
                      expForm.currency === 'SAR'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-200'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Simpan Perbelanjaan {expForm.currency === 'SAR' ? '🇸🇦 SAR' : '🇲🇾 MYR'}
                  </button>
                )}
              </form>
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" /> Senarai Perbelanjaan ({filteredExpenses.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* Currency filter */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 text-xs font-bold">
                    {['all', 'SAR', 'MYR'].map(c => (
                      <button
                        key={c}
                        onClick={() => setExpCurrencyFilter(c)}
                        className={`px-3 py-1.5 transition ${
                          expCurrencyFilter === c
                            ? c === 'SAR' ? 'bg-amber-500 text-white' : c === 'MYR' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {c === 'all' ? 'Semua' : c === 'SAR' ? '🇸🇦 SAR' : '🇲🇾 MYR'}
                      </button>
                    ))}
                  </div>
                  <select
                    value={expFilter}
                    onChange={e => setExpFilter(e.target.value)}
                    className="px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="all">Semua Kategori</option>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-300" />
                  <p className="text-sm font-medium">Belum ada rekod perbelanjaan.</p>
                  <p className="text-xs mt-1">Tambah perbelanjaan pertama anda di atas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.map(exp => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
                    const isSar = exp.currency === 'SAR';
                    const isCurrentlyEditing = editingExpenseId === exp.id;
                    return (
                      <div
                        key={exp.id}
                        className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition group ${
                          isCurrentlyEditing
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                            : isSar
                            ? 'bg-amber-50/40 border-amber-100 hover:border-amber-300'
                            : 'bg-slate-50/60 border-slate-100 hover:border-violet-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg shrink-0 shadow-sm`}>
                            {cat.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 truncate">{exp.description}</p>
                              {isCurrentlyEditing && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0 animate-pulse border border-amber-200">
                                  Sedang Diedit
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isSar ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-violet-100 text-violet-700 border-violet-200'
                              }`}>
                                {isSar ? '🇸🇦 SAR' : '🇲🇾 MYR'}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.light}`}>{cat.label}</span>
                              <span className="text-[10px] text-slate-400">{exp.date}</span>
                              {exp.notes && <span className="text-[10px] text-slate-400 truncate hidden sm:block">· {exp.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className={`text-sm font-black ${
                            isSar ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {isSar ? 'SAR' : 'RM'} {exp.amount.toLocaleString(isSar ? 'en' : 'ms-MY', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditExpense(exp)}
                              className={`p-1.5 rounded-lg transition ${
                                isCurrentlyEditing
                                  ? 'text-amber-600 bg-amber-100'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title="Edit Rekod"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation active={activeTab === 'collection' && readingRoute.guideId ? 'zikrhub' : activeTab} navigate={navigate} hidden={!isOwner || tasbihFocus || readingFocus || activeTab==='focus'} />
      <footer hidden={tasbihFocus || readingFocus || activeTab === 'focus'} className="bg-white border-t border-pink-100 py-6 mt-12 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-pink-700">Tumpang Doa — Ada doa nak dikirim?</p>
        <p className="opacity-70">Tinggalkan di sini, saya bacakan di Tanah Suci.</p>
        {!isOwner && (
          <div className="pt-2">
            <button
              onClick={() => {
                setShowPinModal(true);
              }}
              className="text-[11px] text-pink-600/80 hover:text-pink-700 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <Lock className="w-3 h-3" /> Log Masuk Jemaah (Pemilik Doa)
            </button>
          </div>
        )}
      </footer>

      {showPinModal && <OwnerSignIn onClose={()=>setShowPinModal(false)} onVerified={acceptOwner}/>}
    </AppFrame></ThemeProvider>
  );
}
