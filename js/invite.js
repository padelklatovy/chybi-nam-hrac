/* ============================================================
   invite.js — generátor WhatsApp pozvánky
   ------------------------------------------------------------
   Primární cesta: textová pozvánka + otevření WhatsApp.
   Bonus: obrázková kartička (canvas → PNG ke stažení).
   ============================================================ */

const Invite = (() => {

  const DAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];

  function fmtDateLong(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  }

  /* sestav text pozvánky pro WhatsApp.
     WhatsApp podporuje *tučně* (hvězdičky). */
  function buildText(m) {
    const lines = [];
    lines.push('🎾 *CHYBÍ NÁM HRÁČ — Padel Klatovy*');
    lines.push('');
    lines.push(`📅 ${fmtDateLong(m.date)} v ${m.time}`);
    if (m.court) lines.push(`📍 ${m.court}`);
    lines.push(`🏷️ Úroveň: ${m.level}   •   ${m.type}`);
    if (m.status === 'full' || m.needed === 0) {
      lines.push('');
      lines.push('✅ *PLNO* — díky všem!');
    } else {
      lines.push('');
      const word = m.needed === 1 ? 'hráče' : (m.needed >= 2 && m.needed <= 4 ? 'hráče' : 'hráčů');
      lines.push(`👥 Hledáme ještě *${m.needed} ${word}*`);
    }
    if (m.note) {
      lines.push('');
      lines.push(`📝 ${m.note}`);
    }
    lines.push('');
    lines.push(`— ${m.creator}`);
    return lines.join('\n');
  }

  /* odkaz, který otevře WhatsApp s předvyplněným textem.
     wa.me funguje na mobilu i desktopu; uživatel jen vybere skupinu. */
  function waLink(m) {
    return 'https://wa.me/?text=' + encodeURIComponent(buildText(m));
  }

  /* zkopíruj text do schránky (fallback pro starší prohlížeče) */
  async function copyText(m) {
    const text = buildText(m);
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let okFlag = false;
      try { okFlag = document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      return okFlag;
    }
  }

  /* ---- BONUS: obrázková kartička přes canvas ---- */
  function buildImage(m) {
    const W = 1080, H = 1080;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // pozadí — tmavě zelený gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0B1F1B');
    g.addColorStop(1, '#0A4339');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // červený pruh nahoře
    ctx.fillStyle = '#ED1C24';
    ctx.fillRect(0, 0, W, 16);

    // tečkovaný vzor (jemný) vpravo nahoře
    ctx.fillStyle = 'rgba(237,28,36,0.10)';
    for (let y = 80; y < 360; y += 36) {
      for (let x = 760; x < W - 40; x += 36) {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    const cx = 90;
    let y = 180;

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ED1C24';
    ctx.font = '700 38px Montserrat, Arial, sans-serif';
    ctx.fillText('PADEL KLATOVY', cx, y);

    y += 90;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 92px Montserrat, Arial, sans-serif';
    ctx.fillText('CHYBÍ NÁM', cx, y);
    y += 96;
    ctx.fillText('HRÁČ', cx, y);

    // čára
    y += 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(W - cx, y); ctx.stroke();

    // detaily
    y += 110;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 64px Montserrat, Arial, sans-serif';
    ctx.fillText(fmtDateLong(m.date) + '  ·  ' + m.time, cx, y);

    y += 90;
    ctx.fillStyle = '#A9C4BC';
    ctx.font = '500 48px Montserrat, Arial, sans-serif';
    if (m.court) { ctx.fillText('📍 ' + m.court, cx, y); y += 80; }
    ctx.fillText('Úroveň: ' + m.level + '   •   ' + m.type, cx, y);

    // stav — velký blok
    y += 150;
    if (m.status === 'full' || m.needed === 0) {
      ctx.fillStyle = '#5dc98a';
      ctx.font = '800 90px Montserrat, Arial, sans-serif';
      ctx.fillText('PLNO ✅', cx, y);
    } else {
      ctx.fillStyle = '#ED1C24';
      ctx.font = '800 90px Montserrat, Arial, sans-serif';
      ctx.fillText('HLEDÁME ' + m.needed, cx, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 56px Montserrat, Arial, sans-serif';
      ctx.fillText(m.needed === 1 ? 'hráče' : 'hráče', cx, y + 70);
    }

    // poznámka
    if (m.note) {
      y += 200;
      ctx.fillStyle = '#A9C4BC';
      ctx.font = '400 40px Montserrat, Arial, sans-serif';
      wrapText(ctx, m.note, cx, y, W - cx * 2, 52);
    }

    // zakladatel dole
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 44px Montserrat, Arial, sans-serif';
    ctx.fillText('— ' + m.creator, cx, H - 90);

    return c.toDataURL('image/png');
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, y);
        line = w + ' ';
        y += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), x, y);
  }

  function downloadImage(m) {
    const url = buildImage(m);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hledam-hru-${m.date}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return { buildText, waLink, copyText, downloadImage };
})();
