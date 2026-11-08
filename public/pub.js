/* NovaGen — onglet Publicité : vidéo motion (canvas) + musique, aperçu et export (MediaRecorder). Tout se fait dans le navigateur. */
const AD_FMT = { '9:16': [1080, 1920, 'Vertical 9:16 · Reels, Stories, TikTok'], '1:1': [1080, 1080, 'Carré 1:1 · fil Facebook / Instagram'], '16:9': [1920, 1080, 'Horizontal 16:9 · YouTube, site'] };
const AD_STY = { 1: 'Dynamique', 2: 'Élégant', 3: 'Minimal' };
const adCache = new Map();
const adClamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const adOut = x => 1 - Math.pow(1 - adClamp(x), 3), adIO = x => (x = adClamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const adBack = x => { x = adClamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const adTxt = v => (v && typeof v === 'object' ? (v.fr || '') : String(v || '')).trim();

function adTexts(f) {
  const o = [], sl = adTxt(f.slogan), d = adTxt(f.descCourte);
  if (sl) o.push({ big: sl });
  if (d) o.push({ big: d.length > 78 ? d.slice(0, 75) + '…' : d });
  if (f.type === 'pro') { (f.services || []).map(adTxt).filter(Boolean).slice(0, 5).forEach(s => o.push({ big: s, tag: 'Nos prestations' })); return o; }
  const items = parseCarte(f.carteTxt).flatMap(c => c.items).filter(i => i.nom && i.prix), pick = [], step = Math.max(1, Math.floor(items.length / 4));
  for (let i = 0; i < items.length && pick.length < 4; i += step) pick.push(items[i]);
  pick.forEach(i => o.push({ big: i.nom, tag: 'À la carte' }));
  const sv = (f.services || []).map(adTxt).filter(Boolean).slice(0, 3); if (sv.length) o.push({ big: sv.join(' · ') });
  return o;
}

/* texte de voix off (à coller dans ElevenLabs) : phrases courtes, chiffres écrits pour être lus */
function adSpeak(t) { return String(t || '').replace(/(\d+)\s*[,.]\s*(\d+)\s*€/g, (m, a, b) => a + ' euros ' + (b.length === 1 ? b + '0' : b)).replace(/(\d+)\s*€/g, '$1 euros').replace(/&/g, ' et ').replace(/\s*·\s*/g, ', ').replace(/\s+/g, ' ').trim(); }
function adScript(f, dur) {
  const nom = f.nom || 'notre établissement', ville = f.ville || '', typ = f.type, max = Math.round((dur || 45) * 2.1), P = [];
  const sl = adSpeak(adTxt(f.slogan)), d = adSpeak(adTxt(f.descCourte)), L = s => { const x = String(s || '').replace(/[.!?…\s]+$/, ''); return x ? x + '.' : ''; };
  P.push(typ === 'hebergement' ? `Envie d'une vraie parenthèse${ville ? ' à ' + ville : ''} ?` : typ === 'commerce' ? `Vous connaissez ${nom} ?` : `Vous cherchez la bonne adresse${ville ? ' à ' + ville : ''} ?`);
  P.push(L(nom + (sl ? ', ' + sl.charAt(0).toLowerCase() + sl.slice(1) : d ? ', ' + d.charAt(0).toLowerCase() + d.slice(1) : '')));
  if (sl && d) P.push(L(d));
  if (typ === 'pro') { const sv = (f.services || []).map(adTxt).filter(Boolean).slice(0, 5).map(adSpeak), adr = adAdr(f), tel = String(f.tel || '').replace(/^\+33\s*/, '0').replace(/\s+/g, ' ').trim(), P2 = [`Vous cherchez un professionnel de confiance${ville ? ' à ' + ville : ''} ?`, L(nom + (sl ? ', ' + sl.charAt(0).toLowerCase() + sl.slice(1) : '')), d && L(d), sv.length && L('Nos prestations : ' + sv.join(', ')), tel && L('Contactez-nous au ' + tel), adr && L('Nous sommes à ' + adr.replace(/,?\s*\d{5}\s*/, ', ')), L(nom + (ville ? ', ' + ville : ''))].filter(Boolean); return P2.join('\n\n'); }
  const items = parseCarte(f.carteTxt).flatMap(c => c.items).filter(i => i.nom && i.prix), pick = [], step = Math.max(1, Math.floor(items.length / 3));
  for (let i = 0; i < items.length && pick.length < 3; i += step) pick.push(items[i]);
  if (pick.length) P.push(L('Au menu : ' + pick.map(i => adSpeak(i.nom)).join(', ')));
  const sv = (f.services || []).map(adTxt).filter(Boolean).slice(0, 3); if (sv.length) P.push(L(sv.map(adSpeak).join(', ')));
  const adr = adAdr(f), tel = String(f.tel || '').replace(/^\+33\s*/, '0').replace(/\s+/g, ' ').trim();
  P.push(L(`Venez nous voir${adr ? ' : ' + adr.replace(/,?\s*\d{5}\s*/, ', ') : ''}`));
  if (tel) P.push(L((typ === 'hebergement' ? 'Réservez au ' : 'Réservez votre table au ') + tel));
  P.push(L(nom + (ville ? ', ' + ville : '')));
  let out = P.filter(Boolean), words = x => x.join(' ').split(/\s+/).length;
  while (words(out) > max && out.length > 4) { const i = out.findIndex(x => /^Au menu|^Fait|,/.test(x) && x !== out[1] && x !== out[0]); out.splice(i > 0 && i < out.length - 3 ? i : 2, 1); }
  return out.join('\n\n');
}

async function adAssets(p) {
  const bm = async b => { try { return await createImageBitmap(b); } catch (e) { return null; } };
  const photos = (await Promise.all((p.photos || []).slice(0, 8).map(x => bm(x.blob)))).filter(Boolean), logo = p.logo ? await bm(p.logo) : null;
  return { photos, logo };
}

/* battements : pics d'énergie, pour caler les changements de photo sur le rythme */
function adBeats(buf, maxT) {
  if (!buf) return []; const d = buf.getChannelData(0), sr = buf.sampleRate, w = Math.floor(sr * .02), n = Math.min(Math.floor(d.length / w), Math.floor(maxT / .02)), e = [];
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < w; j += 4) { const v = d[i * w + j]; s += v * v; } e.push(Math.sqrt(s / (w / 4))); }
  const out = []; let last = -1;
  for (let i = 10; i < n; i++) { let m = 0; for (let k = i - 10; k < i; k++) m += e[k]; m /= 10; if (e[i] > m * 1.5 && e[i] > .04 && e[i] >= (e[i - 1] || 0) && i * .02 - last > .45) { out.push(i * .02); last = i * .02; } }
  return out;
}

function adPlan(f, A, D, beats, style) {
  const intro = adClamp(D * .12, 2.6, 4.2), outro = adClamp(D * .2, 4, 9), span = D - intro - outro, texts = adTexts(f);
  const nImg = A.photos.length, n = Math.max(1, Math.min(Math.max(nImg, Math.min(texts.length, 4)), Math.floor(span / 2.4), 9)), len = span / n, scenes = [];
  const snap = x => { let b = x, bd = .7; for (const t of beats) { const dd = Math.abs(t - x); if (dd < bd) { bd = dd; b = t; } } return b; };
  const cuts = [intro]; for (let i = 1; i < n; i++) cuts.push(snap(intro + i * len)); cuts.push(D - outro);
  for (let i = 0; i < n; i++) scenes.push({ a: cuts[i], b: cuts[i + 1], img: nImg ? A.photos[i % nImg] : null, text: texts[i] || null, i });
  return { D, intro, outro, scenes, style: +style || 1 };
}

function adWrap(c, text, maxW) { const w = String(text).split(/\s+/), L = []; let l = ''; for (const x of w) { const t = l ? l + ' ' + x : x; if (c.measureText(t).width > maxW && l) { L.push(l); l = x; } else l = t; } if (l) L.push(l); return L; }
function adAdr(f) { const a = String(f.adresse || '').trim(), v = String(f.ville || '').trim(); return a && v && a.toLowerCase().includes(v.toLowerCase()) ? a : [a, v].filter(Boolean).join(', '); }
function adCover(c, img, x, y, W, H, z, px, py) { const r = Math.max(W / img.width, H / img.height) * z, w = img.width * r, h = img.height * r; c.save(); c.beginPath(); c.rect(x, y, W, H); c.clip(); c.drawImage(img, x + (W - w) * px, y + (H - h) * py, w, h); c.restore(); }
function adRR(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }

function adFrame(c, W, H, t, P) {
  const { f, plan, A } = P, st = plan.style, u = Math.min(W, H) / 1080, portrait = H > W * 1.2, c1 = f.c1 || '#1b1b1f', c2 = f.c2 || '#c0504d', c3 = f.c3 || '#f3b63a';
  const FT = st === 2 ? '"Playfair Display",Georgia,serif' : st === 1 ? 'Montserrat,"Arial Black",Impact,sans-serif' : 'Montserrat,"Helvetica Neue",Arial,sans-serif', wt = st === 1 ? 900 : st === 2 ? 700 : 600;
  c.save(); c.fillStyle = st === 3 ? '#f6f3ee' : c1; c.fillRect(0, 0, W, H); c.textBaseline = 'alphabetic';
  const bgPhoto = (img, k, dark) => { if (img) adCover(c, img, 0, 0, W, H, 1.04 + .12 * k, .35 + .3 * k, .4); else { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.fillRect(0, 0, W, H); } c.fillStyle = `rgba(${dark})`; c.fillRect(0, 0, W, H); };
  const text = (s, x, y, size, color, al, alpha, w) => { c.save(); c.globalAlpha = alpha; c.fillStyle = color; c.textAlign = al || 'left'; c.font = `${wt} ${size}px ${FT}`; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = st === 3 ? 0 : 16 * u; const L = adWrap(c, st === 1 ? s.toUpperCase() : s, w || W * .84); L.forEach((l, i) => c.fillText(l, x, y + i * size * 1.12)); c.restore(); return L.length * size * 1.12; };
  if (t < plan.intro) {
    const k = t / plan.intro; bgPhoto(A.photos[0], k, st === 3 ? '246,243,238,.0' : '10,10,14,.62'); if (st === 3) { c.fillStyle = '#f6f3ee'; c.fillRect(0, 0, W, H); }
    const ink = st === 3 ? c1 : '#fff', cx = W / 2, cy = H * (portrait ? .42 : .4), R = 150 * u * adBack((t - .2) / .7);
    if (A.logo && R > 1) { c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 40 * u; c.fillStyle = f.logoLight ? c1 : '#fff'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.restore(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); const s = Math.min(R * 1.5 / A.logo.width, R * 1.5 / A.logo.height); { const L = A.logo, m = .035, sx = L.width * m, sy = L.height * m, sw = L.width - 2 * sx, sh = L.height - 2 * sy; c.drawImage(L, sx, sy, sw, sh, cx - sw * s / 2, cy - sh * s / 2, sw * s, sh * s); } c.restore(); }
    const ny = cy + (A.logo ? 150 * u + 120 * u : 0), a1 = adOut((t - .9) / .6); text(f.nom || '', cx, ny + (1 - a1) * 40 * u, (portrait ? 96 : 88) * u, ink, 'center', a1);
    c.save(); c.globalAlpha = adOut((t - 1.3) / .6); c.fillStyle = c3; c.fillRect(cx - 90 * u * adOut((t - 1.3) / .6), ny + 36 * u, 180 * u * adOut((t - 1.3) / .6), 5 * u); c.restore();
    const sl = adTxt(f.slogan); if (sl) text(sl, cx, ny + 100 * u, 42 * u, st === 3 ? c2 : c3, 'center', adOut((t - 1.6) / .6), W * .8);
  } else if (t >= plan.D - plan.outro) {
    const k = (t - (plan.D - plan.outro)) / plan.outro, last = A.photos[A.photos.length - 1];
    bgPhoto(last, k, st === 3 ? '246,243,238,.84' : '10,10,14,.66'); const ink = st === 3 ? c1 : '#fff', cx = W / 2, s0 = plan.D - plan.outro, y0 = H * (portrait ? .32 : .28);
    const A1 = adOut((t - s0 - .2) / .5); text(st === 2 ? 'À très bientôt' : f.type === 'pro' ? 'Contactez-nous' : 'Venez nous voir', cx, y0 + (1 - A1) * 30 * u, 44 * u, st === 3 ? c2 : c3, 'center', A1);
    const A2 = adOut((t - s0 - .6) / .6); const hh = text(f.nom || '', cx, y0 + 110 * u + (1 - A2) * 40 * u, (portrait ? 98 : 88) * u, ink, 'center', A2);
    const adr = adAdr(f), A3 = adOut((t - s0 - 1.1) / .6); if (adr) text(adr, cx, y0 + 110 * u + hh + 30 * u, 44 * u, ink, 'center', A3 * .92, W * .84);
    if (f.tel) { const A4 = adOut((t - s0 - 1.6) / .5), pulse = 1 + .03 * Math.sin(t * 6), bw = Math.min(W * .78, 760 * u), bh = 120 * u, by = H * (portrait ? .66 : .72); c.save(); c.globalAlpha = A4; c.translate(cx, by + bh / 2); c.scale(pulse, pulse); c.fillStyle = c2; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30 * u; adRR(c, -bw / 2, -bh / 2, bw, bh, bh / 2); c.fill(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `${wt} ${46 * u}px ${FT}`; c.fillText((f.type === 'hebergement' ? (f.type === 'pro' ? 'Contact · ' : 'Réservez · ') : (f.type === 'pro' ? 'Contact · ' : 'Réservez · ')) + f.tel, 0, 16 * u); c.restore(); }
    const h = (String(f.instagram || '').match(/instagram\.com\/([^/?#]+)/i) || [])[1]; if (h) text('@' + h, cx, H * (portrait ? .66 : .72) + 220 * u, 40 * u, ink, 'center', adOut((t - s0 - 2) / .5) * .85);
  } else {
    const sc = plan.scenes.find(s => t >= s.a && t < s.b) || plan.scenes[plan.scenes.length - 1], k = (t - sc.a) / (sc.b - sc.a), tin = t - sc.a, prev = plan.scenes[sc.i - 1];
    const z = st === 1 ? .22 : .1, px = sc.i % 2 ? .3 + .4 * k : .7 - .4 * k, drawImg = (s, kk, x, y, w, h, alpha) => { c.save(); c.globalAlpha = alpha; if (s.img) adCover(c, s.img, x, y, w, h, 1.03 + z * kk, px, .4 + .1 * kk); else { const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, c1); g.addColorStop(1, s.i % 2 ? c2 : c3); c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(x + w * (.2 + .6 * kk), y + h * .35, w * .35, 0, 7); c.fill(); } c.restore(); };
    let box = [0, 0, W, H], textY = H * (portrait ? .7 : .68), ink = '#fff';
    if (st === 3) { const m = W * .06; box = [m, m, W - 2 * m, H * (portrait ? .66 : .74)]; textY = box[1] + box[3] + 100 * u; ink = c1; }
    c.save(); if (st === 3) { adRR(c, box[0], box[1], box[2], box[3], 28 * u); c.clip(); }
    if (st === 2 && prev && tin < .9) drawImg(prev, 1, ...box, 1);
    if (st === 3 && prev && tin < .55) drawImg(prev, 1, ...box, 1);
    const slide = st === 3 ? adOut(tin / .55) : 1, fade = st === 2 ? adOut(tin / .9) : 1;
    c.save(); if (st === 3 && prev) c.translate((1 - slide) * box[2], 0); c.globalAlpha = 1; drawImg(sc, k, ...box, st === 2 && prev ? fade : 1); c.restore(); c.restore();
    if (st === 1) { const fl = 1 - adClamp(tin / .14); if (fl > 0) { c.fillStyle = `rgba(255,255,255,${fl * .6})`; c.fillRect(0, 0, W, H); } }
    if (st !== 3) { const g = c.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (sc.text) {
      const a = adOut((tin - .25) / .5) * (1 - adOut((tin - (sc.b - sc.a - .3)) / .3)), x = st === 3 ? W / 2 : W * .08, al = st === 3 ? 'center' : 'left', dy = (1 - adOut((tin - .25) / .5)) * 50 * u, size = (sc.text.small ? 84 : 66) * u;
      if (st === 1 && a > 0) { c.save(); c.globalAlpha = a; c.fillStyle = c2; c.fillRect(x - 24 * u, textY - size - 26 * u + dy, 14 * u, size * 1.3 + (sc.text.small ? 90 * u : 20 * u)); c.restore(); }
      if (st === 2 && a > 0) { c.save(); c.globalAlpha = a; c.fillStyle = c3; c.fillRect(x, textY - size - 36 * u + dy, 120 * u * a, 4 * u); c.restore(); }
      if (sc.text.tag && st !== 3) text(sc.text.tag, x, textY - size - 52 * u + dy, 34 * u, c3, al, a * .95);
      const hh = text(sc.text.big, x, textY + dy, size, ink, al, a, st === 3 ? W * .8 : W * .82);
      if (sc.text.small) text(sc.text.small, x, textY + dy + hh + 10 * u, 62 * u, st === 3 ? c2 : c3, al, a);
    }
    if (st === 1) { c.fillStyle = c2; c.fillRect(0, H - 14 * u, W * ((t - plan.intro) / (plan.D - plan.intro - plan.outro)), 14 * u); }
  }
  c.restore();
}

/* lecture / enregistrement */
async function adRun(cv, P, rec, onTick) {
  const { plan, music } = P, W = cv.width, H = cv.height, c = cv.getContext('2d'), ac = new (window.AudioContext || window.webkitAudioContext)();
  try { await ac.resume(); } catch (e) { }
  let src = null, dest = null, recorder = null, chunks = [], mime = '';
  const gain = ac.createGain(); gain.gain.value = 0;
  if (music) { src = ac.createBufferSource(); src.buffer = music; src.loop = true; src.connect(gain); gain.connect(ac.destination); if (rec) { dest = ac.createMediaStreamDestination(); gain.connect(dest); } }
  const t0 = ac.currentTime + .15;
  if (music) { gain.gain.setValueAtTime(0, t0); gain.gain.linearRampToValueAtTime(1, t0 + .6); gain.gain.setValueAtTime(1, t0 + plan.D - 1.6); gain.gain.linearRampToValueAtTime(0, t0 + plan.D); src.start(t0, P.offset || 0); }
  if (rec) {
    const stream = cv.captureStream(30); if (dest) dest.stream.getAudioTracks().forEach(x => stream.addTrack(x));
    mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 10e6, audioBitsPerSecond: 192e3 } : {}); recorder.ondataavailable = e => e.data.size && chunks.push(e.data); recorder.start(500);
  }
  let stopped = false; const h = { stop: () => { stopped = true; } };
  const done = new Promise(res => {
    const loop = () => {
      const t = Math.max(0, ac.currentTime - t0);
      if (stopped || t >= plan.D) {
        if (src) { try { src.stop(); } catch (e) { } }
        const fin = () => { ac.close().catch(() => { }); res(rec ? { blob: new Blob(chunks, { type: (mime || 'video/webm').split(';')[0] }), ok: !stopped } : null); };
        if (recorder && recorder.state !== 'inactive') { recorder.onstop = fin; recorder.stop(); } else fin(); return;
      }
      adFrame(c, W, H, t, P); onTick && onTick(t, plan.D); requestAnimationFrame(loop);
    }; requestAnimationFrame(loop);
  });
  h.done = done; return h;
}

/* interface */
async function adPrepare(p, cvW, cvH) {
  const f = p.fiche, ad = p.ad || {}, [W, H] = AD_FMT[ad.fmt || '9:16'], A = await adAssets(p); let music = null, beats = [];
  if (p.adMusic && p.adMusic.blob) { const key = p.id + '|' + p.adMusic.blob.size + '|' + p.adMusic.name, hit = adCache.get(p.id); if (hit && hit.key === key) music = hit.buf; else { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); music = await ac.decodeAudioData(await p.adMusic.blob.arrayBuffer()); ac.close(); adCache.set(p.id, { key, buf: music }); } catch (e) { music = null; } } }
  const dur = Math.min(+ad.dur || 45, 45), off = Math.max(0, +ad.offset || 0), D = dur;
  if (music) { const sr = music.sampleRate, from = Math.floor(off * sr), tmp = { getChannelData: () => music.getChannelData(0).subarray(from), sampleRate: sr }; beats = adBeats(tmp, D + 1); }
  const plan = adPlan(f, A, D, beats, ad.style || 1);
  return { f, plan, A, music, offset: off, W, H, beats };
}

function bindAd() {
  const cv = $('#adf'); if (!cv || !cur) return; const ad = cur.ad = cur.ad || { style: '1', fmt: '9:16', dur: 45, offset: 0 };
  const st = t => { ['#adst', '#adst2'].forEach(s => { const e = $(s); if (e) e.textContent = t; }); }, nm = () => { $('#admn').textContent = cur.adMusic ? '🎵 ' + cur.adMusic.name : 'Aucune musique choisie.'; };
  [['#adf', 'fmt'], ['#add', 'dur'], ['#ads', 'style'], ['#ado', 'offset']].forEach(([id, k]) => { const e = $(id); e.value = ad[k]; e.onchange = () => { ad[k] = e.value; save(); }; });
  nm(); $('#adm').onclick = () => $('#admf').click();
  $('#admf').onchange = () => { const x = $('#admf').files[0]; if (!x) return; cur.adMusic = { blob: x, name: x.name }; adCache.delete(cur.id); save(); nm(); chk(); };
  $('#admx').onclick = () => { cur.adMusic = null; adCache.delete(cur.id); save(); nm(); chk(); };
  const chk = () => { const el = $('#adchk'); if (!el) return; const f = cur.fiche || {}, np = (cur.photos || []).length, nc = (parseCarte(f.carteTxt) || []).reduce((n, c) => n + c.items.length, 0), L = [[np >= 5, np + ' photo' + (np > 1 ? 's' : ''), np < 5 ? 'idéal : 6 à 12, variées (plat, terrasse, salle, équipe)' : ''], [!!cur.logo, 'Logo', ''], [!!cur.adMusic, 'Musique', 'sinon vidéo muette'], [!!cur.adVoice, 'Voix off', 'facultatif : génère le texte, fais-le lire par ElevenLabs, importe le MP3'], [!!(f.slogan || f.descCourte || f.description), 'Accroche / description', ''], [!!(f.adresse && f.tel), 'Adresse + téléphone', 'pour la fin de la vidéo'], [f.type === 'pro' ? (f.services || []).length > 0 : nc > 0 || f.type === 'hebergement', f.type === 'pro' ? (f.services || []).length + ' prestations' : f.type === 'hebergement' ? 'Hébergement' : nc + ' plats', '']]; el.innerHTML = L.map(([ok, t, h]) => `<span class="chip ${ok ? 'ok' : 'ko'}" title="${h}">${ok ? '✔' : '○'} ${t}${!ok && h ? ' — <i>' + h + '</i>' : ''}</span>`).join(''); };
  chk(); if ($('#adnote')) { $('#adnote').value = ad.note || ''; $('#adnote').oninput = () => { ad.note = $('#adnote').value; save(); }; }
  const mkKit = async () => { const s2 = $('#adst2'); st('Préparation du dossier…'); const k = await adKit(cur), a = document.createElement('a'); a.href = URL.createObjectURL(k.blob); a.download = 'Dossier_pub_' + (cur.fiche.nom || 'etablissement').replace(/[^\w-]+/g, '_') + '.zip'; document.body.appendChild(a); a.click(); a.remove(); let m; try { await navigator.clipboard.writeText(k.prompt); m = '✔ ZIP téléchargé et message copié. Ouvre Claude, dépose le ZIP, colle le message (Cmd+V).'; } catch (e) { m = '✔ ZIP téléchargé. Dépose-le dans Claude avec : ' + k.prompt; } st(m); if (s2) s2.textContent = m; };

  { const sc = $('#adscript'), cnt = () => { const w = (sc.value.trim().match(/\S+/g) || []).length; $('#adwc').textContent = w ? '≈ ' + w + ' mots · ' + Math.round(w / 2.4) + ' s de voix' : ''; };
    sc.value = ad.script || ''; cnt(); sc.oninput = () => { ad.script = sc.value; cnt(); save(); };
    { const sel = $('#elv'), els = t => { $('#els').textContent = t; };
      const fill = vs => { sel.innerHTML = '<option value="">— choisis une voix —</option>' + vs.map(v => `<option value="${v.id}">${esc(v.name)}${v.cat === 'cloned' || v.cat === 'professional' ? ' ★' : ''}</option>`).join(''); const last = ad.voiceId || localStorage.getItem('ng_el_voice') || ''; if (last) sel.value = last; };
      try { const c = JSON.parse(localStorage.getItem('ng_el_voices') || '[]'); if (c.length) fill(c); } catch (e) { }
      const load = async () => { els('Chargement des voix…'); try { const r = await api('/api/tts', { mode: 'voices' }); localStorage.setItem('ng_el_voices', JSON.stringify(r.voices)); fill(r.voices); els(r.voices.length + ' voix'); } catch (e) { els('⚠ ' + e.message); } };
      const kb = $('#elkb'), ki = $('#elki'); ki.value = localStorage.getItem('ng_el_key') || ''; $('#elk').textContent = localStorage.getItem('ng_el_key') ? '🔑 ✔' : '🔑';
      $('#elk').onclick = () => { kb.style.display = kb.style.display === 'none' ? 'block' : 'none'; };
      $('#elks').onclick = async () => { const v = ki.value.trim(); if (!v) { els('Colle ta clé.'); return; } localStorage.setItem('ng_el_key', v); $('#elk').textContent = '🔑 ✔'; await load(); if (sel.options.length > 1) kb.style.display = 'none'; };
      $('#elvs').onclick = () => { const v = $('#elvi').value.trim(); if (!/^[A-Za-z0-9]{8,40}$/.test(v)) { els('ID de voix invalide.'); return; } const ex = [...sel.options].find(o => o.value === v); if (!ex) { const op = document.createElement('option'); op.value = v; op.textContent = 'Voix ' + v.slice(0, 6) + '… (ID collé)'; sel.appendChild(op); } sel.value = v; ad.voiceId = v; localStorage.setItem('ng_el_voice', v); try { const c = JSON.parse(localStorage.getItem('ng_el_voices') || '[]'); if (!c.some(x => x.id === v)) { c.push({ id: v, name: 'Voix ' + v.slice(0, 6) + '… (ID collé)', cat: '' }); localStorage.setItem('ng_el_voices', JSON.stringify(c)); } } catch (e) { } save(); els('✔ Voix sélectionnée : tu peux générer.'); };
      $('#elkx').onclick = () => { localStorage.removeItem('ng_el_key'); ki.value = ''; $('#elk').textContent = '🔑'; els('Clé oubliée.'); };
      if (!localStorage.getItem('ng_el_key')) api('/api/tts', { mode: 'status' }).then(r => { if (!r.configured) { kb.style.display = 'block'; els('Colle ta clé API pour activer.'); } }).catch(() => { });
      $('#elr').onclick = load; sel.onchange = () => { ad.voiceId = sel.value; localStorage.setItem('ng_el_voice', sel.value); save(); };
      $('#elg').onclick = async () => { const t = sc.value.trim(); if (!t) { els('Écris ou génère d\'abord le texte ci-dessus.'); return; } if (!sel.value) { if (sel.options.length < 2) await load(); if (!sel.value) { els('Choisis une voix.'); return; } }
        const btn = $('#elg'); btn.disabled = true; els('🎙 Génération… (' + Math.round((t.match(/\S+/g) || []).length / 2.3) + ' s de voix environ)');
        try { const bl = await api('/api/tts', { mode: 'speak', text: t, voice: sel.value }, true), nm = 'voix_' + (sel.options[sel.selectedIndex].text.replace(/[^\w-]+/g, '_').replace(/_+$/, '')) + '_' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '.mp3';
          cur.adVoice = { blob: new Blob([bl], { type: 'audio/mpeg' }), name: nm }; save(); vn(); chk(); let d = ''; try { const ac = new (window.AudioContext || window.webkitAudioContext)(), b2 = await ac.decodeAudioData(await bl.arrayBuffer()); d = ' · ' + b2.duration.toFixed(1) + ' s'; ac.close(); } catch (e) { }
          els('✔ Voix générée et importée' + d); const au = document.createElement('audio'); au.controls = true; au.src = URL.createObjectURL(bl); au.style.cssText = 'width:100%;margin-top:6px'; const old = $('#elau'); if (old) old.remove(); au.id = 'elau'; btn.closest('.row').after(au);
        } catch (e) { els('⚠ ' + e.message); } btn.disabled = false; }; }
    $('#adgen').onclick = () => { sc.value = ad.script = adScript(cur.fiche || {}, +ad.dur || 45); cnt(); save(); };
    $('#adcp').onclick = async () => { try { await navigator.clipboard.writeText(sc.value); $('#adwc').textContent = '✔ Texte copié : colle-le dans ElevenLabs'; } catch (e) { sc.select(); } };
    const vn = () => { $('#advn').textContent = cur.adVoice ? '🎙 ' + cur.adVoice.name : 'Aucune voix importée.'; };
    vn(); $('#advb').onclick = () => $('#advf').click(); $('#advf').onchange = () => { const x = $('#advf').files[0]; if (!x) return; cur.adVoice = { blob: x, name: x.name }; save(); vn(); chk(); };
    $('#advx').onclick = () => { cur.adVoice = null; save(); vn(); chk(); }; }
  if ($('#adkit2')) $('#adkit2').onclick = mkKit;
  if ($('#adkit')) $('#adkit').onclick = mkKit;
  bindVids();
}

/* dossier pour Claude : prompt complet + photos + logo + données, à déposer dans une conversation */
async function adKit(p) {
  const f = p.fiche, ad = p.ad || {}, fmt = ad.fmt || '9:16', [W, H, fl] = AD_FMT[fmt], dur = Math.min(+ad.dur || 45, 45), sty = AD_STY[ad.style || 1];
  const zip = new JSZip(), tx = adTexts(f), cats = parseCarte(f.carteTxt), ph = (p.photos || []).slice(0, 12);
  ph.forEach((x, i) => zip.file(`photos/${String(i + 1).padStart(2, '0')}.jpg`, x.blob));
  if (p.logo) zip.file('logo.png', p.logo);
  if (p.adMusic && p.adMusic.blob) zip.file('musique/' + p.adMusic.name.replace(/[^\w.-]+/g, '_'), p.adMusic.blob);
  const styD = { 1: 'Dynamique : coupes rythmées sur les temps forts, zooms rapides, flash blanc à chaque changement, titres en capitales grasses avec une barre de couleur, barre de progression.', 2: 'Élégant : fondus enchaînés lents, Ken Burns doux, titres en serif avec un filet doré, ambiance haut de gamme.', 3: 'Minimal : fond clair, photos encadrées aux coins arrondis qui glissent, légendes sobres en dessous, beaucoup d\'air.' }[ad.style || 1];
  let bts = [], mdur = 0; if (p.adMusic && p.adMusic.blob) { try { const ac = new (window.AudioContext || window.webkitAudioContext)(), mu = await ac.decodeAudioData(await p.adMusic.blob.arrayBuffer()); ac.close(); mdur = mu.duration; const off0 = Math.max(0, +ad.offset || 0), sr = mu.sampleRate; bts = adBeats({ getChannelData: () => mu.getChannelData(0).subarray(Math.floor(off0 * sr)), sampleRate: sr }, dur + 1).map(x => +x.toFixed(2)); } catch (e) { } }
  let vdur = 0; if (p.adVoice && p.adVoice.blob) { zip.file('voix/' + p.adVoice.name.replace(/[^\w.-]+/g, '_'), p.adVoice.blob); try { const ac = new (window.AudioContext || window.webkitAudioContext)(); vdur = (await ac.decodeAudioData(await p.adVoice.blob.arrayBuffer())).duration; ac.close(); } catch (e) { } }
  const adr = adAdr(f), ig = (String(f.instagram || '').match(/instagram\.com\/([^/?#]+)/i) || [])[1];
  const plats = cats.flatMap(c => c.items.filter(i => i.prix).map(i => `- ${i.nom}`)).slice(0, 12);
  const md = `# Brief vidéo publicitaire — ${f.nom}

## Ce que je te demande
Tu es monteur motion design. Avec les fichiers de ce dossier, **réalise une vidéo publicitaire de ${dur} secondes maximum**, au format **${fmt} (${W}×${H}, ${fl})**, en **MP4 H.264 + AAC**, 30 images/seconde.

## Style : ${sty}
${styD}

## Musique
${p.adMusic ? `Utilise le fichier du dossier « musique/ ». Coupe-le à ${dur} s maximum, fondu d'entrée 0,6 s et fondu de sortie 1,6 s. Cale les changements de photo sur les temps forts.` : 'Je joins la musique dans la conversation. Utilise-la : coupe à ' + dur + ' s maximum, fondu d\'entrée 0,6 s et de sortie 1,6 s, changements de photo sur les temps forts.'}

## Structure
1. **Intro (≈ ${Math.round(Math.min(4.2, Math.max(2.6, dur * .12)))} s)** : logo (logo.png) qui apparaît en rond blanc, puis le nom « ${f.nom} »${adTxt(f.slogan) ? ` et l'accroche « ${adTxt(f.slogan)} »` : ''}.
2. **Scènes photos** : toutes les photos du dossier « photos/ » dans l'ordre, en mouvement lent (Ken Burns), avec par-dessus ces textes (un par scène, dans l'ordre). Compte environ 3 secondes par scène : garde les premiers textes si la durée est courte :
${tx.map((t, i) => `   - Scène ${i + 1} : ${t.tag ? t.tag + ' — ' : ''}${t.big}${t.small ? ' — ' + t.small : ''}`).join('\n') || '   - (aucun texte : photos seules)'}
3. **Fin (≈ ${Math.round(Math.min(9, Math.max(4, dur * .2)))} s)** : « ${f.type === 'pro' ? 'Contactez-nous' : 'Venez nous voir'} », nom, adresse, bouton « ${f.type === 'pro' ? 'Contact' : 'Réservez'} · ${f.tel || ''} »${ig ? `, compte @${ig}` : ''}.

## Charte
- Couleur sombre : ${f.c1 || ''} · Accent : ${f.c2 || ''} · Or / survol : ${f.c3 || ''}
- Titres : ${ad.style == 2 ? 'serif élégant (Playfair Display)' : 'sans-serif gras (Montserrat)'}

## Données de l'établissement (à utiliser telles quelles, sans rien inventer)
- Nom : ${f.nom}
- Adresse : ${adr || '—'}
- Téléphone : ${f.tel || '—'}
- Site : ${f.site || '—'} · Instagram : ${f.instagram || '—'} · Facebook : ${f.facebook || '—'}
- Description : ${adTxt(f.descCourte) || adTxt(f.description) || '—'}
${plats.length ? '\n### Plats (sans les prix)\n' + plats.join('\n') : ''}

## Livraison
1. Montre-moi d'abord une image d'aperçu de 3 moments de la vidéo (intro, scène, fin).
2. Après mon accord, génère le MP4 et envoie-le-moi comme fichier.
3. Si une photo est floue, trop sombre ou coupée, dis-le-moi au lieu de l'utiliser telle quelle.
`;

  const typ = f.type === 'hebergement' ? 'hébergement' : f.type === 'commerce' ? 'commerce' : f.type === 'pro' ? 'professionnel' : 'restaurant / bar', isPro = typ === 'professionnel', cta = isPro ? 'Contact' : 'Réservez';
  const SHOTS = { 'professionnel': ['portrait du dirigeant ou de l\'équipe (visage, sourire, regard caméra)', 'le professionnel en action (sur le terrain, au bureau, avec un client)', 'les outils / le matériel / un document ou résultat concret', 'le lieu (bureau, façade, enseigne) pour ancrer localement', 'un détail qui inspire confiance (certification, label, avis client si fourni)'], 'restaurant / bar': ['plat signature en gros plan (vapeur, texture, sauce qui coule)', 'terrasse ou façade (donne l\'ambiance et le lieu)', 'salle intérieure / comptoir / cuisine en action', 'boisson ou dessert', 'équipe ou patron souriant (humain)'], 'hébergement': ['façade ou vue d\'ensemble (on comprend tout de suite : gîte, camping, hôtel)', 'chambre / lit', 'salle de bain ou cuisine', 'piscine / terrasse / extérieur / vue', 'petit détail déco ou petit-déjeuner'], 'commerce': ['devanture', 'produit phare en gros plan', 'intérieur / rayons', 'artisan ou vendeur en action', 'détail produit'] }[typ];
  const pm = `# PROMPT — Vidéo publicitaire « ${f.nom} »
> À lire en entier avant de commencer. Dossier joint : photos/, logo.png, musique/, voix/ (si fournie), reference/ (vidéo modèle, storyboard, logo NovaVisio), fiche.json, beats.json, LIRE-MOI_brief.md (données et textes).

## 0. Ta mission
Tu es **monteur motion designer de haut niveau** (niveau grandes chaînes YouTube / Reels / TikTok qui font des millions de vues). Réalise une publicité **${dur} s maximum**, **${fmt} (${W}×${H})**, **MP4 H.264 + AAC, 30 i/s**, pour **${f.nom}** (${typ}${f.ville ? ', ' + f.ville : ''}). Ce n'est pas un diaporama : c'est un **montage nerveux, très calé sur la musique, avec des animations de texte, des transitions « clic » et du sound design**.

## 0 bis. VIDÉO DE RÉFÉRENCE À REPRODUIRE (dossier reference/)
Dans **reference/reference_pub.mp4** (et reference/storyboard.jpg, 1 image par seconde) se trouve la pub NovaVisio qui fixe **le niveau et le style attendus**. **Regarde le storyboard avant tout** et reprends son langage, adapté à ${f.nom} :
- **Hook paradoxal en 2 temps** (0–2 s) : un téléphone / cadre blanc arrondi avec ombre qui contient la photo, et le texte « Ceci » puis « Ceci n'est pas une photo. » → ici, trouve un hook du même type, une phrase courte qui intrigue, adaptée à ${typ} (ex. : « Ceci n'est pas une carte postale. », « Ce plat existe vraiment. », « Vous y êtes déjà. »). Un cercle-curseur tactile apparaît et le contenu **bouge** (la photo avance, glisse, réagit au toucher).
- **Titre qui se construit mot par mot** (« La visite » → « La visite 360° » → « La visite 360° de votre logement » → « … réalisée par ») : à chaque temps fort, **un mot de plus** apparaît, le mot-clé passe en **couleur d'accent**. Jamais un titre complet d'un coup.
- **Fausse interface** : pastille d'en-tête (« VISITE 360° »), onglets pilules (Regarder / Se déplacer / S'informer) où l'onglet actif s'allume, bouton rond de navigation en bas, curseur tactile qui clique. Pour ${f.nom}, recrée la même idée avec ses vraies photos et ses vraies informations (carte, horaires, réservation).
- **Fiche info qui s'ouvre** (panneau sombre, titre doré, photo du produit qui apparaît) pour montrer les détails d'un élément (plat, équipement, chambre).
- **Séquence explicative en 3 étapes** (« Comment ça marche ? ») : stepper 1-2-3 avec ronds qui se remplissent, une carte par étape (avec photo ou illustration), légende qui change à chaque étape. Pour ${f.nom} : adapte (ex. Choisir → Venir / Réserver → Savourer / Profiter) sans rien inventer.
- **Chiffre-clé qui compte** (« 00 » → « 72 h ») : si une donnée forte existe dans les données (prix, délai, nombre de couverts, note), anime-la en compteur.
- **Alternance** de séquences **fond clair** (blanc/menthe très pâle, texte bleu foncé) et de séquences **fond sombre** (dégradé vert-bleu profond) pour relancer l'attention ; le final est sombre.
- **Fin** : logo animé (rond qui apparaît), nom, slogan avec un mot en couleur, « Rendez-vous sur », **bouton blanc dans lequel l'adresse web se tape lettre par lettre**, puis reste fixe 2 s.
- Rythme de la référence : **34 s**, changement d'écran toutes les 1 à 3 s, **un seul message par écran**, textes ≤ 6 mots, typographie sans-serif géométrique très lisible, animation d'entrée **lisse (ease-out) avec léger rebond**.
Tu **n'as pas à copier** les textes de NovaVisio : ce sont des **mécaniques d'animation** à transposer à ${f.nom}.

## 0 ter. STRUCTURE EN 3 ACTES (obligatoire, niveau grand designer motion)
1. **ACTE 1 — HOOK ACCROCHEUR D'ENTRÉE (0 → 5 s)** : 2 à 3 plans très courts (1 à 2 s) qui montrent le problème / l'envie, chacun avec un mot-choc ou une question. Le spectateur doit être happé dès la première image et comprendre le sujet en moins de 2 s.
2. **ACTE 2 — NOTRE SOLUTION (≈ 5 → 80 % de la durée)** : on présente **la solution apportée par ${f.nom}** (ses prestations / sa carte / ses atouts réels), un message par écran, avec des animations propres (texte mot par mot, cartes qui glissent, compteurs, pictos).
3. **ACTE 3 — NOTRE CONTACT (dernières secondes)** : nom, adresse, **téléphone**, site / réseaux sociaux, bouton « ${cta} », curseur de souris qui pointe et clique sur le bouton, puis signature NovaVisio.
Le montage doit être digne d'un **grand motion designer** : hiérarchie typographique forte, grille propre, transitions maîtrisées, rythme tenu du début à la fin.

## 1. Le hook (0 → 2,5 s) — c'est 80 % du résultat
- Ouvre **directement sur la meilleure image** (la plus appétissante / la plus spectaculaire), en gros plan, **sans logo, sans fondu**.
- Un **mot-choc ou une question** en gros (≤ 4 mots) qui dit le genre d'établissement ET donne envie. Ex. : ${isPro ? '« BESOIN D\'UN PRO À ' + (f.ville || 'VOTRE VILLE').toUpperCase() + ' ? » ou une question sur le problème que le client rencontre (à tirer des prestations, sans rien inventer)' : typ === 'restaurant / bar' ? '« ON A TROUVÉ LA PÉPITE DE ' + (f.ville || 'LA VILLE').toUpperCase() + ' »' : typ === 'hébergement' ? '« VOTRE ÉVASION COMMENCE ICI »' : '« À DÉCOUVRIR ABSOLUMENT »'} (adapte-le aux données réelles, n'invente rien).
- Premier mouvement dès la **première image** (zoom punch-in rapide, shake léger), **impact sonore** (whoosh + hit) calé sur le premier temps fort.
- Le spectateur doit comprendre en **moins de 2 secondes** à quel type de lieu il a affaire.

## 2. Choix des photos — sois précis et cohérent
1. **Regarde chaque photo** du dossier et classe-la (plat, boisson, terrasse, façade, intérieur, équipe, détail, vue…).
2. **Le texte et le type de photo doivent correspondre** : une scène « Terrasse » = une photo de terrasse ; « Notre plat » = une photo de ce plat ; jamais une photo au hasard. Si le nom d'un plat est cité, utilise la photo de ce plat si tu peux l'identifier, sinon un titre générique (« Fait maison »).
3. Ordre conseillé pour ce genre d'établissement (${typ}) : ${SHOTS.map((x, i) => (i + 1) + '. ' + x).join(' ; ')}.
4. **Cadre pour mobile (9:16)** : recadre sur le sujet (pas sur le vide), garde le texte hors du sujet. Jamais d'étirement.
5. **Signale-moi** toute photo floue, sombre, mal cadrée ou hors sujet, et indique ce qui manque (ex. « pas de photo de terrasse »). Ne l'utilise pas telle quelle.
${isPro ? `## 2 bis. SPÉCIFICITÉ « PROFESSIONNEL / SERVICE » (pas de lieu à visiter, pas de plats)
- Le but : **inspirer confiance et donner envie d'appeler**. Structure conseillée : **problème du client → solution → preuve → contact**.
- Mets en scène les **prestations** (voir les textes) avec des icônes animées et des mots-clés qui claquent, pas des prix.
- Montre les **humains** (dirigeant, équipe) dès que possible : c'est ce qui rassure. Si les photos sont des logos ou des visuels génériques, dis-le et propose des plans en **typographie animée**.
- **Réseaux sociaux** : ${[f.instagram && 'Instagram ' + f.instagram, f.facebook && 'Facebook ' + f.facebook, f.site && 'site ' + f.site].filter(Boolean).join(' · ') || 'aucun fourni'}. Affiche des pastilles animées (icône ronde + @compte) à la fin, sans inventer de compte.
- Pas de chiffres, certifications, années d'expérience ou avis qui ne figurent pas dans les données.
` : ''}
## 3. Rythme et synchro musique
- Utilise **musique/** : coupe à ${dur} s max, fondu d'entrée 0,6 s, fondu de sortie 1,6 s.
- **beats.json** donne les temps forts (en secondes, depuis le début de la vidéo). **Chaque changement de plan tombe sur un temps fort.** Plans courts au début (1 à 1,5 s), un peu plus longs au milieu (2 à 3 s), accélération avant la fin.
${bts.length ? '- Temps forts détectés (s) : ' + bts.slice(0, 40).join(', ') + (bts.length > 40 ? '…' : '') : '- (Pas de musique jointe : cale-toi sur ton propre tempo, ~120 BPM.)'}
- Une **accroche visuelle sur chaque temps fort important** (flash, zoom, tremblement, mot qui claque).

## 4. Animations attendues (style ${sty})
${styD}
Dans tous les cas :
- **Texte cinétique** : mots qui entrent un par un (masque, glissé, « pop » avec léger rebond), jamais un bloc qui apparaît d'un coup. Mot clé en couleur d'accent.
- **Mouvements de caméra** sur chaque photo : punch-in, push lent, léger pan ; alterne les directions. Pas de plan statique.
- **Transitions « clic »** : whip-pan avec flou de mouvement, flash blanc, glitch court, wipe en forme de logo ou de forme géométrique, zoom-through. 2 à 3 types seulement, utilisés avec constance.
- **Éléments graphiques** : barres, soulignements qui se dessinent, étiquettes de prix qui « claquent », sticker « fait maison / nouveau » si les données le disent, barre de progression fine.
- **Logo** : apparition animée (scale + léger rebond) au début ou à la fin, pas les deux en gros.

## 5. Sound design (très important)
Ajoute par-dessus la musique, **discret mais présent** (−12 à −18 dB sous la musique) :
- **whoosh** sur chaque transition, **hit / impact** sur le hook et sur le titre final,
- **pop / clic** sur les mots et prix qui apparaissent, **riser** de 1 s avant le mot de fin,
- Si tu n'as pas de banque sonore, **synthétise-les** (bruit filtré + enveloppe pour les whoosh, sinus court pour les clics) avec ffmpeg ou Python. La musique reste dominante ; baisse-la de 3 dB pendant l'impact final.

${p.adVoice ? `## 5 bis. VOIX OFF (fichier voix/${p.adVoice.name.replace(/[^\w.-]+/g, '_')}${vdur ? ', durée ' + vdur.toFixed(1) + ' s' : ''})
- La voix est **le fil conducteur** : monte les images **sur ce que dit la voix** (le texte exact est dans voix/texte_voix_off.txt). Quand la voix cite un plat, montre la photo de ce plat ; quand elle cite l'adresse, montre la devanture ou la terrasse.
- Repère le début de chaque phrase dans l'audio (ffmpeg silencedetect, ou transcription avec horodatage) et fais tomber les **changements de plan, mots-clés à l'écran et impacts** sur ces débuts de phrase.
- **Mixage** : musique à −14 dB sous la voix pendant qu'elle parle, remontée à plein niveau dans les silences et sur le hook ; voix à −3 dB, légèrement compressée. Sous-titres animés mot par mot synchronisés sur la voix (gros, en bas, hors zone d'interface).
${vdur > dur ? '- ⚠️ La voix dure plus que la vidéo (' + vdur.toFixed(1) + ' s pour ' + dur + ' s) : accélère légèrement la voix (+5 %) ou coupe la fin du texte, et dis-le-moi.' : ''}
` : ad.script && ad.script.trim() ? `## 5 bis. VOIX OFF (prévue, fichier pas encore fourni)
Le texte prévu est dans voix/texte_voix_off.txt. Prévois les emplacements dans le montage et dis-moi quand tu attends le fichier audio ; ne génère pas de voix toi-même.
` : ''}
## 6. Textes de la vidéo (à utiliser tels quels, rien d'inventé)
${tx.map((t, i) => `- Scène ${i + 1} : ${t.tag ? t.tag + ' — ' : ''}${t.big}${t.small ? ' — ' + t.small : ''}`).join('\n') || '- (aucun)'}
Les textes sont des **suggestions de contenu** : tu peux les raccourcir et les rythmer (max 6 mots par écran), mais ne change pas les prix, noms et coordonnées.

## 7. Fin (dernières ${Math.round(Math.min(9, Math.max(4, dur * .2)))} s)
Image forte + « ${isPro ? 'Contactez-nous' : 'Venez nous voir'} » + **${f.nom}** + adresse (${adr || '—'}) + bouton animé **« ${cta} · ${f.tel || '—'} »**${ig ? ' + @' + ig : ''}. Reste lisible **3 secondes minimum**. Dernier temps fort = impact sonore + logo.

## 7 bis. SIGNATURE OBLIGATOIRE — « Publicité créée par NovaVisio »
En **tout bas de l'écran de fin** (zone 1 780–1 840 px en 9:16, sous le bouton et l'adresse), ajoute la ligne **« Publicité créée par » + le logo rond NovaVisio (reference/logo_novavisio.png, ≈ 55 px) + « NovaVisio »**, discrète mais lisible (texte crème, « NovaVisio » en blanc gras), qui apparaît en fondu 1,5 s avant la fin et reste jusqu'au dernier plan. Ne la mets ni au début ni au milieu de la vidéo.

## 7 ter. PAS DE PRIX\nN'affiche et ne prononce **aucun prix** dans la vidéo (ni étiquette, ni badge, ni « à 9,90 € »). Cite les plats par leur nom seulement.\n\n## 7 quater. NETTETÉ ET SOBRIÉTÉ (retours clients)
- **Textes 100 % nets** : pas de flou, pas de doublon ni d'ombre décalée, pas de trame fantôme derrière les lettres. Ombre douce uniquement sur les textes posés sur photo.
- **Aucun tremblement** : pas de shake de caméra ni de pulsation de l'image ; seuls les zooms lents et réguliers sont autorisés.
- **Peu d'effets spéciaux** : pas de flash blanc, de glitch ni de traînées. Transitions = coupes nettes ou glissements simples.
- **Sons** : de temps en temps seulement, des **dings légers et doux** (sinus court, volume bas) sur les moments clés ; jamais de clochettes ni de sons aigus.
- **Dernier écran** : un **curseur de souris (flèche blanche)** glisse vers le bouton / l'icône web, **clique** (petit onde + clic discret).

## 8. Qualité
- Texte **lisible sur mobile** (≥ 5 % de la hauteur), contraste suffisant (voile ou ombre), zone de sécurité de 8 % en haut et en bas (interfaces Reels / TikTok).
- Couleurs de la charte : ${f.c1 || ''} / ${f.c2 || ''} / ${f.c3 || ''}. Police : ${ad.style == 2 ? 'Playfair Display' : 'Montserrat (gras)'}.
- Aucune faute d'orthographe, accents corrects.

${ad.note ? '## 8 bis. Consignes spécifiques du client\n' + ad.note + '\n\n' : ''}## 9. Méthode de livraison
1. **D'abord** : regarde reference/storyboard.jpg et reference/reference_pub.mp4 (extrais des images avec ffmpeg si besoin), puis liste-moi en 5 lignes ta classification des photos et le plan (hook, ordre des scènes, transitions choisies).
2. Montre-moi **3 images d'aperçu** (hook, scène, fin). J'attends mon accord.
3. Puis génère le MP4 final et **envoie-le comme fichier**, avec la liste des photos écartées ou à refaire.
`;
  if (ad.script && ad.script.trim()) zip.file('voix/texte_voix_off.txt', ad.script.trim());
  zip.file('PROMPT_VIDEO.md', `> **À lire en premier : PROMPT_MAITRE_MOTION.md** (rôle de studio motion design, direction artistique, storytelling, contrôle qualité, livrables). Il s'applique à toute la vidéo ; ce fichier-ci donne le projet précis. En cas de conflit, les règles de netteté et de sobriété ci-dessous (pas de tremblement, pas de flash, textes nets) restent prioritaires.\n\n` + pm); try { try { const r = await fetch('ref/PROMPT_MAITRE_MOTION.md'); if (r.ok) zip.file('PROMPT_MAITRE_MOTION.md', await r.text()); } catch (e) { } for (const n of ['reference_pub.mp4', 'storyboard.jpg', 'logo_novavisio.png']) { const r = await fetch('ref/' + n); if (r.ok) zip.file('reference/' + n, await r.blob()); } } catch (e) { } if (bts.length) zip.file('beats.json', JSON.stringify({ duree_musique_s: +mdur.toFixed(1), decalage_s: +ad.offset || 0, temps_forts_s: bts }, null, 1));
  zip.file('LIRE-MOI_brief.md', md); zip.file('fiche.json', JSON.stringify(Object.assign({}, f, { _logo: undefined, _fond: undefined }), null, 1));
  return { blob: await zip.generateAsync({ type: 'blob' }), prompt: `Voici le dossier de ${f.nom}. Lis d'abord PROMPT_MAITRE_MOTION.md (ton rôle de studio motion design : jamais un simple diaporama), puis PROMPT_VIDEO.md en entier et regarde reference/storyboard.jpg (vidéo modèle à égaler) (puis LIRE-MOI_brief.md pour les données) et réalise la vidéo publicitaire demandée (${dur} s max, ${fmt}) : montage motion design nerveux, hook fort, transitions et bruitages calés sur les temps forts de beats.json, photos choisies en cohérence avec chaque texte. Utilise les photos, le logo et la musique du dossier.` };
}

/* ---------- vidéos pub finales, sauvegardées sur le serveur (Supabase, dossier <id>/pv/) ---------- */
function bindVids() {
  const l = $('#avl'), dz = $('#avd'), fi = $('#avf'); if (!l || !cur) return; cur.adVids = cur.adVids || [];
  const st = t => { $('#avs').textContent = t; }, mo = n => (n / 1048576).toFixed(1) + ' Mo';
  const draw = () => {
    l.innerHTML = cur.adVids.length ? cur.adVids.map((v, i) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border:1px solid #d7e3e8;border-radius:10px;margin-bottom:6px;background:#fff"><span style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🎬 <b>${esc(v.name)}</b> <span class="hint" style="margin:0">· ${mo(v.size)} · ${new Date(v.date).toLocaleDateString('fr-FR')}</span></span><span style="display:flex;gap:6px;flex:none"><button class="b o s" data-vdl="${i}">⬇ Télécharger</button><button class="b o s" data-vrm="${i}">✕</button></span></div>`).join('') : '<p class="hint" style="margin:0">Aucune vidéo enregistrée pour ce client.</p>';
    l.querySelectorAll('[data-vdl]').forEach(b => b.onclick = async () => { const v = cur.adVids[+b.dataset.vdl]; try { st('Préparation du téléchargement…'); const r = await api('/api/store', { mode: 'dl', id: cur.id, names: ['pv/' + v.id + '.mp4'] }), u = r.urls['pv/' + v.id + '.mp4']; if (!u) throw new Error('fichier introuvable sur le serveur'); const bl = await (await fetch(u)).blob(), a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = v.name; document.body.appendChild(a); a.click(); a.remove(); st('✔ Téléchargée : ' + v.name); } catch (e) { st('Erreur : ' + e.message); } });
    l.querySelectorAll('[data-vrm]').forEach(b => b.onclick = async () => { const i = +b.dataset.vrm, v = cur.adVids[i]; if (!confirm('Supprimer définitivement « ' + v.name + ' » du serveur ?')) return; try { await api('/api/store', { mode: 'remove', id: cur.id, names: ['pv/' + v.id + '.mp4'] }); cur.adVids.splice(i, 1); save(); draw(); st('Vidéo supprimée.'); } catch (e) { st('Erreur : ' + e.message); } });
  };
  const up = async fl => {
    for (const f of fl) {
      if (!/mp4$/i.test(f.name) && f.type !== 'video/mp4') { st('Seuls les MP4 sont acceptés : ' + f.name); continue; }
      if (f.size > 45 * 1048576) { st('Trop lourde (45 Mo max) : ' + f.name); continue; }
      const id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try {
        st('⬆ Envoi de ' + f.name + ' (' + mo(f.size) + ')…');
        const { url } = await api('/api/store', { mode: 'upsign', id: cur.id, name: 'pv/' + id + '.mp4' });
        const r = await fetch(url, { method: 'PUT', headers: { 'content-type': 'video/mp4', 'x-upsert': 'true' }, body: f });
        if (!r.ok) throw new Error('envoi refusé (' + r.status + ') ' + (await r.text()).slice(0, 120));
        cur.adVids.unshift({ id, name: f.name, size: f.size, date: Date.now() }); save(); draw(); st('✔ Enregistrée dans la fiche : ' + f.name);
      } catch (e) { st('Erreur : ' + e.message + (/configur/.test(e.message) ? '' : ' — vérifie la sauvegarde serveur.')); }
    }
  };
  dz.onclick = e => { if (e.target === dz) fi.click(); }; fi.onchange = () => { up([...fi.files]); fi.value = ''; };
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); up([...e.dataTransfer.files]); };
  draw();
}
