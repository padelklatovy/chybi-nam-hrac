/* ============================================================
   app.js — řídicí logika nástroje „Chybí nám hráč"
   ============================================================ */

const App = (() => {

  const LEVELS = ['mix', 'A', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
  const TYPES  = ['volná hra', 'tréninkový zápas', 'mix', 'Americano'];
  const DAYS   = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  }

  /* ---- toast ---- */
  let tTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tTimer);
    tTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---- modal ---- */
  function openModal(html) {
    const o = document.getElementById('modal-overlay');
    document.getElementById('modal').innerHTML = html;
    o.classList.add('open');
    o.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  }
  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  /* ---- přehled her ---- */
  async function renderMatches() {
    const matches = await DataService.getMatches();
    const list = document.getElementById('matches-list');
    document.getElementById('match-count').textContent =
      matches.length ? `(${matches.length})` : '';

    if (!matches.length) {
      list.innerHTML = '<div class="empty">Zatím tu nikdo nikoho nehledá.<br>Buď první a vytvoř hru.</div>';
      return;
    }

    list.innerHTML = matches.map(m => {
      const full = m.status === 'full' || m.needed === 0;
      const statusLabel = full
        ? '<span class="status full">Sestava je plná</span>'
        : `<span class="status open">Sháníme ještě ${m.needed}</span>`;

      return `
        <div class="card match ${full ? 'is-full' : ''}">
          <div class="match-top">
            <span class="match-when">${fmtDate(m.date)} v ${esc(m.time)}</span>
            <span class="badge level">${esc(m.level)}</span>
          </div>
          <div class="match-meta">
            ${esc(m.type)}${m.court ? ' · ' + esc(m.court) : ''} · zve ${esc(m.creator)}
          </div>
          ${m.note ? `<div class="match-note">${esc(m.note)}</div>` : ''}

          <div class="counter-row">
            <span class="counter-cap">Volná místa</span>
            <button class="cbtn" data-minus="${m.id}" ${full ? 'disabled' : ''} aria-label="O jednoho míň">−</button>
            ${statusLabel}
            <button class="cbtn" data-plus="${m.id}" aria-label="O jednoho víc">+</button>
          </div>

          <div class="match-actions">
            <button class="btn btn-red act-share" data-share="${m.id}">Poslat do WhatsApp</button>
            ${full ? '' : `<button class="btn btn-join" data-join="${m.id}">Přidej se</button>`}
            <div class="act-row">
              <button class="link-action" data-full="${m.id}">Už je plno</button>
              <button class="link-action" data-close-match="${m.id}">Smazat</button>
            </div>
          </div>
        </div>`;
    }).join('');

    // akce
    list.querySelectorAll('[data-minus]').forEach(b => b.onclick = () => adjust(b.dataset.minus, -1));
    list.querySelectorAll('[data-plus]').forEach(b => b.onclick = () => adjust(b.dataset.plus, +1));
    list.querySelectorAll('[data-join]').forEach(b => b.onclick = () => joinMatch(b.dataset.join));
    list.querySelectorAll('[data-full]').forEach(b => b.onclick = () => markFull(b.dataset.full));
    list.querySelectorAll('[data-close-match]').forEach(b => b.onclick = () => closeMatch(b.dataset.closeMatch));
    list.querySelectorAll('[data-share]').forEach(b => b.onclick = () => shareMatch(b.dataset.share));
  }

  async function adjust(id, delta) {
    await DataService.adjustNeeded(id, delta);
    renderMatches();
  }
  /* „Přidej se" = lehká UX zkratka: uber jedno volné místo.
     Žádné účty ani identita – jen „tohle místo asi beru já". */
  async function joinMatch(id) {
    await DataService.adjustNeeded(id, -1);
    await renderMatches();
    toast('Super! Domluvte se prosím ve WhatsApp skupině.');
  }
  async function markFull(id) {
    await DataService.setFull(id);
    toast('Označeno jako plné');
    renderMatches();
  }
  async function closeMatch(id) {
    if (!confirm('Opravdu smazat tuhle hru?')) return;
    await DataService.closeMatch(id);
    toast('Hra smazána');
    renderMatches();
  }

  /* ---- sdílení: WhatsApp / kopírovat / obrázek ---- */
  async function shareMatch(id) {
    const matches = await DataService.getMatches();
    const m = matches.find(x => x.id === id);
    if (!m) return;

    const preview = Invite.buildText(m);
    openModal(`
      <button class="close-x" data-close>×</button>
      <h3>Pozvánka je hotová</h3>
      <p class="modal-lead">Zkontroluj a pošli do skupiny.</p>
      <div class="invite-preview">${esc(preview)}</div>
      <a class="btn btn-red btn-hero" href="${Invite.waLink(m)}" target="_blank" rel="noopener" id="wa-go">
        Poslat do WhatsApp
      </a>
      <div class="secondary-row">
        <button class="link-action" id="copy-go">Zkopírovat text</button>
        <button class="link-action" id="img-go">Stáhnout obrázek</button>
      </div>
    `);

    document.getElementById('wa-go').onclick = () => {
      toast('Otevírám WhatsApp…');
      setTimeout(closeModal, 600);
    };
    document.getElementById('copy-go').onclick = async () => {
      const ok = await Invite.copyText(m);
      toast(ok ? 'Zkopírováno, můžeš vložit do chatu' : 'Kopírování se nepovedlo');
    };
    document.getElementById('img-go').onclick = () => {
      Invite.downloadImage(m);
      toast('Obrázek se ukládá do telefonu');
    };
  }

  /* ---- formulář vytvoření ---- */
  function openCreate() {
    const today = new Date().toISOString().slice(0, 10);
    const levelOpts = LEVELS.map(l => `<option value="${l}">${l === 'mix' ? 'Nezáleží' : l}</option>`).join('');
    const typeOpts  = TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
    const savedName = localStorage.getItem('pk_hh_name') || '';

    openModal(`
      <button class="close-x" data-close>×</button>
      <h3>Nová hra</h3>

      <div class="field-row">
        <div class="field"><label>Kdy</label><input id="f-date" type="date" value="${today}" /></div>
        <div class="field"><label>V kolik</label><input id="f-time" type="time" value="18:00" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Skupina</label><select id="f-level">${levelOpts}</select></div>
        <div class="field"><label>Kolik lidí sháníš</label>
          <select id="f-needed">
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
          </select>
        </div>
      </div>

      <button class="more-toggle" id="more-toggle" type="button">Další možnosti</button>
      <div class="more-fields" id="more-fields">
        <div class="field">
          <label>Tvoje jméno</label>
          <input id="f-creator" type="text" placeholder="ať vědí, kdo zve" value="${esc(savedName)}" />
        </div>
        <div class="field-row">
          <div class="field"><label>Druh hry</label><select id="f-type">${typeOpts}</select></div>
          <div class="field"><label>Kurt</label><input id="f-court" type="text" placeholder="nepovinné" /></div>
        </div>
        <div class="field">
          <label>Vzkaz</label>
          <textarea id="f-note" placeholder="třeba tempo nebo úroveň, nepovinné"></textarea>
        </div>
      </div>

      <button class="btn btn-red" id="f-submit">Hotovo, připravit pozvánku</button>
    `);

    document.getElementById('more-toggle').onclick = () => {
      const box = document.getElementById('more-fields');
      const t = document.getElementById('more-toggle');
      const open = box.classList.toggle('show');
      t.classList.toggle('open', open);
    };

    document.getElementById('f-submit').onclick = async () => {
      const date = document.getElementById('f-date').value;
      const time = document.getElementById('f-time').value;
      if (!date || !time) { toast('Doplň ještě datum a čas.'); return; }

      const name = document.getElementById('f-creator').value.trim();
      if (name) localStorage.setItem('pk_hh_name', name); // zapamatuj na příště

      const m = await DataService.addMatch({
        creator: name,
        date, time,
        level: document.getElementById('f-level').value,
        type:  document.getElementById('f-type').value,
        court: document.getElementById('f-court').value,
        needed: document.getElementById('f-needed').value,
        note:  document.getElementById('f-note').value
      });
      await renderMatches();
      shareMatch(m.id); // hned nabídni odeslání – to je celý smysl
    };
  }

  /* ---- init ---- */
  function init() {
    document.getElementById('btn-create').onclick = openCreate;
    document.getElementById('btn-reset').onclick = async () => {
      await DataService.reset();
      toast('Ukázková data obnovena');
      renderMatches();
    };
    document.getElementById('modal-overlay').onclick = (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    };
    renderMatches();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
