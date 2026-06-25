/* ============================================================
   paysyService.js — napojení na rezervační systém Paysy
   ------------------------------------------------------------
   ZATÍM JEN ČTENÍ DOSTUPNOSTI (public endpointy, bez tokenu).

   Endpointy (public, z https://rezervace.padelklatovy.cz):
     1) /api/v1/reservations/object-types
        → vrátí areály (object types). Náš má uuid OBJECT_TYPE_UUID.
     2) /api/v1/reservations/services?object_type_uuid=...
        → vrátí služby (např. "Rezervace kurtu"). Bereme její uuid.
     3) /api/v1/reservations/services/{serviceUuid}/blocks?date=YYYY-MM-DD
        → vrátí kurty a jejich 30min bloky s is_available + price.

   Zápis rezervací (vytvoření/zrušení) Paysy teprve chystá –
   až dorazí, doplní se sem funkce createReservation() apod.,
   které budou potřebovat API token.
   ============================================================ */

const PaysyService = (() => {

  const BASE = 'https://rezervace.padelklatovy.cz/api/v1';

  /* Náš areál (z object-types). Lze zjistit i dynamicky přes
     getObjectTypes(), ale máme ho z dokumentace napevno. */
  const OBJECT_TYPE_UUID = '54034092-1c2e-4ca6-9afe-fa78235dffaf';

  /* jednoduchý GET vracející JSON, s ošetřením chyby */
  async function getJSON(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Paysy API: HTTP ' + res.status);
    const json = await res.json();
    if (!json.success) throw new Error('Paysy API: ' + (json.message || 'neúspěch'));
    return json.data;
  }

  /* ---- 1) areály (object types) ---- */
  async function getObjectTypes() {
    return getJSON(`${BASE}/reservations/object-types`);
  }

  /* ---- 2) služby pro náš areál ---- */
  async function getServices() {
    const data = await getJSON(
      `${BASE}/reservations/services?object_type_uuid=${OBJECT_TYPE_UUID}`
    );
    return data.list || [];
  }

  /* vrať uuid první služby (typicky "Rezervace kurtu") */
  async function getDefaultServiceUuid() {
    const services = await getServices();
    if (!services.length) throw new Error('Paysy: žádná služba k rezervaci.');
    return services[0].uuid;
  }

  /* ---- 3) dostupnost: kurty + bloky pro daný den ---- */
  async function getBlocks(serviceUuid, date) {
    const data = await getJSON(
      `${BASE}/reservations/services/${serviceUuid}/blocks?date=${date}`
    );
    return data; // { date, min_available_date, max_date, objects: [...] }
  }

  /* ==========================================================
     ODVOZENÁ DATA pro modul „Chybí nám hráč"
     ========================================================== */

  function hhmm(dateTimeStr) {
    // "2026-06-26 18:00:00" → "18:00"
    return dateTimeStr.slice(11, 16);
  }

  /* Najdi souvislé volné úseky délky aspoň `minMinutes` na každém
     kurtu. Vrací přehledný seznam „od kdy do kdy je kurt volný",
     ze kterého modul nabídne začátky her. */
  function freeRangesFromBlocks(objects, minMinutes = 60) {
    const courts = [];
    for (const o of objects) {
      const ranges = [];
      let run = null; // aktuální souvislý volný úsek

      for (const b of o.blocks) {
        if (b.is_available) {
          if (!run) run = { from: b.from, to: b.to, blocks: 1, price: b.price };
          else { run.to = b.to; run.blocks += 1; run.price += b.price; }
        } else {
          if (run) { ranges.push(run); run = null; }
        }
      }
      if (run) ranges.push(run);

      // jen úseky dost dlouhé na hru
      const longEnough = ranges
        .filter(r => r.blocks * 30 >= minMinutes)
        .map(r => ({
          from: hhmm(r.from),
          to: hhmm(r.to),
          minutes: r.blocks * 30,
          price: r.price
        }));

      courts.push({
        uuid: o.uuid,
        name: o.name,
        minTime: o.min_time || minMinutes,
        freeRanges: longEnough
      });
    }
    return courts;
  }

  /* Hlavní funkce pro modul: pro daný den vrať kurty s volnými úseky.
     Vrací: { date, minDate, maxDate, courts: [{name, freeRanges:[...]}] } */
  async function getAvailability(date) {
    const serviceUuid = await getDefaultServiceUuid();
    const data = await getBlocks(serviceUuid, date);
    const courts = freeRangesFromBlocks(data.objects || [], 60);
    return {
      date: data.date,
      minDate: data.min_available_date,
      maxDate: data.max_date,
      serviceUuid,
      courts
    };
  }

  /* Nabídni možné ZAČÁTKY 90min hry (typická délka) na daný den.
     Vrací plochý seznam: [{court, start, end, minutes}] – ideální
     pro našeptávač termínu při vytváření open match. */
  async function suggestStartTimes(date, gameMinutes = 90) {
    const { courts } = await getAvailability(date);
    const out = [];
    for (const c of courts) {
      for (const r of c.freeRanges) {
        // posuň se po 30 min a nabídni každý možný start, kam se hra vejde
        const [fh, fm] = r.from.split(':').map(Number);
        const [th, tm] = r.to.split(':').map(Number);
        let startMin = fh * 60 + fm;
        const endLimit = th * 60 + tm;
        while (startMin + gameMinutes <= endLimit) {
          const sH = String(Math.floor(startMin / 60)).padStart(2, '0');
          const sM = String(startMin % 60).padStart(2, '0');
          const e = startMin + gameMinutes;
          const eH = String(Math.floor(e / 60)).padStart(2, '0');
          const eM = String(e % 60).padStart(2, '0');
          out.push({
            court: c.name,
            courtUuid: c.uuid,
            start: `${sH}:${sM}`,
            end: `${eH}:${eM}`,
            minutes: gameMinutes
          });
          startMin += 30;
        }
      }
    }
    return out;
  }

  return {
    OBJECT_TYPE_UUID,
    getObjectTypes, getServices, getDefaultServiceUuid,
    getBlocks, getAvailability, suggestStartTimes
  };
})();
