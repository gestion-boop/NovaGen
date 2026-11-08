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
  const items = parseCarte(f.carteTxt).flatMap(c => c.items).filter(i => i.nom && i.prix), pick = [], step = Math.max(1, Math.floor(items.length / 4));
  for (let i = 0; i < items.length && pick.length < 4; i += step) pick.push(items[i]);
  pick.forEach(i => o.push({ big: i.nom, small: i.prix, tag: 'À la carte' }));
  const sv = (f.services || []).map(adTxt).filter(Boolean).slice(0, 3); if (sv.length) o.push({ big: sv.join(' · ') });
  return o;
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
    if (A.logo && R > 1) { c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 40 * u; c.fillStyle = f.logoLight ? c1 : '#fff'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.restore(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); const s = Math.min(R * 1.5 / A.logo.width, R * 1.5 / A.logo.height); c.drawImage(A.logo, cx - A.logo.width * s / 2, cy - A.logo.height * s / 2, A.logo.width * s, A.logo.height * s); c.restore(); }
    const ny = cy + (A.logo ? 150 * u + 120 * u : 0), a1 = adOut((t - .9) / .6); text(f.nom || '', cx, ny + (1 - a1) * 40 * u, (portrait ? 96 : 88) * u, ink, 'center', a1);
    c.save(); c.globalAlpha = adOut((t - 1.3) / .6); c.fillStyle = c3; c.fillRect(cx - 90 * u * adOut((t - 1.3) / .6), ny + 36 * u, 180 * u * adOut((t - 1.3) / .6), 5 * u); c.restore();
    const sl = adTxt(f.slogan); if (sl) text(sl, cx, ny + 100 * u, 42 * u, st === 3 ? c2 : c3, 'center', adOut((t - 1.6) / .6), W * .8);
  } else if (t >= plan.D - plan.outro) {
    const k = (t - (plan.D - plan.outro)) / plan.outro, last = A.photos[A.photos.length - 1];
    bgPhoto(last, k, st === 3 ? '246,243,238,.84' : '10,10,14,.66'); const ink = st === 3 ? c1 : '#fff', cx = W / 2, s0 = plan.D - plan.outro, y0 = H * (portrait ? .32 : .28);
    const A1 = adOut((t - s0 - .2) / .5); text(st === 2 ? 'À très bientôt' : 'Venez nous voir', cx, y0 + (1 - A1) * 30 * u, 44 * u, st === 3 ? c2 : c3, 'center', A1);
    const A2 = adOut((t - s0 - .6) / .6); const hh = text(f.nom || '', cx, y0 + 110 * u + (1 - A2) * 40 * u, (portrait ? 98 : 88) * u, ink, 'center', A2);
    const adr = [f.adresse, f.ville].filter(Boolean).join(', '), A3 = adOut((t - s0 - 1.1) / .6); if (adr) text(adr, cx, y0 + 110 * u + hh + 30 * u, 44 * u, ink, 'center', A3 * .92, W * .84);
    if (f.tel) { const A4 = adOut((t - s0 - 1.6) / .5), pulse = 1 + .03 * Math.sin(t * 6), bw = Math.min(W * .78, 760 * u), bh = 120 * u, by = H * (portrait ? .66 : .72); c.save(); c.globalAlpha = A4; c.translate(cx, by + bh / 2); c.scale(pulse, pulse); c.fillStyle = c2; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30 * u; adRR(c, -bw / 2, -bh / 2, bw, bh, bh / 2); c.fill(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `${wt} ${46 * u}px ${FT}`; c.fillText((f.type === 'hebergement' ? 'Réservez · ' : 'Réservez · ') + f.tel, 0, 16 * u); c.restore(); }
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
  const cv = $('#adcv'); if (!cv || !cur) return; const ad = cur.ad = cur.ad || { style: '1', fmt: '9:16', dur: 45, offset: 0 }; let run = null, busy = false;
  const st = t => { $('#adst').textContent = t; }, nm = () => { $('#admn').textContent = cur.adMusic ? '🎵 ' + cur.adMusic.name : 'Aucune musique : la vidéo sera muette.'; };
  const fonts = async () => { try { await Promise.all(['900 40px Montserrat', '600 40px Montserrat', '700 40px "Playfair Display"'].map(x => document.fonts.load(x))); } catch (e) { } };
  const poster = async () => { if (busy) return; await fonts(); const P = await adPrepare(cur); cv.width = P.W; cv.height = P.H; adFrame(cv.getContext('2d'), P.W, P.H, Math.min(P.plan.intro + 1.1, P.plan.D - P.plan.outro - .2), P); };
  [['#adf', 'fmt'], ['#add', 'dur'], ['#ads', 'style'], ['#ado', 'offset']].forEach(([id, k]) => { const e = $(id); e.value = ad[k]; e.onchange = () => { ad[k] = e.value; save(); poster(); }; });
  nm(); $('#adm').onclick = () => $('#admf').click();
  $('#admf').onchange = () => { const x = $('#admf').files[0]; if (!x) return; cur.adMusic = { blob: x, name: x.name }; adCache.delete(cur.id); save(); nm(); poster(); };
  $('#admx').onclick = () => { cur.adMusic = null; adCache.delete(cur.id); save(); nm(); poster(); };
  const tick = (t, D) => { $('#adbar').style.width = (t / D * 100) + '%'; st(`${t.toFixed(1)} s / ${D} s`); };
  const reset = () => { run = null; busy = false; $('#adplay').textContent = '▶ Aperçu'; $('#adrec').disabled = false; $('#adbar').style.width = '0'; };
  $('#adplay').onclick = async () => { if (run) { run.stop(); return; } busy = true; $('#adrec').disabled = true; $('#adplay').textContent = '■ Arrêter'; await fonts(); const P = await adPrepare(cur); cv.width = P.W; cv.height = P.H; run = await adRun(cv, P, false, tick); await run.done; reset(); poster(); st('Aperçu terminé.'); };
  $('#adrec').onclick = async () => {
    if (run) return; if (!window.MediaRecorder) { st('Ton navigateur ne sait pas enregistrer : utilise Chrome.'); return; }
    busy = true; $('#adrec').disabled = true; $('#adplay').textContent = '■ Arrêter'; await fonts(); const P = await adPrepare(cur); cv.width = P.W; cv.height = P.H;
    run = await adRun(cv, P, true, (t, D) => { $('#adbar').style.width = (t / D * 100) + '%'; st(`⏺ Enregistrement ${t.toFixed(0)} s / ${D} s — garde cet onglet ouvert au premier plan`); });
    const r = await run.done; reset(); poster();
    if (r && r.blob.size > 1000 && r.ok) { const ext = /mp4/.test(r.blob.type) ? 'mp4' : 'webm', a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = (cur.fiche.nom || 'pub').replace(/[^\w-]+/g, '_') + '_pub_' + (ad.fmt || '9:16').replace(':', 'x') + '.' + ext; document.body.appendChild(a); a.click(); a.remove(); st(`✔ Vidéo prête (${ext.toUpperCase()}, ${(r.blob.size / 1048576).toFixed(1)} Mo) : regarde ton dossier Téléchargements.`); } else st('Enregistrement interrompu : relance l\'export.');
  };
  $('#adkit').onclick = async () => { st('Préparation du dossier…'); const k = await adKit(cur), a = document.createElement('a'); a.href = URL.createObjectURL(k.blob); a.download = 'Dossier_pub_' + (cur.fiche.nom || 'etablissement').replace(/[^\w-]+/g, '_') + '.zip'; document.body.appendChild(a); a.click(); a.remove(); try { await navigator.clipboard.writeText(k.prompt); st('✔ Dossier téléchargé. Le message à coller dans Claude est copié : dépose le ZIP dans la conversation, puis colle-le.'); } catch (e) { st('✔ Dossier téléchargé. Dépose-le dans une conversation Claude avec : ' + k.prompt); } };
  poster();
}

/* dossier pour Claude : prompt complet + photos + logo + données, à déposer dans une conversation */
async function adKit(p) {
  const f = p.fiche, ad = p.ad || {}, fmt = ad.fmt || '9:16', [W, H, fl] = AD_FMT[fmt], dur = Math.min(+ad.dur || 45, 45), sty = AD_STY[ad.style || 1];
  const zip = new JSZip(), tx = adTexts(f), cats = parseCarte(f.carteTxt), ph = (p.photos || []).slice(0, 12);
  ph.forEach((x, i) => zip.file(`photos/${String(i + 1).padStart(2, '0')}.jpg`, x.blob));
  if (p.logo) zip.file('logo.png', p.logo);
  if (p.adMusic && p.adMusic.blob) zip.file('musique/' + p.adMusic.name.replace(/[^\w.-]+/g, '_'), p.adMusic.blob);
  const styD = { 1: 'Dynamique : coupes rythmées sur les temps forts, zooms rapides, flash blanc à chaque changement, titres en capitales grasses avec une barre de couleur, barre de progression.', 2: 'Élégant : fondus enchaînés lents, Ken Burns doux, titres en serif avec un filet doré, ambiance haut de gamme.', 3: 'Minimal : fond clair, photos encadrées aux coins arrondis qui glissent, légendes sobres en dessous, beaucoup d\'air.' }[ad.style || 1];
  const adr = [f.adresse, f.ville].filter(Boolean).join(', '), ig = (String(f.instagram || '').match(/instagram\.com\/([^/?#]+)/i) || [])[1];
  const plats = cats.flatMap(c => c.items.filter(i => i.prix).map(i => `- ${i.nom} — ${i.prix}`)).slice(0, 12);
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
3. **Fin (≈ ${Math.round(Math.min(9, Math.max(4, dur * .2)))} s)** : « Venez nous voir », nom, adresse, bouton « Réservez · ${f.tel || ''} »${ig ? `, compte @${ig}` : ''}.

## Charte
- Couleur sombre : ${f.c1 || ''} · Accent : ${f.c2 || ''} · Or / survol : ${f.c3 || ''}
- Titres : ${ad.style == 2 ? 'serif élégant (Playfair Display)' : 'sans-serif gras (Montserrat)'}

## Données de l'établissement (à utiliser telles quelles, sans rien inventer)
- Nom : ${f.nom}
- Adresse : ${adr || '—'}
- Téléphone : ${f.tel || '—'}
- Site : ${f.site || '—'} · Instagram : ${f.instagram || '—'} · Facebook : ${f.facebook || '—'}
- Description : ${adTxt(f.descCourte) || adTxt(f.description) || '—'}
${plats.length ? '\n### Plats et prix\n' + plats.join('\n') : ''}

## Livraison
1. Montre-moi d'abord une image d'aperçu de 3 moments de la vidéo (intro, scène, fin).
2. Après mon accord, génère le MP4 et envoie-le-moi comme fichier.
3. Si une photo est floue, trop sombre ou coupée, dis-le-moi au lieu de l'utiliser telle quelle.
`;
  zip.file('LIRE-MOI_brief.md', md); zip.file('fiche.json', JSON.stringify(Object.assign({}, f, { _logo: undefined, _fond: undefined }), null, 1));
  return { blob: await zip.generateAsync({ type: 'blob' }), prompt: `Voici le dossier de ${f.nom}. Lis LIRE-MOI_brief.md et réalise la vidéo publicitaire demandée (${dur} s max, ${fmt}), en utilisant les photos, le logo et la musique du dossier.` };
}
