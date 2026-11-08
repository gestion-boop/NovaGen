/* NovaGen — interface */
const $ = s => document.querySelector(s);
const DAYN = DAYS.fr;
let cur = null, urls = [], saveT = 0, cityF = '', statF = '';

/* ---------- stockage (IndexedDB) ---------- */
const idb = new Promise((ok, ko) => { const r = indexedDB.open('novagen', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = ko; });
const tx = async (m, fn) => { const d = await idb; return new Promise((ok, ko) => { const t = d.transaction('p', m), q = fn(t.objectStore('p')); t.oncomplete = () => ok(q && q.result); t.onerror = ko; }); };
const dbAll = () => tx('readonly', s => s.getAll());
const dbPutRaw = p => tx('readwrite', s => s.put(p));
const dbPut = p => { const r = dbPutRaw(p); r.then(() => window.syncQueue && syncQueue(p)); return r; };
const dbDelRaw = id => tx('readwrite', s => s.delete(id));
const dbDel = id => { window.syncPurge && syncPurge(id); return dbDelRaw(id); };
function save() { clearTimeout(saveT); saveT = setTimeout(async () => { if (!cur) return; cur.upd = Date.now(); await dbPut(cur); renderList(); if (typeof refreshBadges === 'function') refreshBadges(); }, 350); }
const newProject = () => ({ id: 'p' + Date.now(), upd: Date.now(), links: { site: '', facebook: '', instagram: '', autres: '', nom: '', type: '' }, fiche: null, logo: null, photos: [], fond: 0, notes: [] });

/* ---------- messages / API ---------- */
function msg(t, k = 'i') { const m = $('#msg'); if (!m) return; m.className = 'on ' + k; m.textContent = t; if (!t) m.className = ''; }
async function api(path, body, isBlob) {
  for (let i = 0; i < 2; i++) {
    const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', 'x-pass': localStorage.getItem('ng_pass') || '' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { const p = await askPass(); if (p === null) throw new Error('Mot de passe requis'); localStorage.setItem('ng_pass', p); continue; }
    if (isBlob) { if (!r.ok) throw new Error('image'); return r.blob(); }
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status); return j;
  }
  throw new Error('Mot de passe incorrect');
}
function askPass() {
  return new Promise(ok => {
    const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,30,.7);display:flex;align-items:center;justify-content:center;z-index:99';
    d.innerHTML = '<div class="card" style="width:340px"><h2>Mot de passe</h2><p class="hint">Protège l\'accès à ton outil.</p><input type="password" id="pw" autofocus><div class="row" style="margin-top:12px"><button class="b" id="po">Entrer</button><button class="b o" id="pc">Annuler</button></div></div>';
    document.body.appendChild(d); const f = v => { d.remove(); ok(v); };
    d.querySelector('#po').onclick = () => f(d.querySelector('#pw').value); d.querySelector('#pc').onclick = () => f(null);
    d.querySelector('#pw').onkeydown = e => { if (e.key === 'Enter') f(e.target.value); };
  });
}

/* ---------- images ---------- */
async function toJpeg(blob, max = 1600) {
  const bm = await createImageBitmap(blob), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
  c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(bm, 0, 0, c.width, c.height);
  return { blob: await new Promise(r => c.toBlob(r, 'image/jpeg', .85)), w: bm.width, h: bm.height };
}
async function svgBitmap(blob) {
  const u = URL.createObjectURL(blob);
  try { const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; }), w = img.naturalWidth || 512, h = img.naturalHeight || 512, k = 512 / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return await createImageBitmap(c); } finally { URL.revokeObjectURL(u); }
}
const bmOf = blob => /svg/i.test(blob.type) ? svgBitmap(blob) : createImageBitmap(blob);
async function toPng(blob, max = 700) {
  const bm = await bmOf(blob), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
  c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function dominant(blob) {
  const bm = await createImageBitmap(blob), s = 64, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.drawImage(bm, 0, 0, s, s);
  const d = x.getImageData(0, 0, s, s).data, h = {};
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue; const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = (mx - mn) / (mx || 1), l = (mx + mn) / 510;
    if (l > .93 || l < .07 || sat < .28) continue; const k = (r >> 5) << 6 | (g >> 5) << 3 | (b >> 5); h[k] = h[k] || { n: 0, r: 0, g: 0, b: 0 }; const w = 1 + sat * 2; h[k].n += w; h[k].r += r * w; h[k].g += g * w; h[k].b += b * w;
  }
  const top = Object.values(h).sort((a, b) => b.n - a.n)[0]; if (!top) return null;
  let c2 = rh([top.r / top.n, top.g / top.n, top.b / top.n]); if (lum(c2) > .8) c2 = mix(c2, '#000000', .3);
  return { c2, c1: mix(c2, '#000000', .72), c3: mix(c2, '#ffffff', .5) };
}
async function logoIsLight(blob) {
  const bm = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.drawImage(bm, 0, 0, 48, 48);
  const d = x.getImageData(0, 0, 48, 48).data; let sum = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) { sum += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; n++; }
  return n ? sum / n > .72 : false;
}
const logoBg = p => p.logoLight ? (p.fiche?.c1 || '#26211F') : '#fff';
async function addPhotos(files) {
  let n = 0, ok = 0; const list = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name || '') || f.type === 'application/zip') { try { const z = await JSZip.loadAsync(f); for (const e of Object.values(z.files)) if (!e.dir && /\.(jpe?g|png|webp|avif|gif)$/i.test(e.name) && !/__MACOSX/.test(e.name)) list.push(await e.async('blob')); } catch (e) { } }
    else list.push(f);
  }
  for (const f of list) { try { const r = await toJpeg(f); if (Math.max(r.w, r.h) < 500) continue; cur.photos.push({ id: 'i' + Date.now() + n++, blob: r.blob }); ok++; } catch (e) { } }
  save(); renderPhotos(); return ok;
}
async function addPhotoUrls(txt) {
  const igm = u => { const m = u.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/i); return m ? 'https://www.instagram.com/p/' + m[1] + '/media/?size=l' : u; };
  const urls = [...new Set(String(txt).split(/\s+/).filter(u => /^https?:\/\//i.test(u)).map(igm))]; let ok = 0;
  for (const u of urls) { try { const bl = await api('/api/img?u=' + encodeURIComponent(u), null, true), r = await toJpeg(bl); if (Math.max(r.w, r.h) < 400) continue; cur.photos.push({ id: 'i' + Date.now() + ok, blob: r.blob }); ok++; } catch (e) { } }
  save(); renderPhotos(); return [ok, urls.length];
}
async function monogram(f) {
  const stop = /^(le|la|les|l|de|du|des|d|au|aux|chez|the|et|and|un|une|restaurant|bar|hotel|hôtel|cafe|café|camping)$/i;
  const w = String(f.nom || '').replace(/[&'’\-]/g, ' ').split(/\s+/).filter(x => x && !stop.test(x)), all = String(f.nom || '').split(/\s+/).filter(Boolean);
  const ini = ((w.length ? w : all).slice(0, 2).map(x => x[0]).join('') || '?').toUpperCase();
  try { await new FontFace('DM Serif Display', 'url(fonts/dmserif.woff2)').load().then(ff => document.fonts.add(ff)); } catch (e) { }
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), c1 = f.c1 || '#1f2a44', c2 = f.c2 || '#c0682f', hl = lum(c2) > .4 ? c2 : mix(c2, '#ffffff', .55);
  const g = x.createRadialGradient(S * .38, S * .3, 20, S / 2, S / 2, S * .62); g.addColorStop(0, mix(c1, c2, .35)); g.addColorStop(1, c1);
  x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, 7); x.fill();
  x.strokeStyle = hl; x.lineWidth = 10; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 22, 0, 7); x.stroke();
  x.strokeStyle = hl + '66'; x.lineWidth = 2; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 42, 0, 7); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; const fs = ini.length > 1 ? 210 : 260; x.font = `${fs}px "DM Serif Display",Georgia,serif`; x.fillText(ini, S / 2, S / 2 + fs * .33);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function setLogo(blob) {
  cur.logoAuto = false; cur.logo = await toPng(blob); cur.logoLight = await logoIsLight(cur.logo); if (!cur.fiche?._colorsSet) { const d = await dominant(cur.logo); if (d && cur.fiche) Object.assign(cur.fiche, d); } save(); render(); }

/* ---------- suppression : confirmation en tapant « supprimer », puis corbeille 30 jours ---------- */
function askDelete(p, done) {
  if (!p) return; document.getElementById('dm')?.remove();
  const nom = p.fiche?.nom || p.links?.nom || p.links?.site || 'cet établissement';
  const d = document.createElement('div'); d.id = 'dm'; d.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,30,.7);display:flex;align-items:center;justify-content:center;z-index:70;padding:16px';
  d.innerHTML = `<div class="card" style="width:min(440px,100%)"><h2>🗑 Supprimer « ${esc(nom)} » ?</h2><p class="hint">Il part dans la corbeille et reste récupérable pendant 30 jours. Pour confirmer, écris <b>supprimer</b>.</p><input id="dmi" autocomplete="off" placeholder="supprimer"><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="b o" id="dmx">Annuler</button><button class="b" id="dmo" disabled style="background:#c23a2b">Supprimer</button></div></div>`;
  document.body.appendChild(d); const i = d.querySelector('#dmi'), ok = d.querySelector('#dmo'); i.focus();
  const go = () => { if (norm(i.value.trim()) !== 'supprimer') return; d.remove(); done(p); };
  i.oninput = () => ok.disabled = norm(i.value.trim()) !== 'supprimer';
  i.onkeydown = e => { if (e.key === 'Enter') go(); if (e.key === 'Escape') d.remove(); };
  ok.onclick = go; d.querySelector('#dmx').onclick = () => d.remove(); d.onclick = e => { if (e.target === d) d.remove(); };
}

/* ---------- rendu ---------- */
/* avancement d'un établissement, dans l'ordre chronologique du travail */
function progOf(p) {
  const f = p.fiche || {}, steps = [
    ['Fiche', 'infos', !!(f.nom && (f.adresse || f.tel || (f.horaires || []).length))],
    ['Photos', 'medias', !!p.logo && !p.logoAuto && (p.photos || []).length >= 3],
    ['Carte', 'infos', f.type === 'hebergement' || f.type === 'commerce' || (f.carteTxt || '').trim().length > 10],
    ['Pages en ligne', 'pages', Object.keys(p.pub || {}).length >= 3]
  ], done = steps.filter(x => x[2]).length, nx = steps.find(x => !x[2]);
  return { done, total: steps.length, next: nx ? nx[0] : '', tab: nx ? nx[1] : '', ok: !nx };
}
function renderList() {
  dbAll().then(everything => {
    const LIM = 30 * 864e5, now = Date.now();
    everything.filter(p => p.del && now - p.del > LIM).forEach(p => dbDel(p.id));
    const trash = everything.filter(p => p.del && now - p.del <= LIM).sort((a, b) => b.del - a.del), all = everything.filter(p => !p.del);
    all.sort((a, b) => b.upd - a.upd);
    all.filter(p => p.logo && p.logoLight === undefined).forEach(async p => { p.logoLight = await logoIsLight(p.logo); await dbPut(p); if (cur && cur.id === p.id) cur.logoLight = p.logoLight; renderList(); });
    const vs = [...new Set(all.map(p => p.fiche?.ville || p.links?.ville).filter(Boolean))].sort(); if (cityF && !vs.includes(cityF)) cityF = '';
    const pr = new Map(all.map(p => [p.id, progOf(p)])), nTodo = all.filter(p => !pr.get(p.id).ok).length, byCity = cityF ? all.filter(p => (p.fiche?.ville || p.links?.ville) === cityF) : all, shown = statF === 'todo' ? byCity.filter(p => !pr.get(p.id).ok) : statF === 'done' ? byCity.filter(p => pr.get(p.id).ok) : byCity;
    $('#list').innerHTML = `<div class="sfl">${[['', 'Tous', all.length], ['todo', 'À finir', nTodo], ['done', 'Terminés', all.length - nTodo]].map(([k, n, c]) => `<button data-sf="${k}" class="${statF === k ? 'on' : ''}">${n} <b>${c}</b></button>`).join('')}</div>` + (vs.length > 1 ? `<select id="cf" style="margin:0 0 8px"><option value="">Toutes les villes (${all.length})</option>${vs.map(v => `<option ${v === cityF ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : '') + shown.map(p => `<div class="pj ${cur && cur.id === p.id ? 'on' : ''}" data-id="${p.id}">${p.logo ? `<img src="${URL.createObjectURL(p.logo)}" style="background:${logoBg(p)}">` : '<img>'}<div>${esc(p.fiche?.nom || p.links.nom || p.links.site || 'Nouveau')}<small>${esc(p.fiche?.ville || '')}${pr.get(p.id).ok ? ' · ✔ terminé' : ' · → ' + esc(pr.get(p.id).next)}</small><div class="pgb"><i style="width:${Math.round(pr.get(p.id).done / pr.get(p.id).total * 100)}%"></i></div></div><button class="x" data-del="${p.id}" title="Supprimer">✕</button></div>`).join('') || '<div class="hint" style="padding:6px">Aucun pour le moment.</div>';
    const tr = document.getElementById('trash'); if (tr) tr.remove();
    if (trash.length) { const d = document.createElement('div'); d.id = 'trash'; d.style.cssText = 'margin-top:14px;border-top:1px solid var(--line);padding-top:10px';
      d.innerHTML = `<details ${window.__tOpen ? 'open' : ''}><summary style="cursor:pointer;font-size:12.5px;font-weight:700;color:var(--mu)">🗑 Corbeille (${trash.length}) — gardée 30 jours</summary>${trash.map(p => { const j = Math.max(0, 30 - Math.floor((now - p.del) / 864e5)); return `<div style="display:flex;align-items:center;gap:6px;padding:7px 2px;font-size:13px"><div style="flex:1;min-width:0"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.fiche?.nom || p.links?.nom || p.links?.site || 'Sans nom')}</div><small style="color:var(--mu)">${j} jour(s) restant(s)</small></div><button class="b o s" data-rest="${p.id}">Restaurer</button><button class="x" data-purge="${p.id}" title="Supprimer définitivement" style="border:0;background:none;cursor:pointer;color:var(--mu);font-size:15px">✕</button></div>`; }).join('')}</details>`;
      $('#list').after(d); d.querySelector('details').ontoggle = e => window.__tOpen = e.target.open;
      d.querySelectorAll('[data-rest]').forEach(b => b.onclick = async () => { const p = trash.find(x => x.id === b.dataset.rest); delete p.del; p.upd = Date.now(); await dbPut(p); cur = p; renderList(); render(); });
      d.querySelectorAll('[data-purge]').forEach(b => b.onclick = async () => { const p = trash.find(x => x.id === b.dataset.purge); if (confirm('Supprimer définitivement « ' + (p.fiche?.nom || p.links?.nom || 'cet établissement') + ' » ? Cette action est irréversible.')) { await dbDel(p.id); renderList(); } });
    }
    $('#list').classList.toggle('dense', shown.length > 12);
    document.querySelectorAll('[data-sf]').forEach(b => b.onclick = () => { statF = b.dataset.sf; renderList(); });
    const cf = $('#cf'); if (cf) cf.onchange = () => { cityF = cf.value; renderList(); };
    document.querySelectorAll('.pj').forEach(e => e.onclick = async ev => {
      if (ev.target.dataset.del) { askDelete(all.find(p => p.id === ev.target.dataset.del), async p => { p.del = Date.now(); await dbPut(p); if (cur && cur.id === p.id) cur = all.find(x => x.id !== p.id) || null; renderList(); render(); }); return; }
      cur = all.find(p => p.id === e.dataset.id); { const pg = progOf(cur); if (!pg.ok && cur.fiche) cur._tab = pg.tab; } render(); renderList();
    });
  });
}
function render() {
  const m = $('#main'); if (!cur || !cur.fiche) undo = null;
  if (!cur) { m.innerHTML = '<div class="card empty"><h2 style="justify-content:center">Bienvenue dans NovaGen</h2><p class="hint">Crée un établissement : colle ses liens, dépose le logo, et récupère les ZIP.</p><button class="b" id="n2">+ Nouvel établissement</button></div>'; $('#n2').onclick = () => $('#new').click(); return; }
  const L = cur.links, f = cur.fiche;
  m.innerHTML = `
  <div class="card"><h2><i>1</i> Liens de l'établissement</h2><p class="hint">Colle ce que tu as. Facebook et Instagram sont lus au mieux : le site officiel et les sources publiques font le gros du travail.</p>
   <div class="g2"><label>Site internet<input data-l="site" value="${esc(L.site)}" placeholder="https://…"></label><label>Facebook<input data-l="facebook" value="${esc(L.facebook)}" placeholder="https://facebook.com/…"></label></div>
   <div class="g2"><label>Instagram<input data-l="instagram" value="${esc(L.instagram)}" placeholder="https://instagram.com/…"></label><label>Autres liens (Tripadvisor, Airbnb, Google Maps…)<input data-l="autres" value="${esc(L.autres)}" placeholder="séparés par un espace"></label></div>
   <div class="g2"><label>Nom (facultatif)<input data-l="nom" value="${esc(L.nom)}"></label><label>Type<select data-l="type"><option value="">Détecter automatiquement</option>${[['restaurant', 'Restaurant / bar / café'], ['hebergement', 'Hébergement (Airbnb, gîte, hôtel, camping)'], ['commerce', 'Commerce / autre']].map(([v, n]) => `<option value="${v}" ${L.type === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
   <details style="margin-bottom:14px" ${cur.src ? 'open' : ''}><summary style="cursor:pointer;font-size:13px;font-weight:700;color:var(--b1)">📋 J'ai le code HTML d'une page (Facebook, Instagram, site…)</summary>
    <p class="hint" style="margin:8px 0">Ouvre la page dans ton navigateur (connecté si besoin), fais défiler pour charger les photos, puis : clic droit → <b>Afficher le code source de la page</b> → Cmd+A, Cmd+C, et colle ici. Ou Cmd+S → « Page web, HTML uniquement », puis dépose le fichier.</p>
    <textarea id="hh" rows="4" placeholder="Colle ici le code HTML…"></textarea>
    <div class="row" style="margin-top:8px"><button class="b o s" id="hf">Choisir un ou plusieurs fichiers .html</button><input type="file" id="hfi" accept=".html,.htm,.txt,.mhtml" multiple hidden><label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;margin:0"><input type="checkbox" id="hadd" style="width:auto;margin:0"> ajouter à ce qui est déjà chargé</label><span class="hint" id="hs" style="margin:0">${cur.src ? `✔ ${cur.src.images.length} image(s) et ${cur.src.text.length} caractères de texte détectés` + ' <a href="#" id="hx">effacer</a>' : ''}</span></div></details>
   <div class="logo" style="margin-bottom:14px">${cur.logo ? `<img id="lg" src="${URL.createObjectURL(cur.logo)}" style="background:${logoBg(cur)}">` : ''}<div class="drop" id="lgd" style="flex:1">${cur.logo ? 'Remplacer le logo' : 'Déposer le logo (facultatif : sinon cherché sur le site)'}<input type="file" id="lgf" accept="image/*" hidden></div></div>
   <div class="row"><button class="b" id="go">⚡ Tout en un clic</button><span class="hint" style="margin:0">Je cherche, je remplis la fiche, le logo et les photos, j'applique tes réglages mémorisés, puis j'ouvre l'onglet Pages. Compte 30 à 60 s.</span></div><div id="msg"></div></div>
  ${f ? ficheHtml(f) : ''}`;
  bind(); if (f) { renderPhotos(); renderVideos(); renderBar(); bindAd(); }
  tabsUi(m, f);
}
/* ---------- navigation par onglets (présentation) ---------- */
const TABS = [['infos', '📝', 'Infos'], ['medias', '🖼', 'Photos & vidéos'], ['style', '🎨', 'Style'], ['pages', '🚀', 'Pages'], ['pub', '🎬', 'Publicité']];
function tabsUi(m, f) {
  const key = c => { const t = (c.querySelector('h2') || {}).textContent || ''; return /Assistant/.test(t) ? 'dock' : /Liens|Fiche/.test(t) ? 'infos' : /Style/.test(t) ? 'style' : /Photos|Vidéos/.test(t) ? 'medias' : /Générer|Barre/.test(t) ? 'pages' : /Publicité/.test(t) ? 'pub' : 'infos'; };
  [...m.children].filter(c => c.classList.contains('card')).forEach(c => { c.dataset.t = key(c); if (c.dataset.t === 'dock') { c.classList.add('dock', 'min'); const h = c.querySelector('h2'); h.onclick = () => c.classList.toggle('min'); } });
  if (!f) { m.dataset.tab = 'infos'; return; }
  if (!TABS.some(t => t[0] === cur._tab)) cur._tab = 'infos'; m.dataset.tab = cur._tab;
  const nb = (cur.photos || []).length, nc = parseCarte(f.carteTxt).reduce((n, c) => n + c.items.length, 0), nv = (cur.videos || []).length;
  const chip = (ok, t) => `<span class="chip ${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${t}</span>`;
  const head = document.createElement('div'); head.className = 'ph0';
  head.innerHTML = `<div class="ph0t">${cur.logo ? `<img src="${URL.createObjectURL(cur.logo)}" style="background:${logoBg(cur)}">` : ''}<div><h1>${esc(f.nom || 'Nouvel établissement')}</h1><small>${esc([f.ville, f.type === 'hebergement' ? 'Hébergement' : f.type === 'commerce' ? 'Commerce' : 'Restaurant / bar'].filter(Boolean).join(' · '))}</small></div></div>
   <div class="chips0">${chip(!!f.nom, 'Fiche')}${chip(!!cur.logo, 'Logo')}${chip(nb > 0, nb + ' photo' + (nb > 1 ? 's' : ''))}${f.type !== 'hebergement' ? chip(nc > 0, nc ? nc + ' plats' : 'Carte') : ''}${chip(nv > 0, nv + ' vidéo' + (nv > 1 ? 's' : ''))}</div>
   <nav class="tabs0">${TABS.map(([k, ic, n], i) => `<button data-tab="${k}" class="${k === cur._tab ? 'on' : ''}"><i>${i + 1}</i>${ic} ${n}</button>`).join('')}</nav>`;
  m.prepend(head);
  head.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { cur._tab = b.dataset.tab; m.dataset.tab = cur._tab; head.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  if (cur._tab === 'pages' || true) { const nxt = TABS[TABS.findIndex(t => t[0] === cur._tab) + 1]; if (nxt) { const last = [...m.querySelectorAll('.card')].filter(c => c.dataset.t === cur._tab).pop(); if (last) { const n = document.createElement('div'); n.className = 'nx'; n.innerHTML = `<button class="b" data-go="${nxt[0]}">Suivant : ${nxt[1]} ${nxt[2]} →</button>`; n.dataset.t = cur._tab; m.insertBefore(n, last.nextSibling); n.querySelector('button').onclick = () => head.querySelector(`[data-tab="${nxt[0]}"]`).click(); } } }
}

function ficheHtml(f) {
  const nt = '<div class="notes" id="notes"></div>';
  const v = (k, lab, ph = '') => `<label>${lab}<input data-f="${k}" value="${esc(f[k] || '')}" placeholder="${ph}"></label>`;
  return chatHtml() + `<div class="card"><h2><i>2</i> Fiche — vérifie et corrige</h2><p class="hint">Tout est modifiable. Les modifications sont enregistrées automatiquement.</p>${nt}
   <div class="g3">${v('nom', 'Nom')}${v('ville', 'Ville')}<label>Type<select data-f="type">${[['restaurant', 'Restaurant / bar / café'], ['hebergement', 'Hébergement'], ['commerce', 'Commerce / autre']].map(([x, n]) => `<option value="${x}" ${f.type === x ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
   <label>Accroche courte (sous le nom)<input data-s="slogan" value="${esc(f.slogan?.fr || '')}"></label>
   <label>Description courte <span class="hint" style="font-weight:400">(vignette / aperçu NovaTour — 140 caractères max)</span><input data-s="descCourte" maxlength="160" value="${esc(f.descCourte?.fr || '')}"></label>
   <label>Description longue <span class="hint" style="font-weight:400">(page « Infos » de la visite)</span><textarea data-s="description" rows="5">${esc(f.description?.fr || '')}</textarea></label>
   <div class="g3">${v('adresse', 'Adresse')}${v('tel', 'Téléphone')}${v('email', 'E-mail')}</div>
   <div class="g3">${v('site', 'Site')}${v('facebook', 'Facebook')}${v('instagram', 'Instagram')}</div>
   ${v('booking', 'Lien de réservation en ligne (Airbnb, TheFork…)')}
   <div class="g2"><label>Horaires (un jour par ligne, vide ou « Fermé »)<div style="display:grid;gap:5px;margin-top:5px">${DAYN.map((d, i) => `<div style="display:grid;grid-template-columns:84px 1fr;gap:8px;align-items:center"><span style="font-weight:600;color:var(--ink)">${d}</span><input data-h="${i}" style="margin:0" value="${esc((f.horaires || [])[i] || '')}" placeholder="12h–14h · 19h–22h"></div>`).join('')}</div></label>
   <div><label>Services (un par ligne)<textarea data-sv rows="6">${esc((f.services || []).map(s => s.fr || s).join('\n'))}</textarea></label>
   <label>Carte — « # Catégorie » puis « Plat | prix | description »<textarea data-f="carteTxt" rows="8" placeholder="# Burgers&#10;Le Classique | 12,50 € | steak, cheddar">${esc(f.carteTxt || '')}</textarea></label><div class="row" style="margin-top:8px"><button class="b o s" id="cim">📄 Importer la carte (PDF, JPG, PNG)</button><input type="file" id="cif" accept="application/pdf,image/*" multiple hidden><span class="hint" id="cm" style="margin:0">Je lis le fichier, je remplis la carte et j'ouvre l'aperçu.</span></div></div></div></div>
  <div class="card"><h2><i>5</i> Style</h2><div class="g4">
   <label>Couleur sombre<input type="color" data-f="c1" value="${f.c1 || '#1f2a44'}"></label><label>Accent<input type="color" data-f="c2" value="${f.c2 || '#2b899d'}"></label><label>Survol des boutons<input type="color" data-f="c3" value="${f.c3 || '#f2b632'}"></label><div style="grid-column:1/-1" class="row"><button class="b o s" id="nch">🎨 Nouvelle charte graphique</button><button class="b o s" id="nchr" title="Palette et style au hasard">🎲 Au hasard</button><span class="hint" style="margin:0">Palette (et style) différents des autres établissements.</span></div><label style="margin:0">Couleur des boutons de la barre<input type="color" data-f="btnC" value="${/^#[0-9a-f]{6}$/i.test(f.btnC || '') ? f.btnC : (f.c2 || '#2b899d')}"></label><div class="row" style="align-self:end;grid-column:span 2;flex-wrap:nowrap;gap:8px"><button class="b o s" id="btnauto" style="white-space:nowrap">↺ Accent</button>${['#8c1d2b|Rouge', '#1d5c3a|Vert', '#1f3a6e|Bleu', '#b8862b|Or', '#6b3f2e|Brun', '#2b2623|Noir'].map(x => `<button class="b o s" data-bc="${x.split('|')[0]}" title="${x.split('|')[1]}" style="width:26px;height:26px;padding:0;border-radius:50%;background:${x.split('|')[0]}"></button>`).join('')}</div><div style="grid-column:1/-1" class="row"><button class="b o s" id="psave">💾 Mémoriser mes réglages pour tous les « ${TYPE_LAB[f.type] || 'restaurant / bar'} »</button><span class="hint" style="margin:0">Styles des pages, titres, forme du logo et barre du bas : repris automatiquement à chaque nouvel établissement de ce type.${getProfiles()[f.type || 'restaurant'] ? ' <b>✔ Réglages déjà mémorisés.</b>' : ''}</span></div>
   <label>Titres<select data-f="police"><option value="serif" ${f.police !== 'sans' ? 'selected' : ''}>Élégant (serif + script)</option><option value="sans" ${f.police === 'sans' ? 'selected' : ''}>Moderne (Montserrat gras)</option></select></label></div>
   <div class="g2"><label>Style des pages (carte, galerie, infos, intro)<select data-f="style"><option value="" ${!f.style ? 'selected' : ''}>Auto — ${(STYLES.find(x => x[0] === styleOf(f)) || [])[1]} (propre à cet établissement)</option>${STYLES.map(([k, n]) => `<option value="${k}" ${String(f.style) === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label><div style="padding-top:22px"><button class="b o s" id="fromlogo">🎨 Couleurs depuis le logo</button></div></div></div>
  <div class="card"><h2><i>3</i> Photos <small style="font-weight:400;color:var(--mu)" id="pc"></small></h2><p class="hint">★ = photo de fond de l'intro. ✕ = retirer. Tu peux en déposer d'autres.</p>
   <div class="drop" id="phd">Glisser des photos (ou un ZIP de photos) ici, ou cliquer. Tu peux aussi coller des images avec Cmd+V.<input type="file" id="phf" accept="image/*,.zip" multiple hidden></div>
   <details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;font-weight:700;color:var(--b1)">Importer depuis des liens d'images (Facebook, Instagram, site…)</summary><p class="hint" style="margin:8px 0">Sur Facebook : clic droit sur une photo → « Copier l'adresse de l'image », puis colle les adresses ici (une par ligne ou séparées par un espace).</p><textarea id="pu" rows="4" placeholder="https://scontent…"></textarea><div class="row" style="margin-top:8px"><button class="b o s" id="pub2">Importer ces liens</button><span class="hint" id="pm" style="margin:0"></span></div></details><div class="ph" id="ph"></div></div>
  <div class="card"><h2><i>4</i> Vidéos &amp; compléments</h2><p class="hint">Pour la page Vidéo (cadre téléphone, son, rejouer). Plusieurs vidéos = lues l'une après l'autre. Déployer accepte ~3 Mo par fichier ; au-delà, télécharge le ZIP et dépose-le sur Vercel. Les vidéos restent sur cet ordinateur (non synchronisées).</p>
   <div class="drop" id="vdd">Glisser des vidéos (mp4, webm, mov) ici, ou cliquer<input type="file" id="vdf" accept="video/*" multiple hidden></div><div id="vl" style="margin-top:8px"></div>
   <div class="g2" style="margin-top:10px"><label>Étiquette<input data-f="videoSur" value="${esc(f.videoSur || '')}" placeholder="Notre signature"></label><label>Titre de la page vidéo<input data-f="videoTitre" value="${esc(f.videoTitre || '')}" placeholder="Le Flambadou"></label></div>
   <label>Texte à côté de la vidéo<textarea data-f="videoTexte" rows="3" placeholder="Une cuisson ancestrale…">${esc(f.videoTexte || '')}</textarea></label>
   <label>Note Google (affichée dans Point Info « Vitrine »)<input data-f="avis" value="${esc(f.avis || '')}" placeholder="4,6/5 · plus de 1 000 avis Google"></label></div>
  <div class="card"><h2>🎛 Barre du bas — simulation</h2><p class="hint">Place les boutons, choisis où chacun mène, puis clique dessus pour tester comme le client. L'ordre et les liens sont à reporter dans 3DVista.</p><div id="bar"></div></div>
  <div class="card"><h2>🎬 Publicité — vidéo motion</h2><p class="hint">Je compose une vidéo animée avec le logo, les photos, l'accroche, les plats et l'adresse de la fiche, calée sur ta musique. 45 secondes maximum. Tout se fait dans ton navigateur.</p>
  <div class="g4"><label>Format<select id="adf">${Object.entries(AD_FMT).map(([k, v]) => `<option value="${k}">${v[2]}</option>`).join('')}</select></label><label>Durée<select id="add"><option value="15">15 secondes</option><option value="30">30 secondes</option><option value="45">45 secondes</option></select></label><label>Style de motion<select id="ads">${Object.entries(AD_STY).map(([k, v]) => `<option value="${k}">${k} — ${v}</option>`).join('')}</select></label><label>La musique démarre à (s)<input type="number" id="ado" min="0" step="1" value="0"></label></div>
  <div class="row" style="margin:10px 0"><button class="b o s" id="adm">🎵 Choisir la musique</button><button class="b o s" id="admx">✕ Retirer</button><input type="file" id="admf" accept="audio/*,.mp3,.m4a,.wav" hidden><span class="hint" id="admn" style="margin:0"></span></div>
  <div style="text-align:center"><canvas id="adcv" width="540" height="960" style="max-width:100%;max-height:560px;border-radius:14px;background:#111;box-shadow:0 8px 26px rgba(0,0,0,.25)"></canvas></div>
  <div class="pgb" style="margin:10px 0"><i id="adbar" style="width:0"></i></div>
  <div class="row"><button class="b" id="adplay">▶ Aperçu</button><button class="b o" id="adrec">⏺ Exporter la vidéo</button><button class="b o" id="adkit" title="ZIP avec le prompt, les photos, le logo et les données, à déposer dans Claude">📦 Dossier pour Claude</button><span class="hint" id="adst" style="margin:0"></span></div>
  <p class="hint">L'export se fait en temps réel (45 s de vidéo = 45 s d'attente) : laisse cet onglet au premier plan. La musique reste sur cet ordinateur et doit être libre de droits pour une publicité. Les couleurs viennent de l'onglet Style.</p></div>
  <div class="card"><h2><i>6</i> Générer</h2><p class="hint">Chaque ZIP se téléverse tel quel sur Vercel. Aperçu = exactement ce qui sera dans le ZIP.</p><div class="out" id="out"></div>
   <div class="row" style="margin-top:14px"><button class="b" id="all">⬇ Tout télécharger (ZIP séparés)</button></div><div id="msg2"></div></div>`;
}
/* ---------- carte depuis un PDF / une photo ---------- */
async function pdfToJpegs(file) {
  if (!window.pdfjsLib) { await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = () => ko(new Error('Lecteur PDF indisponible')); document.head.appendChild(s); }); pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise, out = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) { const pg = await pdf.getPage(i), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 1800 / Math.max(v0.width, v0.height) }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; out.push(await new Promise(r => c.toBlob(r, 'image/jpeg', .82))); }
  return out;
}
async function importCarte(list, btn) {
  const m = $('#cm'), say = t => { if (m) m.textContent = t; }, f = cur.fiche; btn.disabled = true;
  try {
    say('Préparation des fichiers…'); const files = [];
    for (const x of list) {
      if (x.type === 'application/pdf' || /\.pdf$/i.test(x.name)) { for (const bl of await pdfToJpegs(x)) files.push({ type: 'image/jpeg', b64: await toB64(bl) }); }
      else files.push({ type: 'image/jpeg', b64: await toB64((await toJpeg(x, 1800)).blob) });
    }
    if (!files.length) throw new Error('Aucune page lisible dans ce fichier.');
    /* lots de 2 pages (réponse courte et rapide), 3 lots en parallèle, texte recollé dans l'ordre */
    const lots = []; for (let i = 0; i < files.length; i += 2) lots.push(files.slice(i, i + 2));
    const res = new Array(lots.length); let done = 0, next = 0;
    say('Claude lit la carte… 0/' + lots.length);
    const worker = async () => { while (next < lots.length) { const i = next++; let err; for (let t = 0; t < 2; t++) { try { res[i] = await api('/api/fiche', { mode: 'carte_file', files: lots[i], nom: f.nom, ville: f.ville, part: (i + 1) + '/' + lots.length }); err = null; break; } catch (e) { err = e; } } if (err) throw err; say('Claude lit la carte… ' + (++done) + '/' + lots.length); } };
    await Promise.all([worker(), worker(), worker()]);
    const r = { carteTxt: res.map(x => x.carteTxt.trim()).join('\n'), notes: res.map(x => x.notes).filter(Boolean).join(' · ') };
    const had = (f.carteTxt || '').trim(); f.carteTxt = had && !confirm('Remplacer la carte actuelle par celle du fichier ?\nOK = remplacer, Annuler = ajouter à la suite.') ? had + '\n' + r.carteTxt : r.carteTxt;
    delete f.carteTr; save(); render(); const m2 = $('#cm'); if (m2) m2.textContent = '✔ Carte importée (' + parseCarte(f.carteTxt).reduce((n, c) => n + c.items.length, 0) + ' plats).' + (r.notes ? ' À vérifier : ' + r.notes : '');
    preview('carte');
  } catch (e) { say('⚠ ' + e.message); } finally { btn.disabled = false; }
}

/* ---------- barre du bas : simulation (2 pages de boutons, liens, test au clic, plein écran) ---------- */
const BAR_LAB = { menu: 'Carte', reserver: 'Réserver', photos: 'Photos', appeler: 'Appeler', infos: 'Infos', localisation: 'Plan', contact: 'Contact', plan: 'Plan', panoramas: 'Panoramas', video: 'Vidéo', son: 'Son', pleinecran: 'Plein écran', vr: 'VR', maison: 'Retour', burger: 'Plus', lit: 'Chambres', wifi: 'Wi-Fi', cafe: 'Café', vin: 'Vins', piscine: 'Piscine', tente: 'Camping', gateau: 'Pâtisserie', velo: 'Vélo', play: 'Lecture' };
const BAR_PG = [['intro', 'Intro'], ['infos', 'Point Info'], ['galerie', 'Galerie'], ['carte', 'Carte'], ['reservation', 'Réservation'], ['video', 'Vidéo']];
/* ---------- réglages mémorisés par type d'établissement ---------- */
const vm = v => { const m = String(v).match(/https?:\/\/([a-z0-9-]+)\.vercel\.app/i) || String(v).match(/vercel\.com\/[^\/\s?#]+\/([a-z0-9][a-z0-9-_.]*)/i); return m ? [m[0], m[1]] : null; };
const getProfiles = () => { try { return JSON.parse(localStorage.getItem('ng_profiles')) || {}; } catch (e) { return {}; } };
const TYPE_LAB = { restaurant: 'restaurant / bar', hebergement: 'hébergement', commerce: 'commerce' };
function saveProfile() {
  const f = cur.fiche, p = getProfiles(), cl = a => (a || []).map(b => ({ k: b.k, t: b.t, u: '' }));
  p[f.type || 'restaurant'] = { pstyle: Object.assign({}, f.pstyle || {}), police: f.police || 'serif', logoForme: f.logoForme || 'rond', btnC: f.btnC || '', ad: { style: (cur.ad || {}).style || '1', fmt: (cur.ad || {}).fmt || '9:16' }, bar: cl(cur.bar), bar2: cl(cur.bar2) };
  try { localStorage.setItem('ng_profiles', JSON.stringify(p)); } catch (e) { }
}
function applyProfile() {
  const f = cur.fiche; if (!f || f._prof) return false; f._prof = 1;
  const p = getProfiles()[f.type || 'restaurant']; if (!p) return false;
  const hasC = parseCarte(f.carteTxt).length, fix = a => (a || []).map(b => !hasC && b.t === 'page:carte' ? { k: 'reserver', t: 'page:reservation', u: '' } : { k: b.k, t: b.t, u: '' });
  f.pstyle = Object.assign({}, p.pstyle); f.police = p.police; f.logoForme = p.logoForme; if (p.btnC) f.btnC = p.btnC; if (p.ad) cur.ad = Object.assign({ dur: 45, offset: 0 }, p.ad);
  if (p.bar && p.bar.length) cur.bar = fix(p.bar); if (p.bar2 && p.bar2.length) cur.bar2 = fix(p.bar2);
  return true;
}
function barDefault(f, n) {
  if (n === 2) return [['video', 'page:video'], ['photos', 'page:galerie'], ['panoramas', 'none'], ['son', 'url'], ['maison', 'bar:1']].map(([k, t]) => ({ k, t, u: '' }));
  const hasC = parseCarte(f.carteTxt).length, t = f.type;
  const L = t === 'hebergement' ? [['infos', 'page:infos'], ['photos', 'page:galerie'], ['reserver', 'page:reservation'], ['appeler', 'tel'], ['localisation', 'map']]
    : t === 'commerce' ? [['infos', 'page:infos'], ['photos', 'page:galerie'], hasC ? ['menu', 'page:carte'] : ['reserver', 'page:reservation'], ['appeler', 'tel'], ['localisation', 'map']]
    : [['menu', 'page:carte'], ['reserver', 'page:reservation'], ['photos', 'page:galerie'], ['appeler', 'tel'], ['infos', 'page:infos']];
  return L.map(([k, t]) => ({ k, t, u: '' }));
}
function barLink(b) {
  const f = cur.fiche;
  if (b.t.startsWith('page:')) { const k = b.t.slice(5), n = projOf(k); return (cur.pub && cur.pub[k] && cur.pub[k].project === n && cur.pub[k].url) || (n ? 'https://' + n + '.vercel.app' : ''); }
  if (b.t === 'tel') return f.tel ? 'tel:' + String(f.tel).replace(/[^\d+]/g, '') : '';
  if (b.t === 'mail') return f.email ? 'mailto:' + f.email : '';
  if (b.t === 'map') return f.adresse ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.nom + ' ' + f.adresse) : '';
  if (b.t === 'none') return '(aucun lien : vue panoramique des images)';
  if (b.t === 'full') return '(bascule en plein écran)';
  if (b.t.startsWith('bar:')) return '(va à la page ' + b.t.slice(4) + ' de la barre)';
  return b.u || '';
}
let barView = 1;
function renderBar() {
  const el = $('#bar'); if (!el) return; const f = cur.fiche; if (!cur.bar) cur.bar = barDefault(f, 1); if (!cur.bar2) cur.bar2 = barDefault(f, 2);
  if (!cur.barV2) { cur.barV2 = 1; cur.bar = cur.bar.filter(b => !(b.k === 'burger' && b.t === 'bar:2')); cur.bar2 = cur.bar2.filter(b => b.t !== 'full'); save(); }
  cur.bar2.forEach(b => { if (b.k === 'panoramas' && b.t === 'url' && !b.u) b.t = 'none'; });
  const pages = [null, cur.bar, cur.bar2], svgUrl = (k, st) => 'data:image/svg+xml;utf8,' + encodeURIComponent(btnSvg(f, ICONS[k] ? k : 'infos', st, 120));
  const bgI = cur.barBg != null && cur.barBg >= 0 && cur.barBg < cur.photos.length ? cur.barBg : Math.min(cur.fond || 0, cur.photos.length - 1);
  const bg = cur.barBgFile ? URL.createObjectURL(cur.barBgFile) : cur.photos.length ? URL.createObjectURL(cur.photos[bgI].blob) : '';
  const c2 = f.c2 || '#2b899d', c3 = f.c3 || '#e0a040', auto = `radial-gradient(circle at 18% 24%, ${c3}66 0, transparent 34%), radial-gradient(circle at 82% 70%, ${c2}aa 0, transparent 40%), radial-gradient(circle at 60% 18%, #ffffff22 0, transparent 26%), linear-gradient(135deg, ${c2}, #0d1014)`;
  const thumbs = cur.photos.map((ph, i) => `<img src="${URL.createObjectURL(ph.blob)}" data-bgp="${i}" class="${!cur.barBgFile && i === bgI ? 'on' : ''}" title="Photo ${i + 1}">`).join('');
  const imgs = k => `<img class="n" src="${svgUrl(k, 'normal')}"><img class="h" src="${svgUrl(k, 'survol')}"><img class="p" src="${svgUrl(k, 'presse')}">`;
  const tsel = (b, pg, i) => `<select data-bt="${pg}:${i}"><optgroup label="Page NovaGen">${BAR_PG.map(([k, n]) => `<option value="page:${k}" ${b.t === 'page:' + k ? 'selected' : ''}>${n}</option>`).join('')}</optgroup><optgroup label="Autre">${[['tel', 'Téléphone'], ['mail', 'E-mail'], ['map', 'Plan (Google Maps)'], ['url', 'Lien libre…'], ['none', 'Aucun lien'], ['full', 'Plein écran'], ['bar:1', 'Barre : page 1'], ['bar:2', 'Barre : page 2']].map(([v, n]) => `<option value="${v}" ${b.t === v ? 'selected' : ''}>${n}</option>`).join('')}</optgroup></select>`;
  const row = (b, pg, i) => `<div class="br"><span class="bn">${i + 1}</span><img src="${svgUrl(b.k, 'normal')}" width="34"><select data-bk="${pg}:${i}">${Object.keys(BAR_LAB).filter(k => ICONS[k]).map(k => `<option value="${k}" ${b.k === k ? 'selected' : ''}>${BAR_LAB[k]}</option>`).join('')}</select>${tsel(b, pg, i)}
   ${b.t === 'url' ? `<input data-bu="${pg}:${i}" value="${esc(b.u)}" placeholder="https://…" style="margin:0;flex:1;min-width:160px">` : (b.t.startsWith('page:') ? `<input data-bp="${pg}:${i}" value="${esc(barLink(b))}" title="Lien Vercel de cette page : modifie ou colle le tien" placeholder="https://….vercel.app" style="margin:0;flex:1;min-width:160px;font-size:12.5px">` : `<span class="bl">${esc(barLink(b) || '— non renseigné —')}</span>`)}
   <button class="b o s" data-bup="${pg}:${i}">↑</button><button class="b o s" data-bdn="${pg}:${i}">↓</button><button class="b o s" data-brm="${pg}:${i}">✕</button></div>`;
  el.innerHTML = `<div class="bs" id="bs" style="background-image:${bg ? `url(${bg})` : auto}"><div class="bsc">${pages[barView].map((b, i) => `<button class="bb" data-bi="${i}" title="${esc(BAR_LAB[b.k] || b.k)}">${imgs(b.k)}</button>`).join('')}</div><div class="bso" id="bso"><div class="bsh"><b id="bst"></b><button class="bb x" id="bsx" title="Fermer">${imgs('fermer')}</button></div><iframe id="bsf"></iframe></div><div class="bsm" id="bsm"></div><button class="bb bfs" id="bfs" title="Plein écran">${imgs('pleinecran')}</button></div>
  <div class="row" style="margin:10px 0 0"><span class="hint" style="margin:0">Glisse les boutons pour les réordonner : leur lien les suit. Le petit bouton en haut à droite passe en plein écran (Échap pour quitter). Page de la barre affichée : <b>${barView}</b> · la page 2 (Vidéo, Photos…) s'ouvre si tu ajoutes un bouton « Barre : page 2 » à la page 1.</span></div>
  <h3 class="bh">Fond d'écran de la simulation</h3><div class="bgs">${thumbs}<button class="b o s" id="bgu">+ Mon image</button>${cur.barBgFile || cur.barBg != null ? '<button class="b o s" id="bga">↺ Automatique</button>' : ''}<input type="file" id="bgf" accept="image/*" hidden></div>${cur.photos.length ? '' : '<p class="hint">Aucune photo pour l\'instant : un fond aux couleurs de la charte est généré. Ajoute des photos pour choisir parmi elles.</p>'}
  ${[1, 2].map(pg => `<h3 class="bh">Barre — page ${pg}${pg === 2 ? ' (accessible par le bouton « Plus »)' : ''}</h3><div class="brows">${pages[pg].map((b, i) => row(b, pg, i)).join('')}</div><div class="row" style="margin-top:6px"><button class="b o s" data-bad="${pg}">+ Ajouter un bouton</button><button class="b o s" data-bre="${pg}">↺ Réinitialiser la page ${pg}</button></div>`).join('')}
  <div class="row" style="margin-top:12px"><button class="b o s" id="bcp">📋 Copier la liste des liens</button></div>`;
  const save2 = (re = true) => { save(); if (re) renderBar(); }, at = v => { const [pg, i] = v.split(':').map(Number); return [pages[pg], i]; };
  const msg = t => { const m = $('#bsm'); m.textContent = t; m.classList.add('on'); clearTimeout(msg.t); msg.t = setTimeout(() => m.classList.remove('on'), 2600); };
  const full = on => { const bs = $('#bs'); bs.classList.toggle('full', on); document.body.style.overflow = on ? 'hidden' : ''; if (on) { bs.requestFullscreen && bs.requestFullscreen().catch(() => {}); } else if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); if (!on) { $('#bso').classList.remove('on'); $('#bsf').srcdoc = ''; $('#bsf').removeAttribute('src'); } };
  el.querySelectorAll('[data-bi]').forEach(bt => bt.onclick = async () => {
    const b = pages[barView][+bt.dataset.bi], l = barLink(b);
    if (b.t === 'none') { msg('Panorama : vue des différentes images, aucun lien.'); return; }
    if (b.t === 'full') { full(!$('#bs').classList.contains('full')); return; }
    if (b.t.startsWith('bar:')) { barView = +b.t.slice(4); renderBar(); if (document.fullscreenElement || true) { } return; }
    if (b.t.startsWith('page:')) {
      const k = b.t.slice(5); bt.disabled = true;
      try {
        const pub = cur.pub && cur.pub[k] && cur.pub[k].url && cur.pub[k].project === projOf(k) ? cur.pub[k].url : '';
        if (pub) { $('#bsf').removeAttribute('srcdoc'); $('#bsf').src = pub; $('#bst').innerHTML = esc(BAR_LAB[b.k] || '') + ' · page en ligne · <a href="' + esc(pub) + '" target="_blank" style="color:inherit">' + esc(pub.replace('https://', '')) + ' ↗</a>'; $('#bso').classList.add('on'); return; }
        const files = await make(k); if (!files) { msg('Cette page n\'est pas disponible pour cette fiche.'); return; }
        let html = files['index.html']; for (const [pp, v] of Object.entries(files)) if (pp !== 'index.html') html = html.split(pp).join(URL.createObjectURL(v));
        $('#bsf').removeAttribute('src'); $('#bsf').srcdoc = html; $('#bst').textContent = (BAR_LAB[b.k] || '') + ' · aperçu local, pas encore déployé'; $('#bso').classList.add('on');
      } catch (e) { msg('Erreur : ' + e.message); } finally { bt.disabled = false; }
    } else if (!l) msg('Pas de lien renseigné pour ce bouton.'); else if (b.t === 'tel') msg('📞 Ouvre l\'appel : ' + l.slice(4)); else if (b.t === 'mail') msg('✉ Ouvre un e-mail : ' + l.slice(7)); else window.open(l, '_blank');
  });
  $('#bsx').onclick = () => { $('#bso').classList.remove('on'); $('#bsf').srcdoc = ''; $('#bsf').removeAttribute('src'); };
  el.querySelectorAll('[data-bgp]').forEach(i => i.onclick = () => { cur.barBg = +i.dataset.bgp; cur.barBgFile = null; save2(); });
  $('#bgu').onclick = () => $('#bgf').click(); $('#bgf').onchange = () => { const x = $('#bgf').files[0]; if (x) { cur.barBgFile = x; save2(); } };
  if ($('#bga')) $('#bga').onclick = () => { cur.barBg = null; cur.barBgFile = null; save2(); };
  $('#bfs').onclick = () => full(!$('#bs').classList.contains('full'));
  if (!window._barEsc) { window._barEsc = true; const out = () => { const bs = $('#bs'); if (bs && bs.classList.contains('full')) { bs.classList.remove('full'); document.body.style.overflow = ''; } }; document.addEventListener('keydown', e => { if (e.key === 'Escape') out(); }); document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) out(); }); }
  const AUTO = { menu: 'page:carte', reserver: 'page:reservation', photos: 'page:galerie', infos: 'page:infos', video: 'page:video', appeler: 'tel', contact: 'mail', localisation: 'map', plan: 'map', pleinecran: 'full', maison: 'bar:1', burger: 'bar:2', play: 'page:video', panoramas: 'none', son: 'url' };
  el.querySelectorAll('[data-bk]').forEach(x => x.onchange = () => { const [L, i] = at(x.dataset.bk); L[i].k = x.value; if (AUTO[x.value]) L[i].t = AUTO[x.value]; save2(); });
  /* glisser-déposer des boutons directement sur la barre : le lien suit le bouton */
  let dragI = null; el.querySelectorAll('.bsc .bb').forEach(bt => { bt.draggable = true; bt.ondragstart = e => { dragI = +bt.dataset.bi; e.dataTransfer.effectAllowed = 'move'; }; bt.ondragover = e => e.preventDefault(); bt.ondrop = e => { e.preventDefault(); const j = +bt.dataset.bi; if (dragI == null || dragI === j) return; const L = pages[barView], [m] = L.splice(dragI, 1); L.splice(j, 0, m); dragI = null; save2(); }; });
  el.querySelectorAll('[data-bt]').forEach(x => x.onchange = () => { const [L, i] = at(x.dataset.bt); L[i].t = x.value; save2(); });
  el.querySelectorAll('[data-bp]').forEach(x => x.onpaste = () => setTimeout(() => x.onchange(), 60));
  el.querySelectorAll('[data-bp]').forEach(x => x.onchange = () => { const [L, i] = at(x.dataset.bp), k = L[i].t.slice(5), v = x.value.trim(), m = vm(v); cur.vp = cur.vp || {}; cur.pub = cur.pub || {};
    if (!v) { delete cur.pub[k]; delete cur.vp[k]; } else if (m) { const nm = m[1].toLowerCase(); cur.vp[k] = nm; cur.pub[k] = { hash: '', at: Date.now(), project: nm, url: 'https://' + nm + '.vercel.app' }; } else { x.style.borderColor = '#c0392b'; x.title = 'Lien non reconnu : colle une adresse du type https://nom.vercel.app'; return; }
    save2(); if (typeof renderOut === 'function' && $('#out')) renderOut(); });
  el.querySelectorAll('[data-bu]').forEach(x => x.onchange = () => { const [L, i] = at(x.dataset.bu); L[i].u = x.value.trim(); save2(false); });
  const mv = (v, d) => { const [L, i] = at(v), j = i + d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; save2(); };
  el.querySelectorAll('[data-bup]').forEach(b => b.onclick = () => mv(b.dataset.bup, -1)); el.querySelectorAll('[data-bdn]').forEach(b => b.onclick = () => mv(b.dataset.bdn, 1));
  el.querySelectorAll('[data-brm]').forEach(b => b.onclick = () => { const [L, i] = at(b.dataset.brm); L.splice(i, 1); save2(); });
  el.querySelectorAll('[data-bad]').forEach(b => b.onclick = () => { pages[+b.dataset.bad].push({ k: 'infos', t: 'page:infos', u: '' }); save2(); });
  el.querySelectorAll('[data-bre]').forEach(b => b.onclick = () => { const n = +b.dataset.bre; if (n === 1) cur.bar = barDefault(f, 1); else cur.bar2 = barDefault(f, 2); save2(); });
  $('#bcp').onclick = () => { const txt = [1, 2].map(pg => 'Page ' + pg + '\n' + pages[pg].map((b, i) => `${i + 1}. ${BAR_LAB[b.k] || b.k} → ${barLink(b) || '(non renseigné)'}`).join('\n')).join('\n\n'); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => msg('Liste copiée.'), () => prompt('Copie la liste :', txt)); };
}
/* ---------- vidéos ---------- */
function renderVideos() {
  const l = $('#vl'); if (!l) return; cur.videos = cur.videos || [];
  l.innerHTML = cur.videos.map((v, i) => `<div class="vi" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px;font-size:13px"><span>🎬 ${esc(v.name || 'vidéo ' + (i + 1))} · ${(v.blob.size / 1048576).toFixed(1)} Mo${v.blob.size > 3300000 ? ' ⚠ trop lourde pour « Déployer »' : ''}</span><span><button class="b o s" data-vu="${i}">↑</button> <button class="b o s" data-vd="${i}">↓</button> <button class="b o s" data-vr="${i}">✕</button></span></div>`).join('') || '<p class="hint" style="margin:0">Aucune vidéo.</p>';
  const mv = (i, d) => { const j = i + d; if (j < 0 || j >= cur.videos.length) return; [cur.videos[i], cur.videos[j]] = [cur.videos[j], cur.videos[i]]; save(); renderVideos(); };
  l.querySelectorAll('[data-vu]').forEach(b => b.onclick = () => mv(+b.dataset.vu, -1)); l.querySelectorAll('[data-vd]').forEach(b => b.onclick = () => mv(+b.dataset.vd, 1));
  l.querySelectorAll('[data-vr]').forEach(b => b.onclick = () => { cur.videos.splice(+b.dataset.vr, 1); save(); renderVideos(); });
  const add = fl => { for (const x of fl) if (/^video\//.test(x.type) || /\.(mp4|webm|mov)$/i.test(x.name)) cur.videos.push({ id: 'v' + Date.now() + Math.random().toString(36).slice(2, 5), name: x.name, blob: x.type ? x : new Blob([x], { type: 'video/mp4' }) }); save(); renderVideos(); renderOut(); };
  const d = $('#vdd'), inp = $('#vdf'); d.onclick = () => inp.click(); inp.onchange = () => { add([...inp.files]); inp.value = ''; };
  d.ondragover = e => { e.preventDefault(); d.classList.add('on'); }; d.ondragleave = () => d.classList.remove('on'); d.ondrop = e => { e.preventDefault(); d.classList.remove('on'); add([...e.dataTransfer.files]); };
}
/* ---------- doublons : même image (même en taille différente) ---------- */
async function dhash(blob) {
  const bm = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = 9; c.height = 8;
  const x = c.getContext('2d'); x.drawImage(bm, 0, 0, 9, 8); bm.close && bm.close();
  const d = x.getImageData(0, 0, 9, 8).data, g = i => d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11; let h = '';
  for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) h += g(r * 9 + q) > g(r * 9 + q + 1) ? '1' : '0';
  return h;
}
let dedupBusy = false;
async function dedupePhotos() {
  if (dedupBusy || !cur || cur.photos.length < 2) return 0; dedupBusy = true;
  try {
    for (const p of cur.photos) if (!p.h) { try { p.h = await dhash(p.blob); } catch (e) { p.h = 'x' + p.id; } }
    const keep = [], fondId = cur.photos[cur.fond] && cur.photos[cur.fond].id; let rem = 0;
    for (const p of cur.photos) {
      const j = keep.findIndex(k => k.h.length === 64 && p.h.length === 64 && [...k.h].filter((c, i) => c !== p.h[i]).length <= 5);
      if (j < 0) keep.push(p); else { rem++; if (p.blob.size > keep[j].blob.size) { if (fondId === keep[j].id) cur.fond = -1; keep[j] = p; } }
    }
    if (rem) { const fi = keep.findIndex(p => p.id === fondId); cur.photos = keep; cur.fond = fi >= 0 ? fi : 0; save(); }
    return rem;
  } finally { dedupBusy = false; }
}
function renderPhotos() {
  const ph = $('#ph'); if (!ph) return; urls.forEach(URL.revokeObjectURL); urls = [];
  ph.innerHTML = cur.photos.map((p, i) => { const u = URL.createObjectURL(p.blob); urls.push(u); return `<div><img src="${u}"><button class="f ${cur.fond === i ? 'on' : ''}" data-fond="${i}">★</button><button class="d" data-rm="${i}">✕</button></div>`; }).join('');
  $('#pc').textContent = `(${cur.photos.length})`;
  ph.querySelectorAll('[data-fond]').forEach(b => b.onclick = () => { cur.fond = +b.dataset.fond; save(); renderPhotos(); });
  ph.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const i = +b.dataset.rm; cur.photos.splice(i, 1); if (cur.fond >= cur.photos.length) cur.fond = 0; save(); renderPhotos(); });
  dedupePhotos().then(n => { if (n) { renderPhotos(); const m = $('#msg'); if (m) { m.className = 'on i'; m.textContent = n + ' doublon(s) supprimé(s).'; } } });
  renderOut();
}
const PUB = ['intro', 'infos', 'galerie', 'carte', 'reservation', 'video'];
const defProject = k => (slug() + '-' + k).toLowerCase();
let vproj = null, vperr = '', vload = false;
const KW = { intro: ['intro'], infos: ['info', 'point'], galerie: ['galerie', 'gallery', 'photo'], carte: ['carte', 'menu'], reservation: ['resa', 'reserv', 'book'], video: ['video', 'signature', 'flambadou'] };
function guess(k) { if (!vproj) return defProject(k); const s = slug().toLowerCase(), m = vproj.filter(p => p.name.replace(/-|et/g, '').includes(s.replace(/et/g, '')) && KW[k].some(w => p.name.includes(w))); return m.length === 1 ? m[0].name : defProject(k); }
async function loadProjects() { if (vload) return; vload = true; try { vproj = (await api('/api/publish', { mode: 'projects' })).projects || []; } catch (e) { vproj = []; vperr = e.message; } if ($('#out')) renderOut(); }
const PSN = { intro: ['Classique', 'Ardoise', 'Moderne', 'Magazine', 'Cinéma (Gaïa)', 'Rideau'], galerie: ['Mosaïque', 'Polaroïds', 'Moderne', 'Magazine', 'Diaporama', 'Défilé'], infos: ['Classique', 'Ardoise', 'Moderne', 'Magazine', 'Signature (Mioza)', 'Vitrine (Gaïa)'] };
const projOf = k => ((cur.vp || {})[k] || guess(k)).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
const PG = ['intro', 'infos', 'galerie', 'carte', 'reservation'];
/* 🎲 autre proposition : nouveau style (et nouvelle photo de fond) pour UNE page, puis aperçu */
function randomize(k) {
  const f = cur.fiche, now = styleOfPg(f, k), opts = (['intro', 'infos', 'galerie'].includes(k) ? ['1', '2', '3', '4', '5', '6'] : k === 'carte' ? ['1', '2', '3', '4', '5'] : ['1', '2', '3', '4']).filter(x => x !== now), pick = opts[Math.floor(Math.random() * opts.length)];
  f.pstyle = Object.assign({}, f.pstyle, { [k]: pick });
  if (['intro', 'infos', 'carte'].includes(k) && cur.photos.length > 1) { const was = (f.pfond && f.pfond[k] != null) ? +f.pfond[k] : cur.fond, c = cur.photos.map((_, i) => i).filter(i => i !== was); f.pfond = Object.assign({}, f.pfond, { [k]: c[Math.floor(Math.random() * c.length)] }); }
  save(); renderOut(); preview(k);
}
/* commentaire libre : Claude modifie la fiche / le style puis on ouvre l'aperçu */
async function applyComment(k, btn) {
  const ta = document.querySelector(`[data-pc="${k}"]`), t = (ta?.value || '').trim(), m = $('#pm-' + k); if (!t) { if (m) m.textContent = 'Écris d\'abord ce que tu veux changer.'; return; }
  btn.disabled = true; btn.textContent = '…'; if (m) m.textContent = 'Claude applique…';
  try {
    const r = await api('/api/fiche', { mode: 'assist', page: k, instruction: t, fiche: liteFiche(), nbPhotos: cur.photos.length, fond: cur.fond, history: [] }), ch = applyAssist(r);
    cur.chat = cur.chat || []; cur.chat.push({ r: 'u', t: `[${k}] ${t}` }, { r: 'a', t: (r.message || 'Fait.') + (ch.length ? '\n✔ Modifié : ' + ch.join(', ') : '') });
    save(); renderOut(); const m2 = $('#pm-' + k); if (m2) m2.innerHTML = esc(r.message || 'Fait.') + (ch.length ? ' <b>✔ ' + esc(ch.join(', ')) + '</b>' : ''); if (ch.length) preview(k);
  } catch (e) { if (m) m.textContent = e.message; btn.disabled = false; btn.textContent = 'Appliquer'; }
}
function renderOut() {
  const o = $('#out'); if (!o) return; const f = cur.fiche, heb = f.type === 'hebergement', hasC = parseCarte(f.carteTxt).length;
  const items = [['intro', 'Intro', '5 s · iris · signature NovaVisio'], ['infos', 'Point Info', 'horaires, adresse, contact, services'], ['galerie', 'Galerie', cur.photos.length + ' photo(s) + lightbox', !cur.photos.length], ['carte', 'Carte', 'plats et prix', heb || !hasC], ['reservation', heb ? 'Réservation / demande' : 'Réservation', 'récap + appel / e-mail / Messenger', f.type === 'commerce'], ['video', 'Vidéo', (cur.videos || []).length + ' vidéo(s) · cadre téléphone, son, progression', !(cur.videos || []).length], ['boutons', 'Boutons glossy', '30 icônes × 3 états, 256 et 128 px']];
  const keepV = o.querySelector('#vpt') ? o.querySelector('#vpt').value : '';
  o.innerHTML = items.map(([k, n, d, off]) => `<div class="o" style="${off ? 'opacity:.45' : ''}"><div class="oh"><div><b>${n} <span class="bd" id="bd-${k}"></span></b><small>${off ? 'Non disponible pour cette fiche' : d}</small></div>
   <div class="row"><button class="b o s" data-pv="${k}" ${off ? 'disabled' : ''}>👁 Aperçu</button><button class="b o s" data-dl="${k}" ${off ? 'disabled' : ''}>⬇ ZIP</button>${PUB.includes(k) && !off ? `<button class="b s" data-pub="${k}">🚀 Déployer</button>` : ''}</div></div>
   ${PUB.includes(k) && !off ? `<div class="lk" id="lk-${k}" style="font-size:12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"></div>` : ''}
   ${(PUB.includes(k) || PG.includes(k)) && !off ? `<details class="opt"><summary>⚙ Réglages de cette page</summary>${PUB.includes(k) ? `<label style="margin:8px 0 0;font-size:11px">Projet Vercel à mettre à jour<input data-vp="${k}" list="vpl" value="${esc(projOf(k))}" style="margin-top:3px;padding:7px 9px;font-size:12.5px"></label><div class="vs" id="vs-${k}"></div>` : ''}${PG.includes(k) ? `<div style="padding-top:8px"><small id="sty-${k}" style="display:block;margin-bottom:5px"></small><textarea data-pc="${k}" rows="2" placeholder="Un changement ? ex. fond plus sombre, titres plus gros, carte plus aérée…" style="margin:0;min-height:0;font-size:12.5px;padding:7px 9px"></textarea><div class="row" style="margin-top:6px"><button class="b s" data-pa="${k}">Appliquer</button><button class="b o s" data-rnd="${k}" title="Propose un autre design pour cette page">🎲 Autre proposition</button></div><div class="vs" id="pm-${k}"></div></div>` : ''}</details>` : ''}<div class="pl" id="pl-${k}"></div></div>`).join('');
  const stl = k => { const el = $('#sty-' + k); if (!el) return; const n = +styleOfPg(Object.assign({}, f, { _fond: cur.photos.length > 0, _names: cur.photos.map(() => 0) }), k), nm = (PSN[k] && PSN[k][n - 1]) || (STYLES.find(x => x[0] === String(n)) || [])[1] || ''; el.innerHTML = 'Style : <b>' + nm + '</b>' + (f.pstyle && f.pstyle[k] ? ' <a href="#" data-auto="' + k + '">↺ auto</a>' : ''); }; PG.forEach(stl);
  const pickers = () => ['intro', 'infos', 'galerie'].forEach(k => { const el = $('#sty-' + k); if (!el) return; const now = styleOfPg(Object.assign({}, f, { _fond: cur.photos.length > 0, _names: cur.photos.map(() => 0) }), k); el.insertAdjacentHTML('afterend', '<div class="pk" data-pkr="' + k + '">' + PSN[k].map((n, i) => '<button class="b o s ' + (String(i + 1) === now ? 'on' : '') + '" data-ps="' + k + ':' + (i + 1) + '" title="' + n + '">' + (i + 1) + '<small>' + n + '</small></button>').join('') + '</div>'); });
  pickers();
  o.insertAdjacentHTML('afterbegin', `<div class="o"><details class="opt" ${keepV ? 'open' : ''}><summary>🔗 J'ai déjà des liens Vercel déployés</summary><textarea id="vpt" rows="3" style="margin-top:8px" placeholder="https://mioza.vercel.app&#10;galerie https://mioza-galerie.vercel.app">${esc(keepV)}</textarea><div class="row" style="margin-top:6px"><button class="b o s" id="vpb">Rattacher à cet établissement</button><span class="hint" id="vpm" style="margin:0">Un lien par ligne. Je devine la page d'après le nom ; sinon écris le mot (intro, infos, galerie, carte, reservation, video) devant le lien. Sans indication : Point Info.</span></div></details></div>`);
  { const bt = $('#vpb'); if (bt) bt.onclick = () => {
    const done = []; cur.vp = cur.vp || {}; cur.pub = cur.pub || {};
    String($('#vpt').value).split('\n').forEach(l => { const m = l.match(/https?:\/\/([a-z0-9-]+)\.vercel\.app/i); if (!m) return; const name = m[1].toLowerCase(), lab = l.replace(m[0], '').toLowerCase(), has = w => lab.includes(w) || (!lab.trim() && name.includes(w));
      const k = Object.keys(KW).find(x => lab.includes(x) || KW[x].some(w => has(w))) || Object.keys(KW).find(x => KW[x].some(w => name.includes(w))) || 'infos';
      cur.vp[k] = name; cur.pub[k] = { hash: '', at: Date.now(), project: name, url: 'https://' + name + '.vercel.app' }; done.push(k + ' → ' + name); });
    if (!done.length) { $('#vpm').textContent = 'Aucun lien .vercel.app reconnu.'; return; }
    save(); renderOut(); renderBar(); const m2 = $('#vpm'); if (m2) m2.innerHTML = '<b>✔ ' + done.map(esc).join(' · ') + '</b>'; const d = $('#vpt'); if (d) d.closest('details').open = true; }; }
  o.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { const [k, n] = b.dataset.ps.split(':'); f.pstyle = Object.assign({}, f.pstyle, { [k]: n }); save(); renderOut(); preview(k); });
  o.querySelectorAll('[data-auto]').forEach(a => a.onclick = e => { e.preventDefault(); delete f.pstyle[a.dataset.auto]; if (f.pfond) delete f.pfond[a.dataset.auto]; save(); renderOut(); });
  o.querySelectorAll('[data-rnd]').forEach(b => b.onclick = () => randomize(b.dataset.rnd));
  o.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => applyComment(b.dataset.pa, b));
  o.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => preview(b.dataset.pv));
  o.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => download(b.dataset.dl, b));
  o.insertAdjacentHTML('beforeend', `<datalist id="vpl">${(vproj || []).map(p => `<option value="${esc(p.name)}">${esc(p.domain)}</option>`).join('')}</datalist>`);
  const vst = k => { const el = $('#vs-' + k); if (!el) return; const n = projOf(k), pr = (vproj || []).find(p => p.name === n); el.innerHTML = vproj === null ? '' : vperr ? `<span style="color:#8a5a00">⚠ Liste des projets indisponible (${esc(vperr)})</span>` : pr ? `<span style="color:#1b6b37">✓ Projet existant : ${esc(pr.domain)}</span>` : '<span style="color:#a1271b">⚠ Ce projet n\'existe pas : un NOUVEAU projet sera créé</span>'; };
  const lnk = k => { const el = $('#lk-' + k); if (!el) return; const n = projOf(k), u = (cur.pub && cur.pub[k] && cur.pub[k].project === n && cur.pub[k].url) || (n && cur.pub && cur.pub[k] ? 'https://' + n + '.vercel.app' : '');
    el.innerHTML = `🔗 <input class="vu" value="${esc(u)}" placeholder="Coller ici le lien Vercel déjà déployé (https://….vercel.app)" style="flex:1;min-width:220px;padding:6px 9px;font-size:12px;margin:0">${u ? `<a href="${esc(u)}" target="_blank" style="color:var(--b1);font-weight:700;text-decoration:none">↗ Ouvrir</a><button class="b o s" data-cp="${k}" style="padding:2px 8px;font-size:11px">Copier</button>` : ''}`;
    const inp = el.querySelector('.vu'); inp.onpaste = () => setTimeout(() => inp.onchange(), 60); inp.onchange = () => { const v = inp.value.trim(), m = vm(v); cur.vp = cur.vp || {}; cur.pub = cur.pub || {};
      if (!v) { delete cur.pub[k]; delete cur.vp[k]; } else if (m) { const nm = m[1].toLowerCase(); cur.vp[k] = nm; cur.pub[k] = { hash: '', at: Date.now(), project: nm, url: 'https://' + nm + '.vercel.app' }; } else { inp.style.borderColor = '#c0392b'; return; }
      save(); const vi = o.querySelector('[data-vp="' + k + '"]'); if (vi) vi.value = projOf(k); lnk(k); renderBar(); };
    const cp = el.querySelector('[data-cp]'); if (cp) cp.onclick = async e => { try { await navigator.clipboard.writeText(u); e.target.textContent = '✔ Copié'; setTimeout(() => e.target.textContent = 'Copier', 1500); } catch (x) { prompt('Copie ce lien :', u); } }; };
  o.querySelectorAll('[data-vp]').forEach(i => { i.onchange = () => { cur.vp = cur.vp || {}; const k0 = i.dataset.vp, m0 = vm(i.value); if (m0) { cur.pub = cur.pub || {}; cur.vp[k0] = m0[1].toLowerCase(); cur.pub[k0] = { hash: '', at: Date.now(), project: cur.vp[k0], url: 'https://' + cur.vp[k0] + '.vercel.app' }; i.value = cur.vp[k0]; renderBar(); } else cur.vp[i.dataset.vp] = i.value.trim(); save(); vst(i.dataset.vp); lnk(i.dataset.vp); }; i.oninput = () => { const k = i.dataset.vp, v = i.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'), el = $('#lk-' + k); if (el) { const a = el.querySelector('a'); if (a && v) { a.href = 'https://' + v + '.vercel.app'; a.textContent = v + '.vercel.app'; } } }; vst(i.dataset.vp); lnk(i.dataset.vp); });
  loadProjects();
  o.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => publish(b.dataset.pub, b));
  refreshBadges();
}
/* empreinte d'une page : sert à savoir ce qui a changé depuis la dernière publication */
const shaCache = new WeakMap();
async function sha1(x) { const buf = typeof x === 'string' ? new TextEncoder().encode(x) : await x.arrayBuffer(); return [...new Uint8Array(await crypto.subtle.digest('SHA-1', buf))].map(v => v.toString(16).padStart(2, '0')).join(''); }
async function entries(files) { const out = []; for (const [p, v] of Object.entries(files)) { let sha = typeof v === 'string' ? await sha1(v) : (shaCache.get(v) || (shaCache.set(v, await sha1(v)), shaCache.get(v))); out.push({ file: p, sha, size: typeof v === 'string' ? new TextEncoder().encode(v).length : v.size }); } return out.sort((a, b) => a.file < b.file ? -1 : 1); }
const hashOf = es => es.map(e => e.file + ':' + e.sha).join('|');
let bdT = 0;
function refreshBadges() {
  clearTimeout(bdT); bdT = setTimeout(async () => {
    if (!cur || !cur.fiche || !$('#out')) return; const id = cur.id;
    for (const k of PUB) {
      const el = $('#bd-' + k); if (!el || !document.querySelector(`[data-pub="${k}"]`)) continue;
      try {
        const files = await make(k); if (!files || cur.id !== id) continue; const h = hashOf(await entries(files)), p = (cur.pub || {})[k];
        el.className = 'bd ' + (!p ? 'n' : p.hash === h ? 'ok' : 'mod'); el.textContent = !p ? 'jamais publiée' : p.hash === h ? '✓ à jour' : '● modifiée';
        const pl = $('#pl-' + k); if (pl && p && !pl.dataset.live) pl.innerHTML = `<small>Publiée le ${new Date(p.at).toLocaleString('fr-FR')} · <a href="${esc(p.url)}" target="_blank">${esc(p.url.replace('https://', ''))}</a></small>`;
      } catch (e) { }
    }
  }, 600);
}
function b64(blob) { return new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(blob); }); }
async function publish(k, btn) {
  const name = projOf(k); if (!name) return alert('Donne un nom de projet Vercel.');
  const pr = (vproj || []).find(p => p.name === name);
  if (!confirm(pr ? `Mettre à jour « ${k} » ?\n\nProjet Vercel : ${name}\nAdresse en ligne : ${pr.domain}\n\nL'ancienne version de cette page sera remplacée. Les autres pages ne changent pas. (Retour arrière possible dans Vercel → Deployments.)` : `⚠ Le projet « ${name} » n'existe pas sur ton Vercel.\n\nUn NOUVEAU projet va être créé : la visite immersive ne sera PAS mise à jour.\nContinuer quand même ?`)) return;
  const t = btn.textContent; btn.disabled = true; const pl = $('#pl-' + k); const say = x => pl && (pl.innerHTML = '<small>' + x + '</small>');
  try {
    say('Préparation…'); const files = await make(k), es = await entries(files); let done = 0, i = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < es.length) { const e = es[i++]; const v = files[e.file]; await api('/api/publish', { mode: 'file', sha: e.sha, data: await b64(typeof v === 'string' ? new Blob([v]) : v) }); say(`Envoi ${++done}/${es.length}…`); } }));
    say('Déploiement…'); const r = await api('/api/publish', { mode: 'deploy', project: name, files: es });
    cur.pub = cur.pub || {}; cur.pub[k] = { hash: hashOf(es), at: Date.now(), project: name, url: pr ? 'https://' + pr.domain : r.url }; save();
    let st = r.state || '', t0 = Date.now(), err = '';
    while (!/^(READY|ERROR|CANCELED)$/.test(st) && Date.now() - t0 < 70000) { say('Mise en ligne… (' + (st || 'en attente') + ')'); await new Promise(x => setTimeout(x, 3000)); try { const q = await api('/api/publish', { mode: 'status', id: r.id }); st = q.state; err = q.error; } catch (e) { } }
    const live = pr ? pr.domain : r.url.replace('https://', '');
    if (st === 'READY') { pl.dataset.live = '1'; say(`✅ En ligne : <a href="https://${esc(live)}" target="_blank">${esc(live)}</a> — vérifie avec <a href="https://${esc(live)}/?visite=1" target="_blank">?visite=1</a>`); }
    else if (st === 'ERROR' || st === 'CANCELED') { delete cur.pub[k]; save(); say('<span style="color:#a1271b">❌ Échec du déploiement : ' + esc(err || st) + '</span>'); }
    else say('⏳ Déploiement lancé, toujours en cours : vérifie dans Vercel → Deployments.');
    refreshBadges();
  } catch (e) { say('<span style="color:#a1271b">' + esc(e.message) + '</span>'); } finally { btn.disabled = false; btn.textContent = t; }
}

/* ---------- liaisons ---------- */
function bind() {
  document.querySelectorAll('[data-l]').forEach(e => e.oninput = () => { cur.links[e.dataset.l] = e.value.trim(); save(); });
  $('#go').onclick = search;
  { const ps = $('#psave'); if (ps) ps.onclick = () => { saveProfile(); render(); const b2 = $('#psave'); if (b2) b2.textContent = '✔ Réglages mémorisés'; }; }
  { const bt = $('#cim'), fi = $('#cif'); if (bt) { bt.onclick = () => fi.click(); fi.onchange = () => { const l = [...fi.files]; fi.value = ''; if (l.length) importCarte(l, bt); }; } }
  { const a = $('#nch'), b = $('#nchr'); if (a) a.onclick = () => newCharte(false); if (b) b.onclick = () => newCharte(true); }
  const hsrc = async (html, add) => { if (!html || html.length < 200) return; let r = parseHtml(html); if (add && cur.src) r = { text: (cur.src.text + '\n\n=== PAGE SUIVANTE ===\n' + r.text).slice(0, 60000), images: [...new Set([...cur.src.images, ...r.images])].slice(0, 80) }; cur.src = r; save(); $('#hs').innerHTML = `✔ ${r.images.length} image(s) et ${r.text.length} caractères de texte détectés <a href="#" id="hx">effacer</a>`; $('#hh').value = ''; hx(); };
  const hx = () => { const x = $('#hx'); if (x) x.onclick = e => { e.preventDefault(); cur.src = null; save(); $('#hs').textContent = ''; }; }; hx();
  $('#hh').oninput = e => { const v = e.target.value; clearTimeout(window.__ht); window.__ht = setTimeout(() => hsrc(v), 400); };
  $('#hf').onclick = () => $('#hfi').click(); $('#hfi').onchange = async () => { const fl = [...$('#hfi').files]; let i = 0; for (const f of fl) await hsrc(await f.text(), i++ > 0 || !!(cur.src && $('#hadd') && $('#hadd').checked)); $('#hfi').value = ''; };
  const lgd = $('#lgd'), lgf = $('#lgf'); lgd.onclick = () => lgf.click(); lgf.onchange = () => lgf.files[0] && setLogo(lgf.files[0]);
  lgd.ondragover = e => { e.preventDefault(); lgd.classList.add('h'); }; lgd.ondragleave = () => lgd.classList.remove('h'); lgd.ondrop = e => { e.preventDefault(); lgd.classList.remove('h'); e.dataTransfer.files[0] && setLogo(e.dataTransfer.files[0]); };
  const f = cur.fiche; if (!f) return;
  document.querySelectorAll('[data-f]').forEach(e => { e.oninput = e.onchange = () => { f[e.dataset.f] = e.value; if (/^c[123]$/.test(e.dataset.f)) { f._colorsSet = true; if (cur.logoAuto) { clearTimeout(window.__mg); window.__mg = setTimeout(async () => { cur.logo = await monogram(f); save(); }, 400); } } save(); if (e.dataset.f === 'type' || e.dataset.f === 'carteTxt') renderOut(); if (e.dataset.f === 'btnC') renderBar(); }; });
  { const setB = v => { f.btnC = v; save(); render(); }; const ba = $('#btnauto'); if (ba) ba.onclick = () => setB(''); document.querySelectorAll('[data-bc]').forEach(b => b.onclick = () => setB(b.dataset.bc)); }
  document.querySelectorAll('[data-s]').forEach(e => e.oninput = () => { const k = e.dataset.s; f[k] = Object.assign({ fr: '', es: '', de: '', en: '' }, f[k], { fr: e.value }); save(); });
  document.querySelectorAll('[data-h]').forEach(e => e.oninput = () => { f.horaires = f.horaires || []; f.horaires[+e.dataset.h] = e.value; save(); });
  $('[data-sv]').oninput = e => { const old = Object.fromEntries((f.services || []).map(s => [s.fr, s])); f.services = e.target.value.split('\n').map(x => x.trim()).filter(Boolean).map(x => old[x] || { fr: x, es: x, de: x, en: x }); save(); };
  $('#fromlogo').onclick = async () => { if (!cur.logo) return alert('Dépose d\'abord un logo.'); const d = await dominant(cur.logo); if (!d) return alert('Logo trop neutre : choisis les couleurs à la main.'); Object.assign(f, d); save(); render(); };
  const phd = $('#phd'), phf = $('#phf'); phd.onclick = () => phf.click(); phf.onchange = () => addPhotos([...phf.files]);
  $('#pub2').onclick = async () => { const b = $('#pub2'); b.disabled = true; $('#pm').textContent = 'Import…'; const [ok, n] = await addPhotoUrls($('#pu').value); $('#pm').textContent = `${ok} photo(s) importée(s) sur ${n} lien(s)` + (ok < n ? ' — certains liens expirent vite : recopie-les juste avant.' : ''); b.disabled = false; if (ok) $('#pu').value = ''; };
  phd.ondragover = e => { e.preventDefault(); phd.classList.add('h'); }; phd.ondragleave = () => phd.classList.remove('h'); phd.ondrop = e => { e.preventDefault(); phd.classList.remove('h'); addPhotos([...e.dataTransfer.files]); };
  $('#all').onclick = downloadAll;
  paintNotes();
  $('#cs').onclick = sendChat; $('#ci').onkeydown = e => { if (e.key === 'Enter') sendChat(); };
  $('#cu').onclick = () => { if (!undo) return; cur.fiche = undo.fiche; cur.photos = undo.photos; cur.fond = undo.fond; undo = null; (cur.chat = cur.chat || []).push({ r: 'a', t: '↶ Dernière modification annulée.' }); save(); render(); };
}


/* ---------- assistant ---------- */
let undo = null;
function chatHtml() {
  const h = (cur.chat || []).map(m => `<div class="cm ${m.r}">${esc(m.t).replace(/\n/g, '<br>')}</div>`).join('');
  return `<div class="card"><h2>💬 Assistant de la fiche</h2><p class="hint">Dis ce que tu veux changer : « ajoute un menu enfant à 9 € dans la carte », « passe le dimanche en fermé », « retire la photo 3 », « mets la photo 5 en fond d'intro », « vérifie le téléphone sur Google », « réécris la description plus chaleureuse ».</p>
   <div id="chat">${h}</div><div class="row"><input id="ci" style="flex:1;min-width:220px;margin:0" placeholder="Écris ta demande…"><button class="b" id="cs">Envoyer</button><button class="b o s" id="cu" ${undo ? '' : 'disabled'}>↶ Annuler</button></div></div>`;
}
const LAB = { avis: 'note Google', videoTitre: 'titre vidéo', videoSur: 'étiquette vidéo', videoTexte: 'texte vidéo', style: 'style des pages', pstyle: 'style de la page', nom: 'nom', ville: 'ville', type: 'type', slogan: 'accroche', descCourte: 'description courte', description: 'description longue', adresse: 'adresse', tel: 'téléphone', email: 'e-mail', site: 'site', facebook: 'Facebook', instagram: 'Instagram', booking: 'lien de réservation', horaires: 'horaires', services: 'services', carteTxt: 'carte', c1: 'couleurs', c2: 'couleurs', c3: 'couleurs', police: 'police', logoForme: 'forme du logo' };
function applyAssist(r) {
  const f = cur.fiche, ch = new Set();
  undo = { fiche: JSON.parse(JSON.stringify(f)), photos: cur.photos.slice(), fond: cur.fond };
  for (const [k, v] of Object.entries(r.patch || {})) {
    if (k === 'slogan' || k === 'descCourte' || k === 'description') f[k] = Object.assign(obj4(f[k]), { fr: String(v?.fr ?? v ?? '') });
    else if (k === 'services') { const old = Object.fromEntries((f.services || []).map(x => [x.fr, x])); f.services = (Array.isArray(v) ? v : []).map(x => String(x?.fr ?? x).trim()).filter(Boolean).map(x => old[x] || { fr: x, es: x, de: x, en: x }); }
    else if (k === 'pstyle') f.pstyle = Object.assign({}, f.pstyle, Object.fromEntries(Object.entries(v && typeof v === 'object' ? v : {}).filter(([, b]) => ['1', '2', '3', '4', '5', '6'].includes(String(b))).map(([a, b]) => [a, String(b)])));
    else if (k === 'horaires') f.horaires = (Array.isArray(v) ? v : []).slice(0, 7).map(String);
    else f[k] = String(v ?? '');
    if (/^c[123]$/.test(k)) f._colorsSet = true; ch.add(LAB[k] || k);
  }
  const rm = (r.actions || []).filter(a => a.type === 'remove_photo').map(a => +a.n - 1).filter(i => i >= 0 && i < cur.photos.length).sort((a, b) => b - a);
  rm.forEach(i => { cur.photos.splice(i, 1); if (cur.fond > i) cur.fond--; }); if (rm.length) ch.add('photos');
  (r.actions || []).filter(a => a.type === 'set_fond').forEach(a => { const i = +a.n - 1; if (i >= 0 && i < cur.photos.length) { cur.fond = i; ch.add('photo de fond'); } });
  if (cur.fond >= cur.photos.length) cur.fond = 0;
  if (!ch.size) undo = null; return [...ch];
}
async function sendChat() {
  const i = $('#ci'), t = i.value.trim(); if (!t || !cur.fiche) return;
  const f = cur.fiche, lite = Object.assign({}, f, { slogan: f.slogan?.fr || '', descCourte: f.descCourte?.fr || '', description: f.description?.fr || '', services: (f.services || []).map(s => s.fr) }); Object.keys(lite).filter(k => k[0] === '_').forEach(k => delete lite[k]);
  cur.chat = cur.chat || []; const hist = cur.chat.slice(-6); cur.chat.push({ r: 'u', t }); i.value = ''; $('#chat').insertAdjacentHTML('beforeend', `<div class="cm u">${esc(t)}</div><div class="cm a" id="cw">…</div>`); $('#cs').disabled = true;
  try {
    const r = await api('/api/fiche', { mode: 'assist', instruction: t, fiche: lite, nbPhotos: cur.photos.length, fond: cur.fond, history: hist }), ch = applyAssist(r);
    cur.chat.push({ r: 'a', t: (r.message || 'Fait.') + (ch.length ? '\n✔ Modifié : ' + ch.join(', ') : '') });
  } catch (e) { cur.chat.push({ r: 'a', t: 'Erreur : ' + e.message }); }
  save(); render(); const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; $('#ci') && $('#ci').focus();
}


/* ---------- points à confirmer : OK / KO puis « Confirmer » ---------- */
const nn = () => (cur.notes = (cur.notes || []).map(n => typeof n === 'string' ? { t: n, s: '', c: '' } : n));
function liteFiche() { const f = cur.fiche, l = Object.assign({}, f, { slogan: f.slogan?.fr || '', descCourte: f.descCourte?.fr || '', description: f.description?.fr || '', services: (f.services || []).map(x => x.fr) }); Object.keys(l).filter(k => k[0] === '_').forEach(k => delete l[k]); return l; }
function paintNotes() {
  const el = $('#notes'); if (!el) return; nn(); if (!cur.notes.length) { el.style.display = 'none'; return; } el.style.display = '';
  const sel = cur.notes.filter(n => n.s).length;
  el.innerHTML = '<b>À confirmer — marque chaque point : OK (je garde) ou KO (je corrige)</b>' + cur.notes.map((n, i) => `<div class="ni"><div class="nt">${esc(n.t)}</div><div class="nb"><button class="ok ${n.s === 'ok' ? 'on' : ''}" data-i="${i}" data-s="ok">✓ OK</button><button class="ko ${n.s === 'ko' ? 'on' : ''}" data-i="${i}" data-s="ko">✗ KO</button></div>${n.s ? `<div class="row" style="flex-wrap:nowrap;gap:6px"><input class="nc" style="flex:1;margin-top:6px" data-i="${i}" placeholder="${n.s === 'ko' ? 'La bonne info (ex. : tel 04 68 00 00 00, fermé le lundi…)' : 'Une précision à ajouter ? (facultatif)'}" value="${esc(n.c || '')}"><button class="b s na" data-i="${i}" style="margin-top:6px" title="Appliquer tout de suite ce point">Appliquer</button></div>` : ''}</div>`).join('') + `<div class="row" style="margin-top:10px"><button class="b" id="nconf" ${sel ? '' : 'disabled'}>Confirmer la sélection (${sel})</button><button class="b o s" id="nallok">Tout marquer OK</button></div>`;
  el.querySelectorAll('.nb button').forEach(b => b.onclick = () => { const n = cur.notes[+b.dataset.i]; n.s = n.s === b.dataset.s ? '' : b.dataset.s; save(); paintNotes(); });
  el.querySelectorAll('.nc').forEach(i => { i.oninput = () => { cur.notes[+i.dataset.i].c = i.value; save(); }; i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); applyOne(+i.dataset.i); } }; });
  el.querySelectorAll('.na').forEach(b => b.onclick = () => applyOne(+b.dataset.i));
  $('#nallok').onclick = () => { cur.notes.forEach(n => n.s = 'ok'); save(); paintNotes(); };
  $('#nconf').onclick = confirmNotes;
}
async function applyOne(i) {
  nn(); const n = cur.notes[i]; if (!n) return; if (!n.s) n.s = 'ko';
  const b = document.querySelector(`.na[data-i="${i}"]`); if (b) { b.disabled = true; b.textContent = '…'; }
  const ins = `Point « à confirmer » : ${n.t}\n` + (n.c ? `Information donnée par l'utilisateur (source fiable, à appliquer telle quelle à la fiche) : ${n.c}` : 'Marqué KO par l\'utilisateur : corrige ou vide le champ concerné si tu ne trouves rien de fiable.');
  try {
    const r = await api('/api/fiche', { mode: 'assist', instruction: ins, fiche: liteFiche(), nbPhotos: cur.photos.length, fond: cur.fond, history: [] }), ch = applyAssist(r);
    cur.chat = cur.chat || []; cur.chat.push({ r: 'a', t: (r.message || 'Corrigé.') + (ch.length ? '\n✔ Modifié : ' + ch.join(', ') : '') });
    cur.notes.splice(i, 1); cur.notes.push(...(r.notes || []).map(t => ({ t: String(t), s: '', c: '' }))); save(); render();
  } catch (e) { alert(e.message); paintNotes(); }
}
async function confirmNotes() {
  nn(); const ok = cur.notes.filter(n => n.s === 'ok' && !(n.c || '').trim()), ko = cur.notes.filter(n => n.s === 'ko' || (n.s === 'ok' && (n.c || '').trim())); if (!ok.length && !ko.length) return;
  const b = $('#nconf'); b.disabled = true; b.textContent = 'Traitement…'; let extra = [], line = [];
  if (ko.length) {
    const ins = 'Ces points « à confirmer » sont marqués KO ou accompagnés d\'une information par l\'utilisateur : corrige la fiche en conséquence.\n' + ko.map((n, i) => `${i + 1}. ${n.t}${n.c ? '\n   Précision de l\'utilisateur : ' + n.c : ''}`).join('\n') + '\nSi une précision donne la bonne valeur, applique-la telle quelle. Sinon cherche une meilleure source ; si tu ne trouves rien de fiable, vide le champ concerné plutôt que de garder une donnée douteuse.' + (ok.length ? '\nPoints validés OK (ne les remets pas en question) :\n' + ok.map(n => '- ' + n.t).join('\n') : '');
    try {
      const r = await api('/api/fiche', { mode: 'assist', instruction: ins, fiche: liteFiche(), nbPhotos: cur.photos.length, fond: cur.fond, history: [] }), ch = applyAssist(r);
      extra = r.notes || []; line.push((r.message || 'Corrigé.') + (ch.length ? '\n✔ Modifié : ' + ch.join(', ') : ''));
    } catch (e) { alert(e.message); paintNotes(); return; }
  }
  cur.chat = cur.chat || []; cur.chat.push({ r: 'a', t: `Points à confirmer traités : ${ok.length} OK, ${ko.length} KO.` + (line.length ? '\n' + line.join('\n') : '') });
  cur.notes = cur.notes.filter(n => !n.s).concat(extra.map(t => ({ t: String(t), s: '', c: '' })));
  save(); render();
}


/* ---------- lecture d'un code HTML collé (Facebook, Instagram, site…) ---------- */
function parseHtml(raw) {
  const html = raw.replace(/\\\//g, '/').replace(/\\u0025/gi, '%').replace(/\\u0026/gi, '&').replace(/\\u002F/gi, '/').replace(/&amp;/g, '&');
  const best = new Map(), size = u => { const m = u.match(/[sp](\d{2,4})x\d{2,4}/); return m ? +m[1] : 9999; };
  for (const m of html.matchAll(/https?:\/\/[^"'\s<>()\\]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>()\\]*)?/gi)) {
    const u = m[0]; if (/rsrc\.php|static\.xx|emoji|sprite|favicon|\/s(16|24|32|40|48|50|64|72|96|100|120)x|[sp](16|24|32|40|48|50|64|72|96|100|120)x/i.test(u) || /logo|icon|avatar|flag/i.test(u.split('?')[0])) continue;
    const key = u.split('?')[0].split('/').pop(); if (!best.has(key) || size(u) > size(best.get(key))) best.set(key, u);
  }
  const doc = new DOMParser().parseFromString(raw, 'text/html'), meta = [...doc.querySelectorAll('meta[property^="og:"],meta[name="description"],title')].map(e => e.content || e.textContent).filter(Boolean).join(' — ');
  doc.querySelectorAll('script,style,noscript,svg,iframe').forEach(e => e.remove());
  const vis = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  const js = []; for (const m of raw.matchAll(/"(?:text|message|description|name)":"((?:[^"\\]|\\.){20,500})"/g)) { try { js.push(JSON.parse('"' + m[1] + '"')); } catch (e) { } if (js.length > 120) break; }
  const text = [meta, vis.slice(0, 9000), [...new Set(js)].join('\n').slice(0, 9000)].filter(Boolean).join('\n').slice(0, 22000);
  return { text, images: [...best.values()].slice(0, 60) };
}

/* ---------- recherche ---------- */
async function search() {
  const L = cur.links, b = $('#go'); b.disabled = true; msg('Recherche en cours (site, sources publiques, horaires, carte)…');
  try {
    const r = await api('/api/fiche', { mode: 'search', site: L.site, facebook: L.facebook, instagram: L.instagram, autres: L.autres, nom: L.nom, type: L.type, adresse: L.adresse || '', ville: L.ville || '', tel: L.tel || '', pageText: cur.src?.text || '', pageImages: cur.src?.images || [] });
    const x = r.fiche || {}, f = cur.fiche || {};
    cur.fiche = Object.assign({ police: 'serif', logoForme: 'rond' }, f, {
      type: L.type || x.type || 'restaurant', nom: x.nom || L.nom || '', ville: x.ville || '', slogan: obj4(x.slogan), descCourte: obj4(x.descCourte), description: obj4(x.description), adresse: x.adresse || '', tel: x.tel || '', email: x.email || '',
      site: x.site || L.site || '', facebook: x.facebook || L.facebook || '', instagram: x.instagram || L.instagram || '', booking: x.reservation_url || '',
      horaires: Array.isArray(x.horaires) ? x.horaires.slice(0, 7) : [], services: (x.services || []).map(obj4),
      carteTxt: (x.carte || []).map(c => '# ' + c.cat + '\n' + (c.items || []).map(i => [i.nom, i.prix || '', i.desc || ''].join(' | ')).join('\n')).join('\n'),
      c1: '', c2: '', c3: ''
    });
    { const others = (await dbAll()).filter(p => !p.del && p.id !== cur.id), gp = uniquePalette(cur.fiche, others), th = /^#[0-9a-f]{6}$/i.test(r.theme || '') && satOf(r.theme) > .3 && !/^#(2b899d|1f2a44)$/i.test(r.theme) ? r.theme : null;
      Object.assign(cur.fiche, th ? { c2: th, c1: mix(th, '#000000', .72), c3: mix(th, '#ffffff', .5) } : gp); cur.fiche.style = leastUsedStyle(cur.fiche, others); }
    cur.notes = x.notes || []; cur.fiche._trh = ''; applyProfile(); cur._tab = 'pages';
    save(); render(); msg('Fiche trouvée. Récupération du logo et des photos…', 'i');
    // logo : on essaie tous les candidats (site, réseaux, favicon), puis monogramme rond en dernier recours
    if (!cur.logo || cur.logoAuto) { let got = false;
      for (const u of r.logos || []) { try { const bl = await api('/api/img?u=' + encodeURIComponent(u), null, true), bm = await bmOf(bl); if (Math.max(bm.width, bm.height) < 120) continue; await setLogo(bl); got = true; break; } catch (e) { } }
      if (!got && !cur.logo) { cur.logo = await monogram(cur.fiche); cur.logoLight = true; cur.logoAuto = true; }
    }
    // photos
    const pool = (r.photos || []).slice(0, 36); let n = 0, i = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < pool.length && cur.photos.length < 24) { const u = pool[i++]; try { const bl = await api('/api/img?u=' + encodeURIComponent(u), null, true), p = await toJpeg(bl); if (Math.max(p.w, p.h) < 600) continue; cur.photos.push({ id: 'i' + Date.now() + (n++), blob: p.blob }); } catch (e) { } } }));
    if (cur.logo && !cur.logoAuto && !cur.fiche._colorsSet) { const d = await dominant(cur.logo); if (d) Object.assign(cur.fiche, d); }
    if (cur.logoAuto) { cur.logo = await monogram(cur.fiche); }
    save(); render(); msg(cur.photos.length ? `Terminé : ${cur.photos.length} photo(s)${cur.logo ? ', logo trouvé' : ', pas de logo (dépose-le ci-dessus)'}. Vérifie la fiche.` : 'Fiche créée, mais aucune photo récupérée automatiquement (le site n\'en expose pas, et Facebook / Instagram bloquent les robots). Ajoute-les dans « 4 Photos » : glisser-déposer, Cmd+V, ZIP ou liens d\'images.', cur.photos.length ? 'k' : 'i');
  } catch (e) { render(); msg(e.message, 'e'); } finally { const g = $('#go'); if (g) g.disabled = false; }
}

/* ---------- génération ---------- */
const hashTr = f => JSON.stringify([f.slogan?.fr, f.descCourte?.fr, f.description?.fr, (f.services || []).map(s => s.fr), f.carteTxt || '']);
const carteCats = f => parseCarte(f.carteTxt);
let trFail = '';
async function ensureTr(f) {
  if (hashTr(f) === f._trh || hashTr(f) === trFail) return; if (!f.slogan?.fr && !f.descCourte?.fr && !f.description?.fr && !(f.services || []).length && !f.carteTxt) return;
  try {
    const to = (pr, ms) => Promise.race([pr, new Promise((_, ko) => setTimeout(() => ko(new Error('délai dépassé')), ms))]);
    const allDescs = carteCats(f).flatMap(c => c.items.filter(i => i.desc).map(i => i.desc)).slice(0, 400);
    const chunks = []; for (let i = 0; i < allDescs.length; i += 20) chunks.push(allDescs.slice(i, i + 20));
    const main = to(api('/api/fiche', { mode: 'translate', slogan: f.slogan?.fr || '', descCourte: f.descCourte?.fr || '', description: f.description?.fr || '', services: (f.services || []).map(s => s.fr), cats: carteCats(f).map(c => c.cat), descs: [] }), 50000);
    const parts = chunks.map(d => to(api('/api/fiche', { mode: 'translate', slogan: '', descCourte: '', description: '', services: [], cats: [], descs: d }), 50000).then(x => x.descs || []).catch(() => d.map(() => ({}))));
    const r = await main; r.descs = (await Promise.all(parts)).flat();
    f.carteTr = { cats: (r.cats || []), descs: (r.descs || []), n: carteCats(f).flatMap(c => c.items.filter(i => i.desc)).length };
    ['slogan', 'descCourte', 'description'].forEach(k => { f[k] = Object.assign(obj4(f[k]), r[k] || {}, { fr: f[k]?.fr || '' }); });
    f.services = (f.services || []).map((s, i) => Object.assign(obj4(s), (r.services || [])[i] || {}, { fr: s.fr })); f._trh = hashTr(f); save();
  } catch (e) { trFail = hashTr(f); const m = $('#msg2'); if (m) m.innerHTML = '<p class="hint" style="margin-top:10px">Traduction automatique indisponible : les pages seront en français pour ES/DE/EN. (' + esc(e.message) + ')</p>'; }
}
const fontCache = {};
async function resolve(files) {
  const m = {};
  for (const [p, v] of Object.entries(files)) {
    if (typeof v === 'string' || v instanceof Blob) m[p] = v;
    else if (v && v.url) { fontCache[v.url] = fontCache[v.url] || await (await fetch(v.url)).blob(); m[p] = fontCache[v.url]; }
  }
  return m;
}
async function make(k) { await ensureTr(cur.fiche); const out = await buildAll({ fiche: cur.fiche, photos: cur.photos, videos: cur.videos || [], logo: cur.logo, fond: cur.fond }, [k]); return out[k] ? resolve(out[k]) : null; }
const slug = () => slugOf(cur.fiche.nom);
const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
async function zipOf(files) { const z = new JSZip(); for (const [p, v] of Object.entries(files)) z.file(p, v); return z.generateAsync({ type: 'blob', compression: 'DEFLATE' }); }
async function download(k, btn) {
  const t = btn.textContent; btn.disabled = true; btn.textContent = '…';
  try { const f = await make(k); if (f) dl(await zipOf(f), `${slug()}-${k}.zip`); } catch (e) { alert(e.message); } finally { btn.disabled = false; btn.textContent = t; }
}
async function downloadAll() {
  const b = $('#all'); b.disabled = true; b.textContent = 'Génération…';
  try {
    await ensureTr(cur.fiche); const out = await buildAll({ fiche: cur.fiche, photos: cur.photos, videos: cur.videos || [], logo: cur.logo, fond: cur.fond });
    for (const [k, files] of Object.entries(out)) { dl(await zipOf(await resolve(files)), `${slug()}-${k}.zip`); await new Promise(r => setTimeout(r, 700)); }
  } catch (e) { alert(e.message); } finally { b.disabled = false; b.textContent = '⬇ Tout télécharger (ZIP séparés)'; }
}
async function preview(k) {
  const files = await make(k); if (!files) return; $('#mt').textContent = 'Aperçu — ' + k; const mb = $('#mb'); $('#modal').classList.add('on');
  if (k === 'boutons') {
    $('#mr').style.display = 'none'; mb.innerHTML = '<div class="bt" style="display:block"></div>'; const g = mb.firstChild, ST = [['normal', 'Normal'], ['survol', 'Survol'], ['presse', 'Pressé']], rows = {};
    Object.keys(files).filter(p => /\/128\//.test(p)).forEach(p => { const m = p.match(/_([a-z]+)_(normal|survol|presse)\.png$/); if (m) (rows[m[1]] = rows[m[1]] || {})[m[2]] = files[p]; });
    g.innerHTML = '<p style="margin:0 0 12px;font:600 13px system-ui;color:#334">Chaque bouton existe en 3 états : normal, survol, pressé (croix incluse).</p>';
    Object.keys(rows).sort((a, b) => (b === 'fermer') - (a === 'fermer')).forEach(k => {
      const r = document.createElement('div'); r.style.cssText = 'display:flex;align-items:center;gap:14px;background:#fff;border-radius:12px;padding:8px 14px;margin-bottom:8px';
      r.innerHTML = `<b style="width:110px;font:600 13px system-ui">${k === 'fermer' ? '✕ Croix (fermer)' : k}</b>`;
      ST.forEach(([st, lb]) => { const c = document.createElement('div'); c.style.cssText = 'text-align:center;font:11px system-ui;color:#667'; const im = new Image(); im.width = 72; im.src = URL.createObjectURL(rows[k][st]); c.append(im, document.createElement('br'), lb); r.appendChild(c); });
      g.appendChild(r);
    }); return;
  }
  $('#mr').style.display = '';
  let html = files['index.html'];
  for (const [p, v] of Object.entries(files)) if (p !== 'index.html') html = html.split(p).join(URL.createObjectURL(v));
  const run = () => { mb.innerHTML = ''; const fr = document.createElement('iframe'); fr.srcdoc = html; fr.style.cssText = 'flex:1;border:0;width:100%'; mb.appendChild(fr); };
  run(); $('#mr').onclick = run;
}
$('#mc').onclick = () => { $('#modal').classList.remove('on'); $('#mb').innerHTML = ''; };
$('#new').onclick = () => openFinder();
(async () => { const all = (await dbAll()).filter(p => !p.del); all.sort((a, b) => b.upd - a.upd); cur = all[0] || null; renderList(); render(); })();

/* ---------- création depuis des liens collés (Facebook, Instagram, site, Google Maps…) ---------- */
const urlsIn = v => (String(v).match(/https?:\/\/[^\s,;]+/gi) || []);
async function fromLinks(v, ville = '') {
  const us = urlsIn(v), L = { site: '', facebook: '', instagram: '', autres: '', nom: '', type: '' }, rest = [];
  for (const u of us) { if (/facebook\.com|fb\.com|fb\.me/i.test(u) && !L.facebook) L.facebook = u; else if (/instagram\.com/i.test(u) && !L.instagram) L.instagram = u; else if (!/facebook|instagram|google\.[a-z]+\/maps|goo\.gl|maps\.app|tripadvisor|airbnb|booking|thefork|lafourchette|tiktok|linktr|pagesjaunes/i.test(u) && !L.site) L.site = u; else rest.push(u); }
  L.autres = rest.join(' '); L.ville = ville;
  cur = newProject(); Object.assign(cur.links, L); await dbPut(cur); renderList(); render(); window.scrollTo(0, 0); search();
}


/* ---------- charte graphique : jamais la même d'un établissement à l'autre ---------- */
const hueOf = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const satOf = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
const hdist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
function uniquePalette(f, others, rnd) {
  const used = others.map(p => p.fiche && /^#[0-9a-f]{6}$/i.test(p.fiche.c2 || '') ? hueOf(p.fiche.c2) : null).filter(x => x != null), H = hashStr(f.nom), cands = [];
  for (let i = 0; i < 24; i++) { const h = (i * 15 + H % 15) % 360; if (h > 165 && h < 210) continue; cands.push([h, (used.length ? Math.min(...used.map(u => hdist(h, u))) : 180) + ((i * 7 + H) % 5) * .01]); }
  cands.sort((a, b) => b[1] - a[1]); const h = (rnd ? cands[Math.floor(Math.random() * Math.min(4, cands.length))] : cands[0])[0];
  const sa = 52 + (H >> 3) % 16, l2 = 44 + (H >> 5) % 7;
  return { c1: hsl(h, 34 + (H >> 7) % 14, 13 + (H >> 9) % 4), c2: hsl(h, sa, l2), c3: hsl(h + 22, sa + 4, l2 + 18) };
}
function leastUsedStyle(f, others) {
  const n = { 1: 0, 2: 0, 3: 0, 4: 0 }, H = hashStr(f.nom); others.forEach(p => { if (p.fiche) n[styleOf(p.fiche)]++; });
  return ['1', '2', '3', '4'].sort((a, b) => n[a] - n[b] || ((H + +a) % 7) - ((H + +b) % 7))[0];
}
async function newCharte(rnd) {
  const f = cur.fiche, others = (await dbAll()).filter(p => !p.del && p.id !== cur.id), pal = uniquePalette(f, others, rnd);
  Object.assign(f, pal, { _colorsSet: true }); if (rnd) f.style = ['1', '2', '3', '4'].filter(x => x !== styleOf(f))[Math.floor(Math.random() * 3)];
  if (cur.logoAuto) cur.logo = await monogram(f); save(); render();
}

/* ---------- recherche d'un établissement ---------- */
const norm = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
async function runSearch() {
  const v = $('#q').value.trim(), box = $('#qr'); if (!v) { box.className = ''; return; }
  const all = (await dbAll()).filter(p => !p.del), k = norm(v);
  const hit = all.filter(p => norm([p.fiche?.nom, p.fiche?.ville, p.fiche?.adresse, p.fiche?.tel, p.fiche?.site, p.links?.nom, p.links?.site, p.links?.facebook, p.links?.instagram].join(' ')).includes(k)).sort((a, b) => b.upd - a.upd).slice(0, 6);
  box.innerHTML = hit.map(p => `<div data-id="${p.id}">📍 <b>${esc(p.fiche?.nom || p.links.nom || p.links.site || 'Sans nom')}</b><small>${esc(p.fiche?.ville || '')}</small></div>`).join('') + `<div data-new="1">＋ Nouvel établissement : <b>${esc(v)}</b></div>`;
  box.className = 'on'; box.firstChild.classList.add('sel');
  box.querySelectorAll('div').forEach(d => d.onclick = async () => {
    if (d.dataset.id) cur = all.find(p => p.id === d.dataset.id);
    else if (!/^https?:\/\//i.test(v)) { $('#q').value = ''; box.className = ''; openFinder(v); return; }
    else if (urlsIn(v).length) { $('#q').value = ''; box.className = ''; await fromLinks(v, getCity().nom); return; }
    else { $('#q').value = ''; box.className = ''; openFinder(v); return; }
    $('#q').value = ''; box.className = ''; renderList(); render(); window.scrollTo(0, 0);
  });
}
$('#q').oninput = runSearch;
$('#q').onkeydown = e => { const b = $('#qr'); if (e.key === 'Enter') { const s = b.querySelector('.sel') || b.firstChild; s && s.click(); } if (e.key === 'Escape') { b.className = ''; } if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { const l = [...b.children], i = l.findIndex(x => x.classList.contains('sel')), n = (i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length; l.forEach(x => x.classList.remove('sel')); l[n] && l[n].classList.add('sel'); e.preventDefault(); } };
document.addEventListener('click', e => { if (!e.target.closest('#sw')) $('#qr').className = ''; });

/* ---------- nouvel établissement : trouver par ville, nom, adresse ou catégorie ---------- */
const DEF_CITY = { nom: 'Narbonne', insee: '11262', cp: '11100' };
const getCity = () => { try { return JSON.parse(localStorage.getItem('ng_city')) || DEF_CITY; } catch (e) { return DEF_CITY; } };
const getCities = () => { try { return JSON.parse(localStorage.getItem('ng_cities')) || [DEF_CITY]; } catch (e) { return [DEF_CITY]; } };
function setCity(c) { try { localStorage.setItem('ng_city', JSON.stringify(c)); const l = [c, ...getCities().filter(x => x.insee !== c.insee)].slice(0, 8); localStorage.setItem('ng_cities', JSON.stringify(l)); } catch (e) { } }
const CATS = [['restaurant', '🍽 Restaurants'], ['bar', '☕ Bars & cafés'], ['hebergement', '🛏 Hébergements'], ['camping', '⛺ Campings'], ['commerce', '🛍 Commerces']];
function openFinder(pre = '') {
  document.getElementById('fm')?.remove();
  let city = getCity();
  const d = document.createElement('div'); d.id = 'fm'; d.style.cssText = 'position:fixed;inset:0;background:rgba(10,18,30,.7);display:flex;align-items:flex-start;justify-content:center;z-index:60;padding:6vh 16px';
  d.innerHTML = `<div class="card" style="width:min(680px,100%);max-height:88vh;overflow:auto"><h2>＋ Nouvel établissement</h2><p class="hint">Choisis la ville, puis tape un nom, une adresse exacte ou colle directement un lien (Facebook, Instagram, site, Google Maps…), ou parcours une catégorie. Je cherche tout le reste et je crée la fiche complète.</p>
   <label style="position:relative">Ville<input id="fc" autocomplete="off" value="${esc(city.nom)}" placeholder="Tape une ville…"><div id="fcl" style="position:absolute;top:62px;left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.16);z-index:5;display:none"></div></label>
   <div class="row" id="rc" style="margin:-4px 0 12px"></div>
   <div class="row"><input id="fq" style="flex:1;min-width:200px;margin:0" placeholder="Nom, adresse exacte, ou lien Facebook / Instagram / site / Google Maps" value="${esc(pre)}"><button class="b" id="fs">Chercher</button></div>
   <div class="row" id="cats" style="margin-top:10px">${CATS.map(([k, n]) => `<button class="b o s" data-cat="${k}">${n}</button>`).join('')}</div>
   <div id="fr" style="margin-top:12px"></div>
   <div class="row" style="margin-top:14px"><button class="b o s" id="fw">🌐 Plus de propositions (recherche web)</button><button class="b o s" id="fl">Je préfère coller des liens</button><button class="b o s" id="fx" style="margin-left:auto">Fermer</button></div></div>`;
  document.body.appendChild(d); const q = d.querySelector('#fq'), fc = d.querySelector('#fc'), fcl = d.querySelector('#fcl'); (pre ? q : fc).focus();
  const close = () => d.remove(), show = html => d.querySelector('#fr').innerHTML = html;
  const chips = () => { d.querySelector('#rc').innerHTML = getCities().map(c => `<button class="b s ${c.insee === city.insee ? '' : 'o'}" data-i="${c.insee}">📍 ${esc(c.nom)}</button>`).join(''); d.querySelectorAll('#rc button').forEach(b => b.onclick = () => choose(getCities().find(c => c.insee === b.dataset.i))); };
  const choose = c => { city = c; setCity(c); fc.value = c.nom; fcl.style.display = 'none'; chips(); show(''); };
  chips();
  let t = 0; fc.oninput = () => { clearTimeout(t); t = setTimeout(async () => { const v = fc.value.trim(); if (v.length < 2) { fcl.style.display = 'none'; return; } try { const r = await (await fetch('https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,departement&boost=population&limit=6&nom=' + encodeURIComponent(v))).json(); fcl.innerHTML = r.map(c => `<div data-c='${esc(JSON.stringify({ nom: c.nom, insee: c.code, cp: (c.codesPostaux || [])[0] || '' }))}' style="padding:10px 14px;cursor:pointer;font-size:14px">📍 <b>${esc(c.nom)}</b> <small style="color:var(--mu)">${esc(c.departement?.nom || '')} ${esc((c.codesPostaux || [])[0] || '')}</small></div>`).join('') || '<div style="padding:10px 14px;color:var(--mu)">Aucune ville</div>'; fcl.style.display = 'block'; fcl.querySelectorAll('div[data-c]').forEach(e => { e.onmouseenter = () => e.style.background = '#e4f1f4'; e.onmouseleave = () => e.style.background = ''; e.onclick = () => choose(JSON.parse(e.dataset.c)); }); } catch (e) { } }, 250); };
  const KT = { restaurant: 'restaurant / bar', hebergement: 'hébergement', commerce: 'commerce' };
  const list = (arr, extra = '') => {
    show(extra + (arr.length ? arr.map((c, i) => `<div class="pick" data-i="${i}" style="padding:11px 14px;border:1.5px solid var(--line);border-radius:12px;margin-bottom:8px;cursor:pointer"><b>${esc(c.nom || '(adresse sans nom)')}</b>${c.type ? ` <small style="color:var(--b2)">· ${KT[c.type]}</small>` : ''}${c.site ? ' <small>🌐</small>' : ''}<br><small style="color:var(--mu)">${esc(c.adresse || '')}</small></div>`).join('') : '<p class="hint">Aucun résultat. Essaie « 🌐 Plus de propositions », ou précise le nom.</p>'));
    d.querySelectorAll('.pick').forEach(e => { e.onmouseenter = () => e.style.borderColor = 'var(--b2)'; e.onmouseleave = () => e.style.borderColor = ''; e.onclick = () => pick(arr[+e.dataset.i]); });
  };
  const withCity = v => { const n = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return n(v).includes(n(city.nom)) ? v : v + ', ' + city.nom; };
  const run = async web => {
    const v = q.value.trim(); if (v.length < 2) return;
    if (urlsIn(v).length) { close(); return fromLinks(v, city.nom); }
    show('<p class="hint">Recherche…</p>');
    try { let r = await api('/api/fiche', { mode: web ? 'suggest_web' : 'suggest', q: withCity(v), ville: city.nom }); if (!web && !(r.resultats || []).length) { show('<p class="hint">Rien dans la carte, je cherche sur le web…</p>'); r = await api('/api/fiche', { mode: 'suggest_web', q: withCity(v), ville: city.nom }); } list(r.resultats || []); } catch (e) { show(`<div id="msg" class="on e">${esc(e.message)}</div>`); }
  };
  d.querySelectorAll('[data-cat]').forEach(b => b.onclick = async () => {
    show('<p class="hint">Je parcours ' + esc(b.textContent) + ' à ' + esc(city.nom) + '…</p>');
    try { const r = await api('/api/fiche', { mode: 'browse', insee: city.insee, cat: b.dataset.cat, ville: city.nom }); list(r.resultats || [], `<p class="hint">${r.total} résultat(s) à ${esc(city.nom)} — ceux avec 🌐 ont un site officiel.</p>`); } catch (e) { show(`<div id="msg" class="on e">${esc(e.message)}</div>`); }
  });
  async function pick(c) {
    let nom = c.nom; if (!nom) { nom = prompt('Nom de l\'établissement à cette adresse ?') || ''; if (!nom) return; }
    close(); cur = newProject(); Object.assign(cur.links, { nom, adresse: c.adresse || '', ville: c.ville || city.nom, tel: c.tel || '', site: c.site || '', facebook: c.facebook || '', type: c.type || '' }); await dbPut(cur); renderList(); render(); window.scrollTo(0, 0); search();
  }
  d.querySelector('#fs').onclick = () => run(false); d.querySelector('#fw').onclick = () => run(true); d.querySelector('#fx').onclick = close;
  d.querySelector('#fl').onclick = async () => { close(); cur = newProject(); await dbPut(cur); renderList(); render(); };
  q.onkeydown = e => { if (e.key === 'Enter') run(false); if (e.key === 'Escape') close(); };
  if (pre.length > 2) run(false);
}

document.addEventListener('paste', e => { if (!cur || !cur.fiche) return; const fs = [...(e.clipboardData?.files || [])].filter(f => /^image\//.test(f.type)); if (fs.length) { e.preventDefault(); addPhotos(fs); } });
