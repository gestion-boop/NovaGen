/* NovaGen — interface */
const $ = s => document.querySelector(s);
const DAYN = DAYS.fr;
let cur = null, urls = [], saveT = 0, cityF = '';

/* ---------- stockage (IndexedDB) ---------- */
const idb = new Promise((ok, ko) => { const r = indexedDB.open('novagen', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = ko; });
const tx = async (m, fn) => { const d = await idb; return new Promise((ok, ko) => { const t = d.transaction('p', m), q = fn(t.objectStore('p')); t.oncomplete = () => ok(q && q.result); t.onerror = ko; }); };
const dbAll = () => tx('readonly', s => s.getAll());
const dbPut = p => tx('readwrite', s => s.put(p));
const dbDel = id => tx('readwrite', s => s.delete(id));
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
async function toPng(blob, max = 700) {
  const bm = await createImageBitmap(blob), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
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
  let n = 0; for (const f of files) { try { const r = await toJpeg(f); if (Math.max(r.w, r.h) < 500) continue; cur.photos.push({ id: 'i' + Date.now() + n++, blob: r.blob }); } catch (e) { } }
  save(); renderPhotos();
}
async function setLogo(blob) { cur.logo = await toPng(blob); cur.logoLight = await logoIsLight(cur.logo); if (!cur.fiche?._colorsSet) { const d = await dominant(cur.logo); if (d && cur.fiche) Object.assign(cur.fiche, d); } save(); render(); }

/* ---------- rendu ---------- */
function renderList() {
  dbAll().then(all => {
    all.sort((a, b) => b.upd - a.upd);
    all.filter(p => p.logo && p.logoLight === undefined).forEach(async p => { p.logoLight = await logoIsLight(p.logo); await dbPut(p); if (cur && cur.id === p.id) cur.logoLight = p.logoLight; renderList(); });
    const vs = [...new Set(all.map(p => p.fiche?.ville || p.links?.ville).filter(Boolean))].sort(); if (cityF && !vs.includes(cityF)) cityF = '';
    const shown = cityF ? all.filter(p => (p.fiche?.ville || p.links?.ville) === cityF) : all;
    $('#list').innerHTML = (vs.length > 1 ? `<select id="cf" style="margin:0 0 8px"><option value="">Toutes les villes (${all.length})</option>${vs.map(v => `<option ${v === cityF ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : '') + shown.map(p => `<div class="pj ${cur && cur.id === p.id ? 'on' : ''}" data-id="${p.id}">${p.logo ? `<img src="${URL.createObjectURL(p.logo)}" style="background:${logoBg(p)}">` : '<img>'}<div>${esc(p.fiche?.nom || p.links.nom || p.links.site || 'Nouveau')}<small>${esc(p.fiche?.ville || '')}</small></div><button class="x" data-del="${p.id}" title="Supprimer">✕</button></div>`).join('') || '<div class="hint" style="padding:6px">Aucun pour le moment.</div>';
    const cf = $('#cf'); if (cf) cf.onchange = () => { cityF = cf.value; renderList(); };
    document.querySelectorAll('.pj').forEach(e => e.onclick = async ev => {
      if (ev.target.dataset.del) { if (confirm('Supprimer cet établissement ?')) { await dbDel(ev.target.dataset.del); if (cur && cur.id === ev.target.dataset.del) cur = null; renderList(); render(); } return; }
      cur = all.find(p => p.id === e.dataset.id); render(); renderList();
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
   <div class="logo" style="margin-bottom:14px">${cur.logo ? `<img id="lg" src="${URL.createObjectURL(cur.logo)}" style="background:${logoBg(cur)}">` : ''}<div class="drop" id="lgd" style="flex:1">${cur.logo ? 'Remplacer le logo' : 'Déposer le logo (facultatif : sinon cherché sur le site)'}<input type="file" id="lgf" accept="image/*" hidden></div></div>
   <div class="row"><button class="b" id="go">🔎 Chercher les infos</button><span class="hint" style="margin:0">Compte 30 à 60 s.</span></div><div id="msg"></div></div>
  ${f ? ficheHtml(f) : ''}`;
  bind(); if (f) renderPhotos();
}
function ficheHtml(f) {
  const nt = (cur.notes || []).length ? `<div class="notes"><b>À confirmer</b>${cur.notes.map(n => '• ' + esc(n)).join('<br>')}</div>` : '';
  const v = (k, lab, ph = '') => `<label>${lab}<input data-f="${k}" value="${esc(f[k] || '')}" placeholder="${ph}"></label>`;
  return chatHtml() + `<div class="card"><h2><i>2</i> Fiche — vérifie et corrige</h2><p class="hint">Tout est modifiable. Les modifications sont enregistrées automatiquement.</p>${nt}
   <div class="g3">${v('nom', 'Nom')}${v('ville', 'Ville')}<label>Type<select data-f="type">${[['restaurant', 'Restaurant / bar / café'], ['hebergement', 'Hébergement'], ['commerce', 'Commerce / autre']].map(([x, n]) => `<option value="${x}" ${f.type === x ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
   <label>Accroche courte (sous le nom)<input data-s="slogan" value="${esc(f.slogan?.fr || '')}"></label>
   <label>Description<textarea data-s="description">${esc(f.description?.fr || '')}</textarea></label>
   <div class="g3">${v('adresse', 'Adresse')}${v('tel', 'Téléphone')}${v('email', 'E-mail')}</div>
   <div class="g3">${v('site', 'Site')}${v('facebook', 'Facebook')}${v('instagram', 'Instagram')}</div>
   ${v('booking', 'Lien de réservation en ligne (Airbnb, TheFork…)')}
   <div class="g2"><label>Horaires (un jour par ligne, vide ou « Fermé »)<div style="display:grid;gap:5px;margin-top:5px">${DAYN.map((d, i) => `<div style="display:grid;grid-template-columns:84px 1fr;gap:8px;align-items:center"><span style="font-weight:600;color:var(--ink)">${d}</span><input data-h="${i}" style="margin:0" value="${esc((f.horaires || [])[i] || '')}" placeholder="12h–14h · 19h–22h"></div>`).join('')}</div></label>
   <div><label>Services (un par ligne)<textarea data-sv rows="6">${esc((f.services || []).map(s => s.fr || s).join('\n'))}</textarea></label>
   <label>Carte — « # Catégorie » puis « Plat | prix | description »<textarea data-f="carteTxt" rows="8" placeholder="# Burgers&#10;Le Classique | 12,50 € | steak, cheddar">${esc(f.carteTxt || '')}</textarea></label></div></div></div>
  <div class="card"><h2><i>3</i> Style</h2><div class="g4">
   <label>Couleur sombre<input type="color" data-f="c1" value="${f.c1 || '#1f2a44'}"></label><label>Accent<input type="color" data-f="c2" value="${f.c2 || '#2b899d'}"></label><label>Survol des boutons<input type="color" data-f="c3" value="${f.c3 || '#f2b632'}"></label>
   <label>Titres<select data-f="police"><option value="serif" ${f.police !== 'sans' ? 'selected' : ''}>Élégant (serif + script)</option><option value="sans" ${f.police === 'sans' ? 'selected' : ''}>Moderne (Montserrat gras)</option></select></label></div>
   <div class="g2"><label>Forme du logo<select data-f="logoForme"><option value="libre" ${f.logoForme !== 'rond' ? 'selected' : ''}>Libre (logo tel quel)</option><option value="rond" ${f.logoForme === 'rond' ? 'selected' : ''}>Rond (cadre doré)</option></select></label><div style="padding-top:22px"><button class="b o s" id="fromlogo">🎨 Couleurs depuis le logo</button></div></div></div>
  <div class="card"><h2><i>4</i> Photos <small style="font-weight:400;color:var(--mu)" id="pc"></small></h2><p class="hint">★ = photo de fond de l'intro. ✕ = retirer. Tu peux en déposer d'autres.</p>
   <div class="drop" id="phd">Glisser des photos ici ou cliquer pour en ajouter<input type="file" id="phf" accept="image/*" multiple hidden></div><div class="ph" id="ph"></div></div>
  <div class="card"><h2><i>5</i> Générer</h2><p class="hint">Chaque ZIP se téléverse tel quel sur Vercel. Aperçu = exactement ce qui sera dans le ZIP.</p><div class="out" id="out"></div>
   <div class="row" style="margin-top:14px"><button class="b" id="all">⬇ Tout télécharger (ZIP séparés)</button></div><div id="msg2"></div></div>`;
}
function renderPhotos() {
  const ph = $('#ph'); if (!ph) return; urls.forEach(URL.revokeObjectURL); urls = [];
  ph.innerHTML = cur.photos.map((p, i) => { const u = URL.createObjectURL(p.blob); urls.push(u); return `<div><img src="${u}"><button class="f ${cur.fond === i ? 'on' : ''}" data-fond="${i}">★</button><button class="d" data-rm="${i}">✕</button></div>`; }).join('');
  $('#pc').textContent = `(${cur.photos.length})`;
  ph.querySelectorAll('[data-fond]').forEach(b => b.onclick = () => { cur.fond = +b.dataset.fond; save(); renderPhotos(); });
  ph.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const i = +b.dataset.rm; cur.photos.splice(i, 1); if (cur.fond >= cur.photos.length) cur.fond = 0; save(); renderPhotos(); });
  renderOut();
}
const PUB = ['intro', 'infos', 'galerie', 'carte', 'reservation'];
const defProject = k => (slug() + '-' + k).toLowerCase();
const projOf = k => ((cur.vp || {})[k] || defProject(k)).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
function renderOut() {
  const o = $('#out'); if (!o) return; const f = cur.fiche, heb = f.type === 'hebergement', hasC = parseCarte(f.carteTxt).length;
  const items = [['intro', 'Intro', '5 s · iris · signature NovaVisio'], ['infos', 'Point Info', 'horaires, adresse, contact, services'], ['galerie', 'Galerie', cur.photos.length + ' photo(s) + lightbox', !cur.photos.length], ['carte', 'Carte', 'plats et prix', heb || !hasC], ['reservation', heb ? 'Réservation / demande' : 'Réservation', 'récap + appel / e-mail / Messenger', f.type === 'commerce'], ['boutons', 'Boutons glossy', '30 icônes × 3 états, 256 et 128 px']];
  o.innerHTML = items.map(([k, n, d, off]) => `<div class="o" style="${off ? 'opacity:.45' : ''}"><b>${n} <span class="bd" id="bd-${k}"></span></b><small>${off ? 'Non disponible pour cette fiche' : d}</small>
   ${PUB.includes(k) && !off ? `<label style="margin:0;font-size:11px">Projet Vercel<input data-vp="${k}" value="${esc(projOf(k))}" style="margin-top:3px;padding:7px 9px;font-size:12.5px"></label>` : ''}
   <div class="row"><button class="b o s" data-pv="${k}" ${off ? 'disabled' : ''}>Aperçu</button><button class="b o s" data-dl="${k}" ${off ? 'disabled' : ''}>⬇ ZIP</button>${PUB.includes(k) && !off ? `<button class="b s" data-pub="${k}">🚀 Publier</button>` : ''}</div><div class="pl" id="pl-${k}"></div></div>`).join('');
  o.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => preview(b.dataset.pv));
  o.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => download(b.dataset.dl, b));
  o.querySelectorAll('[data-vp]').forEach(i => i.onchange = () => { cur.vp = cur.vp || {}; cur.vp[i.dataset.vp] = i.value.trim(); save(); });
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
        const pl = $('#pl-' + k); if (pl && p) pl.innerHTML = `<small>Publiée le ${new Date(p.at).toLocaleString('fr-FR')} · <a href="${esc(p.url)}" target="_blank">${esc(p.url.replace('https://', ''))}</a></small>`;
      } catch (e) { }
    }
  }, 600);
}
function b64(blob) { return new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(blob); }); }
async function publish(k, btn) {
  const name = projOf(k); if (!name) return alert('Donne un nom de projet Vercel.');
  if (!confirm(`Publier « ${k} » sur le projet Vercel « ${name} » ?\nL'ancienne version de cette page sera remplacée (les autres pages ne changent pas).`)) return;
  const t = btn.textContent; btn.disabled = true; const pl = $('#pl-' + k); const say = x => pl && (pl.innerHTML = '<small>' + x + '</small>');
  try {
    say('Préparation…'); const files = await make(k), es = await entries(files); let done = 0, i = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < es.length) { const e = es[i++]; const v = files[e.file]; await api('/api/publish', { mode: 'file', sha: e.sha, data: await b64(typeof v === 'string' ? new Blob([v]) : v) }); say(`Envoi ${++done}/${es.length}…`); } }));
    say('Déploiement…'); const r = await api('/api/publish', { mode: 'deploy', project: name, files: es });
    cur.pub = cur.pub || {}; cur.pub[k] = { hash: hashOf(es), at: Date.now(), project: name, url: r.url }; save();
    say(`✅ Publiée : <a href="${esc(r.url)}" target="_blank">${esc(r.url.replace('https://', ''))}</a> (en ligne dans ~20 s)`); refreshBadges();
  } catch (e) { say('<span style="color:#a1271b">' + esc(e.message) + '</span>'); } finally { btn.disabled = false; btn.textContent = t; }
}

/* ---------- liaisons ---------- */
function bind() {
  document.querySelectorAll('[data-l]').forEach(e => e.oninput = () => { cur.links[e.dataset.l] = e.value.trim(); save(); });
  $('#go').onclick = search;
  const lgd = $('#lgd'), lgf = $('#lgf'); lgd.onclick = () => lgf.click(); lgf.onchange = () => lgf.files[0] && setLogo(lgf.files[0]);
  lgd.ondragover = e => { e.preventDefault(); lgd.classList.add('h'); }; lgd.ondragleave = () => lgd.classList.remove('h'); lgd.ondrop = e => { e.preventDefault(); lgd.classList.remove('h'); e.dataTransfer.files[0] && setLogo(e.dataTransfer.files[0]); };
  const f = cur.fiche; if (!f) return;
  document.querySelectorAll('[data-f]').forEach(e => { e.oninput = e.onchange = () => { f[e.dataset.f] = e.value; if (/^c[123]$/.test(e.dataset.f)) f._colorsSet = true; save(); if (e.dataset.f === 'type' || e.dataset.f === 'carteTxt') renderOut(); }; });
  document.querySelectorAll('[data-s]').forEach(e => e.oninput = () => { const k = e.dataset.s; f[k] = Object.assign({ fr: '', es: '', de: '', en: '' }, f[k], { fr: e.value }); save(); });
  document.querySelectorAll('[data-h]').forEach(e => e.oninput = () => { f.horaires = f.horaires || []; f.horaires[+e.dataset.h] = e.value; save(); });
  $('[data-sv]').oninput = e => { const old = Object.fromEntries((f.services || []).map(s => [s.fr, s])); f.services = e.target.value.split('\n').map(x => x.trim()).filter(Boolean).map(x => old[x] || { fr: x, es: x, de: x, en: x }); save(); };
  $('#fromlogo').onclick = async () => { if (!cur.logo) return alert('Dépose d\'abord un logo.'); const d = await dominant(cur.logo); if (!d) return alert('Logo trop neutre : choisis les couleurs à la main.'); Object.assign(f, d); save(); render(); };
  const phd = $('#phd'), phf = $('#phf'); phd.onclick = () => phf.click(); phf.onchange = () => addPhotos([...phf.files]);
  phd.ondragover = e => { e.preventDefault(); phd.classList.add('h'); }; phd.ondragleave = () => phd.classList.remove('h'); phd.ondrop = e => { e.preventDefault(); phd.classList.remove('h'); addPhotos([...e.dataTransfer.files]); };
  $('#all').onclick = downloadAll;
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
const LAB = { nom: 'nom', ville: 'ville', type: 'type', slogan: 'accroche', description: 'description', adresse: 'adresse', tel: 'téléphone', email: 'e-mail', site: 'site', facebook: 'Facebook', instagram: 'Instagram', booking: 'lien de réservation', horaires: 'horaires', services: 'services', carteTxt: 'carte', c1: 'couleurs', c2: 'couleurs', c3: 'couleurs', police: 'police', logoForme: 'forme du logo' };
function applyAssist(r) {
  const f = cur.fiche, ch = new Set();
  undo = { fiche: JSON.parse(JSON.stringify(f)), photos: cur.photos.slice(), fond: cur.fond };
  for (const [k, v] of Object.entries(r.patch || {})) {
    if (k === 'slogan' || k === 'description') f[k] = Object.assign(obj4(f[k]), { fr: String(v?.fr ?? v ?? '') });
    else if (k === 'services') { const old = Object.fromEntries((f.services || []).map(x => [x.fr, x])); f.services = (Array.isArray(v) ? v : []).map(x => String(x?.fr ?? x).trim()).filter(Boolean).map(x => old[x] || { fr: x, es: x, de: x, en: x }); }
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
  const f = cur.fiche, lite = Object.assign({}, f, { slogan: f.slogan?.fr || '', description: f.description?.fr || '', services: (f.services || []).map(s => s.fr) }); Object.keys(lite).filter(k => k[0] === '_').forEach(k => delete lite[k]);
  cur.chat = cur.chat || []; const hist = cur.chat.slice(-6); cur.chat.push({ r: 'u', t }); i.value = ''; $('#chat').insertAdjacentHTML('beforeend', `<div class="cm u">${esc(t)}</div><div class="cm a" id="cw">…</div>`); $('#cs').disabled = true;
  try {
    const r = await api('/api/fiche', { mode: 'assist', instruction: t, fiche: lite, nbPhotos: cur.photos.length, fond: cur.fond, history: hist }), ch = applyAssist(r);
    cur.chat.push({ r: 'a', t: (r.message || 'Fait.') + (ch.length ? '\n✔ Modifié : ' + ch.join(', ') : '') });
  } catch (e) { cur.chat.push({ r: 'a', t: 'Erreur : ' + e.message }); }
  save(); render(); const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; $('#ci') && $('#ci').focus();
}

/* ---------- recherche ---------- */
async function search() {
  const L = cur.links, b = $('#go'); b.disabled = true; msg('Recherche en cours (site, sources publiques, horaires, carte)…');
  try {
    const r = await api('/api/fiche', { mode: 'search', site: L.site, facebook: L.facebook, instagram: L.instagram, autres: L.autres, nom: L.nom, type: L.type, adresse: L.adresse || '', tel: L.tel || '' });
    const x = r.fiche || {}, f = cur.fiche || {};
    cur.fiche = Object.assign({ police: 'serif', logoForme: 'libre' }, f, {
      type: L.type || x.type || 'restaurant', nom: x.nom || L.nom || '', ville: x.ville || '', slogan: obj4(x.slogan), description: obj4(x.description), adresse: x.adresse || '', tel: x.tel || '', email: x.email || '',
      site: x.site || L.site || '', facebook: x.facebook || L.facebook || '', instagram: x.instagram || L.instagram || '', booking: x.reservation_url || '',
      horaires: Array.isArray(x.horaires) ? x.horaires.slice(0, 7) : [], services: (x.services || []).map(obj4),
      carteTxt: (x.carte || []).map(c => '# ' + c.cat + '\n' + (c.items || []).map(i => [i.nom, i.prix || '', i.desc || ''].join(' | ')).join('\n')).join('\n'),
      c1: x.c1 || r.theme || '#1f2a44', c2: x.c2 || '#2b899d', c3: x.c3 || ''
    });
    if (!cur.fiche.c3) cur.fiche.c3 = mix(cur.fiche.c2, '#ffffff', .5);
    cur.notes = x.notes || []; cur.fiche._trh = '';
    save(); render(); msg('Fiche trouvée. Récupération du logo et des photos…', 'i');
    // logo
    if (!cur.logo) for (const u of r.logos || []) { try { const bl = await api('/api/img?u=' + encodeURIComponent(u), null, true); await setLogo(bl); break; } catch (e) { } }
    // photos
    const pool = (r.photos || []).slice(0, 36); let n = 0, i = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < pool.length && cur.photos.length < 24) { const u = pool[i++]; try { const bl = await api('/api/img?u=' + encodeURIComponent(u), null, true), p = await toJpeg(bl); if (Math.max(p.w, p.h) < 600) continue; cur.photos.push({ id: 'i' + Date.now() + (n++), blob: p.blob }); } catch (e) { } } }));
    if (cur.logo && !cur.fiche._colorsSet && !x.c2) { const d = await dominant(cur.logo); if (d) Object.assign(cur.fiche, d); }
    save(); render(); msg(`Terminé : ${cur.photos.length} photo(s)${cur.logo ? ', logo trouvé' : ', pas de logo (dépose-le ci-dessus)'}. Vérifie la fiche.`, 'k');
  } catch (e) { render(); msg(e.message, 'e'); } finally { const g = $('#go'); if (g) g.disabled = false; }
}

/* ---------- génération ---------- */
const hashTr = f => JSON.stringify([f.slogan?.fr, f.description?.fr, (f.services || []).map(s => s.fr)]);
async function ensureTr(f) {
  if (hashTr(f) === f._trh) return; if (!f.slogan?.fr && !f.description?.fr && !(f.services || []).length) return;
  try {
    const r = await api('/api/fiche', { mode: 'translate', slogan: f.slogan?.fr || '', description: f.description?.fr || '', services: (f.services || []).map(s => s.fr) });
    ['slogan', 'description'].forEach(k => { f[k] = Object.assign(obj4(f[k]), r[k] || {}, { fr: f[k]?.fr || '' }); });
    f.services = (f.services || []).map((s, i) => Object.assign(obj4(s), (r.services || [])[i] || {}, { fr: s.fr })); f._trh = hashTr(f); save();
  } catch (e) { const m = $('#msg2'); if (m) m.innerHTML = '<p class="hint" style="margin-top:10px">Traduction automatique indisponible : les pages seront en français pour ES/DE/EN. (' + esc(e.message) + ')</p>'; }
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
async function make(k) { await ensureTr(cur.fiche); const out = await buildAll({ fiche: cur.fiche, photos: cur.photos, logo: cur.logo, fond: cur.fond }, [k]); return out[k] ? resolve(out[k]) : null; }
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
    await ensureTr(cur.fiche); const out = await buildAll({ fiche: cur.fiche, photos: cur.photos, logo: cur.logo, fond: cur.fond });
    for (const [k, files] of Object.entries(out)) { dl(await zipOf(await resolve(files)), `${slug()}-${k}.zip`); await new Promise(r => setTimeout(r, 700)); }
  } catch (e) { alert(e.message); } finally { b.disabled = false; b.textContent = '⬇ Tout télécharger (ZIP séparés)'; }
}
async function preview(k) {
  const files = await make(k); if (!files) return; $('#mt').textContent = 'Aperçu — ' + k; const mb = $('#mb'); $('#modal').classList.add('on');
  if (k === 'boutons') {
    $('#mr').style.display = 'none'; mb.innerHTML = '<div class="bt"></div>'; const g = mb.firstChild;
    Object.entries(files).filter(([p]) => /\/128\//.test(p) && /_normal\.png$/.test(p)).forEach(([p, v]) => { const i = new Image(); i.src = URL.createObjectURL(v); g.appendChild(i); }); return;
  }
  $('#mr').style.display = '';
  let html = files['index.html'];
  for (const [p, v] of Object.entries(files)) if (p !== 'index.html') html = html.split(p).join(URL.createObjectURL(v));
  const run = () => { mb.innerHTML = ''; const fr = document.createElement('iframe'); fr.srcdoc = html; fr.style.cssText = 'flex:1;border:0;width:100%'; mb.appendChild(fr); };
  run(); $('#mr').onclick = run;
}
$('#mc').onclick = () => { $('#modal').classList.remove('on'); $('#mb').innerHTML = ''; };
$('#new').onclick = () => openFinder();
(async () => { const all = await dbAll(); all.sort((a, b) => b.upd - a.upd); cur = all[0] || null; renderList(); render(); })();

/* ---------- recherche d'un établissement ---------- */
const norm = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
async function runSearch() {
  const v = $('#q').value.trim(), box = $('#qr'); if (!v) { box.className = ''; return; }
  const all = await dbAll(), k = norm(v);
  const hit = all.filter(p => norm([p.fiche?.nom, p.fiche?.ville, p.fiche?.adresse, p.fiche?.tel, p.fiche?.site, p.links?.nom, p.links?.site, p.links?.facebook, p.links?.instagram].join(' ')).includes(k)).sort((a, b) => b.upd - a.upd).slice(0, 6);
  box.innerHTML = hit.map(p => `<div data-id="${p.id}">📍 <b>${esc(p.fiche?.nom || p.links.nom || p.links.site || 'Sans nom')}</b><small>${esc(p.fiche?.ville || '')}</small></div>`).join('') + `<div data-new="1">＋ Nouvel établissement : <b>${esc(v)}</b></div>`;
  box.className = 'on'; box.firstChild.classList.add('sel');
  box.querySelectorAll('div').forEach(d => d.onclick = async () => {
    if (d.dataset.id) cur = all.find(p => p.id === d.dataset.id);
    else if (!/^https?:\/\//i.test(v)) { $('#q').value = ''; box.className = ''; openFinder(v); return; }
    else { cur = newProject(); if (/^https?:\/\//i.test(v)) { const key = /facebook\./i.test(v) ? 'facebook' : /instagram\./i.test(v) ? 'instagram' : 'site'; cur.links[key] = v; } else cur.links.nom = v; await dbPut(cur); }
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
  d.innerHTML = `<div class="card" style="width:min(680px,100%);max-height:88vh;overflow:auto"><h2>＋ Nouvel établissement</h2><p class="hint">Choisis la ville, puis tape un nom ou une adresse exacte, ou parcours une catégorie. Je cherche tout le reste et je crée la fiche complète.</p>
   <label style="position:relative">Ville<input id="fc" autocomplete="off" value="${esc(city.nom)}" placeholder="Tape une ville…"><div id="fcl" style="position:absolute;top:62px;left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,.16);z-index:5;display:none"></div></label>
   <div class="row" id="rc" style="margin:-4px 0 12px"></div>
   <div class="row"><input id="fq" style="flex:1;min-width:200px;margin:0" placeholder="Nom ou adresse exacte (ex. Burger et Cassolette, ou 12 rue de la Mairie)" value="${esc(pre)}"><button class="b" id="fs">Chercher</button></div>
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
    const v = q.value.trim(); if (v.length < 2) return; show('<p class="hint">Recherche…</p>');
    try { const r = await api('/api/fiche', { mode: web ? 'suggest_web' : 'suggest', q: withCity(v), ville: city.nom }); list(r.resultats || []); } catch (e) { show(`<div id="msg" class="on e">${esc(e.message)}</div>`); }
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
