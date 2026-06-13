/* ============================================================
   dataService.supabase.js — SDÍLENÁ data přes Supabase
   ------------------------------------------------------------
   !!! VYPLŇ DVĚ HODNOTY NÍŽE !!!
   Najdi řádky s   <<< SEM VLOŽ ... >>>   a nahraď text mezi
   apostrofy svými údaji ze Supabase (Project URL a Publishable key).
   Apostrofy ' ' musí zůstat. Nic jiného v souboru neměň.
   ============================================================ */

const DataService = (() => {

  // 1) Project URL  (Supabase → Settings → Data API → Project URL)
  //    vypadá jako:  https://abcdefgh.supabase.co
  const SUPABASE_URL = 'https://yynkcxanfglptmznkiwx.supabase.co/rest/v1/';

  // 2) Publishable key  (Supabase → Settings → API Keys → Publishable key)
  //    vypadá jako:  sb_publishable_DY2iR5z1GmK...
  const SUPABASE_ANON_KEY = 'sb_publishable_DY2iR5z1GmK_-jb7XVa0hw_Z_6uNYzo';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  function must(r) { if (r.error) throw new Error(r.error.message); return r.data; }

  async function getMatches() {
    return must(await sb.from('matches').select('*')
      .neq('status', 'closed')
      .order('date', { ascending: true })
      .order('time', { ascending: true }));
  }

  async function addMatch(data) {
    let needed = Number.isFinite(+data.needed) ? +data.needed : 1;
    let status = 'open';
    if (needed <= 0) { needed = 0; status = 'full'; }
    const rows = must(await sb.from('matches').insert({
      creator: (data.creator || '').trim() || 'Hráč',
      date: data.date, time: data.time,
      level: data.level || 'mix',
      type: data.type || 'volná hra',
      court: (data.court || '').trim(),
      note: (data.note || '').trim(),
      needed, status
    }).select());
    return rows[0];
  }

  async function adjustNeeded(id, delta) {
    // přečti aktuální, uprav, zapiš (jednoduché; pro MVP stačí)
    const cur = must(await sb.from('matches').select('needed').eq('id', id).single());
    let needed = Math.max(0, Math.min(6, cur.needed + delta));
    const status = needed === 0 ? 'full' : 'open';
    const rows = must(await sb.from('matches').update({ needed, status }).eq('id', id).select());
    return rows[0];
  }

  async function setFull(id) {
    const rows = must(await sb.from('matches').update({ needed: 0, status: 'full' }).eq('id', id).select());
    return rows[0];
  }

  async function closeMatch(id) {
    const rows = must(await sb.from('matches').update({ status: 'closed' }).eq('id', id).select());
    return rows[0];
  }

  async function deleteMatch(id) {
    must(await sb.from('matches').delete().eq('id', id));
    return true;
  }

  async function reset() {
    throw new Error('Reset není v Supabase režimu dostupný (data jsou sdílená).');
  }

  return { MODE: 'supabase', getMatches, addMatch, adjustNeeded, setFull, closeMatch, deleteMatch, reset };
})();
