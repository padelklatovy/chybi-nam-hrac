/* ============================================================
   dataService.js — datová vrstva nástroje „Chybí nám hráč"
   ------------------------------------------------------------
   MOCK / LOCAL verze (localStorage).

   Veškerá data tečou přes tento soubor. Zbytek appky volá jen
   jeho funkce a všechny vrací Promise — takže přechod na sdílený
   Supabase znamená jen výměnu tohoto souboru za
   dataService.supabase.js se stejným rozhraním.

   Datový model jedné hry (match):
     id          – unikátní id
     creator     – jméno zakladatele
     date        – 'YYYY-MM-DD'
     time        – 'HH:MM'
     level       – úroveň (A, B1, ... D2) nebo 'mix'
     type        – typ hry (volná hra, tréninkový, mix, Americano)
     court       – místo / kurt (volitelné)
     note        – poznámka (volitelné)
     needed      – kolik hráčů ještě hledáme (0 = plno)
     status      – 'open' | 'full' | 'closed'
     created_at  – ISO timestamp
   ============================================================ */

const DataService = (() => {

  const MODE = 'mock'; // 'mock' | 'supabase'
  const STORAGE_KEY = 'pk_hledam_hru_v1';

  /* ---- výchozí ukázková data ---- */
  const seed = [
    {
      id: 'm1', creator: 'Filip', date: todayPlus(0), time: '18:00',
      level: 'B1', type: 'volná hra', court: 'Kurt 1',
      note: 'Svižné tempo, hrajeme na výsledek.',
      needed: 2, status: 'open', created_at: new Date().toISOString()
    },
    {
      id: 'm2', creator: 'Petra', date: todayPlus(1), time: '10:00',
      level: 'C1', type: 'tréninkový zápas', court: '',
      note: 'V klidu, ideální na zlepšení.',
      needed: 1, status: 'open', created_at: new Date().toISOString()
    },
    {
      id: 'm3', creator: 'Tomáš', date: todayPlus(2), time: '19:30',
      level: 'mix', type: 'Americano', court: 'Kurt 2',
      note: 'Klubové Americano, přijďte všichni!',
      needed: 0, status: 'full', created_at: new Date().toISOString()
    }
  ];

  function todayPlus(d) {
    const x = new Date();
    x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  }

  /* ---- persistence ---- */
  let db = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(seed));
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) {}
  }
  function uid() { return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function ok(d) { return Promise.resolve(d); }

  /* ==========================================================
     VEŘEJNÉ API
     ========================================================== */

  /* aktivní hry = open + full; closed se nezobrazují.
     Řazení: nejbližší termín nahoře. */
  function getMatches() {
    const active = db.filter(m => m.status !== 'closed');
    active.sort((a, b) =>
      new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    return ok(active);
  }

  function addMatch(data) {
    const m = {
      id: uid(),
      creator: (data.creator || '').trim() || 'Hráč',
      date: data.date,
      time: data.time,
      level: data.level || 'mix',
      type: data.type || 'volná hra',
      court: (data.court || '').trim(),
      note: (data.note || '').trim(),
      needed: Number.isFinite(+data.needed) ? +data.needed : 1,
      status: 'open',
      created_at: new Date().toISOString()
    };
    if (m.needed <= 0) { m.needed = 0; m.status = 'full'; }
    db.push(m);
    persist();
    return ok(m);
  }

  /* změna počtu hledaných hráčů o delta (+1 / -1).
     Drží 0..6 a automaticky přepíná status open/full. */
  function adjustNeeded(id, delta) {
    const m = db.find(x => x.id === id);
    if (!m) return Promise.reject(new Error('Hra nenalezena.'));
    m.needed = Math.max(0, Math.min(6, m.needed + delta));
    m.status = m.needed === 0 ? 'full' : 'open';
    persist();
    return ok(m);
  }

  function setFull(id) {
    const m = db.find(x => x.id === id);
    if (!m) return Promise.reject(new Error('Hra nenalezena.'));
    m.needed = 0;
    m.status = 'full';
    persist();
    return ok(m);
  }

  /* uzavřít = schovat z přehledu (měkké smazání) */
  function closeMatch(id) {
    const m = db.find(x => x.id === id);
    if (!m) return Promise.reject(new Error('Hra nenalezena.'));
    m.status = 'closed';
    persist();
    return ok(m);
  }

  /* tvrdé smazání */
  function deleteMatch(id) {
    db = db.filter(x => x.id !== id);
    persist();
    return ok(true);
  }

  function reset() {
    db = JSON.parse(JSON.stringify(seed));
    persist();
    return ok(true);
  }

  return {
    MODE,
    getMatches, addMatch,
    adjustNeeded, setFull,
    closeMatch, deleteMatch,
    reset
  };
})();
