/* NovaGen — générateur de pages NovaTour (tourne dans le navigateur) */
const LANGS = ['fr', 'es', 'de', 'en'];
const FLAGS = {
  fr: ['Français', '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#0055A4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#EF4135"/></svg>'],
  es: ['Español', '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/></svg>'],
  de: ['Deutsch', '<svg viewBox="0 0 30 20"><rect width="30" height="7" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#DD0000"/><rect y="13.33" width="30" height="6.67" fill="#FFCE00"/></svg>'],
  en: ['English', '<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="13"/><path d="M30 0V40M0 20H60" stroke="#C8102E" stroke-width="7"/></svg>']
};
const DAYS = {
  fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
};
const T = {
  infos: { fr: 'Infos pratiques', es: 'Información práctica', de: 'Praktische Infos', en: 'Practical info' },
  horaires: { fr: 'Horaires', es: 'Horarios', de: 'Öffnungszeiten', en: 'Opening hours' },
  adresse: { fr: 'Adresse', es: 'Dirección', de: 'Adresse', en: 'Address' },
  contact: { fr: 'Contact', es: 'Contacto', de: 'Kontakt', en: 'Contact' },
  services: { fr: 'Services', es: 'Servicios', de: 'Leistungen', en: 'Services' },
  reseaux: { fr: 'Suivez-nous', es: 'Síguenos', de: 'Folgen Sie uns', en: 'Follow us' },
  itineraire: { fr: 'Itinéraire', es: 'Cómo llegar', de: 'Route', en: 'Directions' },
  appeler: { fr: 'Appeler', es: 'Llamar', de: 'Anrufen', en: 'Call' },
  siteweb: { fr: 'Site web', es: 'Sitio web', de: 'Webseite', en: 'Website' },
  reserver: { fr: 'Réserver', es: 'Reservar', de: 'Reservieren', en: 'Book' },
  reserverbk: { fr: 'Réserver en ligne', es: 'Reservar en línea', de: 'Online buchen', en: 'Book online' },
  email: { fr: 'E-mail', es: 'Correo', de: 'E-Mail', en: 'E-mail' },
  galerie: { fr: 'Galerie photos', es: 'Galería de fotos', de: 'Fotogalerie', en: 'Photo gallery' },
  carte: { fr: 'La carte', es: 'La carta', de: 'Speisekarte', en: 'The menu' },
  ferme: { fr: 'Fermé', es: 'Cerrado', de: 'Geschlossen', en: 'Closed' },
  ouvert: { fr: 'Ouvert', es: 'Abierto', de: 'Geöffnet', en: 'Open' },
  adr_apres: { fr: 'Adresse exacte communiquée après la réservation', es: 'Dirección exacta tras la reserva', de: 'Genaue Adresse nach der Buchung', en: 'Exact address shared after booking' },
  date: { fr: 'Date', es: 'Fecha', de: 'Datum', en: 'Date' },
  heure: { fr: 'Heure', es: 'Hora', de: 'Uhrzeit', en: 'Time' },
  pers: { fr: 'Personnes', es: 'Personas', de: 'Personen', en: 'Guests' },
  nom: { fr: 'Votre nom', es: 'Su nombre', de: 'Ihr Name', en: 'Your name' },
  tel: { fr: 'Téléphone', es: 'Teléfono', de: 'Telefon', en: 'Phone' },
  msg: { fr: 'Message (facultatif)', es: 'Mensaje (opcional)', de: 'Nachricht (optional)', en: 'Message (optional)' },
  arrivee: { fr: 'Arrivée', es: 'Llegada', de: 'Anreise', en: 'Check-in' },
  depart: { fr: 'Départ', es: 'Salida', de: 'Abreise', en: 'Check-out' },
  voyageurs: { fr: 'Voyageurs', es: 'Viajeros', de: 'Gäste', en: 'Guests' },
  resa_t: { fr: 'Votre demande', es: 'Su solicitud', de: 'Ihre Anfrage', en: 'Your request' },
  resa_h: { fr: 'Remplissez, puis envoyez votre demande par le moyen de votre choix.', es: 'Rellene y envíe su solicitud por el medio que prefiera.', de: 'Ausfüllen und die Anfrage auf dem Weg Ihrer Wahl senden.', en: 'Fill in, then send your request the way you prefer.' },
  copier: { fr: 'Copier la demande', es: 'Copiar la solicitud', de: 'Anfrage kopieren', en: 'Copy request' },
  copie: { fr: 'Copié !', es: '¡Copiado!', de: 'Kopiert!', en: 'Copied!' },
  bienvenue: { fr: 'Bienvenue', es: 'Bienvenidos', de: 'Willkommen', en: 'Welcome' },
  visite: { fr: 'Visite immersive', es: 'Visita inmersiva', de: 'Immersive Tour', en: 'Immersive tour' },
  fermer: { fr: 'Fermer', es: 'Cerrar', de: 'Schließen', en: 'Close' }
};

/* ---------- utilitaires ---------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hx = h => { h = (h || '#888888').replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const rh = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, p) => { const x = hx(a), y = hx(b); return rh(x.map((v, i) => v * (1 - p) + y[i] * p)); };
const lum = h => { const [r, g, b] = hx(h); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
const slugOf = n => { const s = String(n || 'etablissement').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'et').replace(/[^a-zA-Z0-9]+/g, ''); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); };
const obj4 = o => { if (!o) return { fr: '', es: '', de: '', en: '' }; if (typeof o === 'string') return { fr: o, es: o, de: o, en: o }; const fr = o.fr || ''; return { fr, es: o.es || fr, de: o.de || fr, en: o.en || fr }; };

function mk() {
  const D = [];
  const t = (o, tag = 'span', cls = '', extra = '') => { o = obj4(o); const n = D.length; D.push(o); return `<${tag}${cls ? ` class="${cls}"` : ''}${extra} data-i="${n}">${esc(o.fr)}</${tag}>`; };
  const raw = o => { D.push(obj4(o)); return D.length - 1; };
  return { D, t, raw };
}

function parseHours(s) {
  s = String(s || '');
  if (/ferm|closed|cerrado|geschl/i.test(s) && !/\d/.test(s)) return [];
  if (/24\s*h?\s*\/\s*24|24h24/i.test(s)) return [[0, 1440]];
  const out = [], re = /(\d{1,2})\s*(?:h|:)\s*(\d{2})?\s*(?:-|–|—|à|a|to|bis)\s*(\d{1,2})\s*(?:h|:)?\s*(\d{2})?/gi;
  let m;
  while ((m = re.exec(s))) {
    const a = (+m[1]) * 60 + (+(m[2] || 0)); let b = (+m[3]) * 60 + (+(m[4] || 0));
    if (b <= a) b += 1440; out.push([a, b]);
  }
  return out;
}
function parseCarte(txt) {
  const cats = []; let cur = null;
  String(txt || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
    if (/^#/.test(l)) { const q = l.replace(/^#+\s*/, '').split('|').map(x => x.trim()); cur = { cat: q[0], sub: q[1] && !/^(photo\s*)?\d+$/i.test(q[1]) ? q[1] : '', photo: +((q.find((x, i) => i && /^(photo\s*)?\d+$/i.test(x)) || '').replace(/\D/g, '')) || 0, items: [] }; cats.push(cur); return; }
    if (!cur) { cur = { cat: '', items: [] }; cats.push(cur); }
    const p = l.split('|').map(x => x.trim()), veg = /🌿|\(\s*v(?:é|e)g(?:é|e)?(?:tarien)?\s*\)/i.test(p[0]);
    cur.items.push({ nom: p[0].replace(/🌿|\(\s*v(?:é|e)g(?:é|e)?(?:tarien)?\s*\)/ig, '').trim(), prix: p[1] || '', desc: p[2] || '', veg });
  });
  return cats.filter(c => c.items.length);
}
function navQuery(f) { return f.adresse ? (f.adresse.toLowerCase().includes(String(f.ville || '').toLowerCase()) ? f.adresse : f.adresse + ' ' + (f.ville || '')) : (f.nom + ' ' + (f.ville || '')); }
function navBtns(f) {
  const q = encodeURIComponent(navQuery(f)), b = (href, bg, ic, nm) => `<a class="nv" href="${href}" target="_blank" rel="noopener" style="background:${bg}"><span>${ic}</span>${nm}</a>`;
  return `<div class="navs">${b(mapsUrl(f), '#1a73e8', '📍', 'Google Maps')}${b('https://waze.com/ul?q=' + q + '&navigate=yes', '#05a6e8', '🚗', 'Waze')}${b('https://maps.apple.com/?daddr=' + q + '&dirflg=d', '#2c2c2e', '🧭', 'Plans')}</div>`;
}
function mapsUrl(f) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.adresse || (f.nom + ' ' + f.ville)); }
function messengerUrl(f) {
  const m = String(f.facebook || '').match(/facebook\.com\/(?:profile\.php\?id=)?([^/?&#]+)/i);
  if (!m || /^(pages|people|p)$/i.test(m[1])) return '';
  return 'https://m.me/' + m[1];
}
function telHref(t) { return 'tel:' + String(t || '').replace(/[^\d+]/g, ''); }

/* ---------- CSS / squelette ---------- */
function fontCss(f) {
  const ff = (fam, w, file) => `@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;src:url(assets/fonts/${file}.woff2) format("woff2")}`;
  return ff('DM Serif Display', 400, 'dmserif') + ff('Great Vibes', 400, 'greatvibes') + [400, 600, 700, 800].map(w => ff('Montserrat', w, 'm' + w)).join('\n') + '\n';
}


/* ---------- identité propre à chaque établissement : palette + style dérivés du nom ---------- */
const hashStr = x => { let h = 5381; for (const c of String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; };
const hsl = (h, sa, l) => { h = ((h % 360) + 360) % 360; sa /= 100; l /= 100; const a = sa * Math.min(l, 1 - l), k = n => { const t = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(t - 3, 9 - t, 1)); }; return rh([k(0) * 255, k(8) * 255, k(4) * 255]); };
const PALS = [['#2b1a14', '#c0602f', '#f0a868'], ['#1f261a', '#7f8f2e', '#d4c86a'], ['#10243a', '#2f7fb0', '#8fd0e8'], ['#2a1018', '#a3263f', '#f09aa9'], ['#2a2210', '#d9a21b', '#f6d77a'], ['#11261d', '#2f8a56', '#9be0b4'], ['#25142e', '#8a3fa8', '#d8a8ec'], ['#2b1c12', '#b8733a', '#f0c9a0'], ['#1c2128', '#5b7a99', '#b8cde0'], ['#2e1614', '#e0584a', '#ffb1a6'], ['#1f1d33', '#7367c9', '#c9c3f5'], ['#1a1a1a', '#c9a24a', '#f0dc9a'], ['#2e1a22', '#d97a9a', '#f7c6d6'], ['#301a0a', '#e07a10', '#ffc16b']];
function genPalette(nom, type) { const H = hashStr(nom + '|' + (type || '')), p = PALS[H % PALS.length]; return { c1: p[0], c2: p[1], c3: p[2] }; }
const STYLES = [['1', 'Classique'], ['2', 'Ardoise'], ['3', 'Moderne'], ['4', 'Magazine'], ['5', 'Signature (modèles Mioza / Gaïa)'], ['6', 'Vitrine (modèle Gaïa, Point Info)']];
const SPECIAL_PG = { intro: 1, infos: 1, carte: 1 };
const styleOf = f => {
  const pg = f._pg, sp = pg && SPECIAL_PG[pg], six = sp || pg === 'galerie', ok = (v, n) => ['1', '2', '3', '4', '5', '6'].slice(0, n).includes(String(v)), x = pg && f.pstyle && f.pstyle[pg];
  if (ok(x, six ? 6 : 4)) return String(x);
  if (sp && f._fond && f.type !== 'hebergement') return pg === 'infos' ? ((hashStr(f.nom) % 2) && (f._names || []).length >= 2 ? '6' : '5') : '5';
  return ok(f.style, 4) ? String(f.style) : String(hashStr(f.nom) % 4 + 1);
};
const styleOfPg = (f, pg) => styleOf(Object.assign({}, f, { _pg: pg }));

/* ---------- fonds : motif selon le type d'établissement + photo allégée ---------- */
function motif(f, color, op, white) {
  const c = color, o = op, k = f.type;
  const svg = k === 'hebergement'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="22"><path d="M0 11Q16 1 32 11T64 11" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="1.2"/></svg>`
    : k === 'commerce'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="1.4" fill="${c}" fill-opacity="${o * 1.6}"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><path d="M0 30L30 0M-8 8L8 -8M22 38L38 22" stroke="${c}" stroke-opacity="${o}" stroke-width="1"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="180" height="180" filter="url(#n)"/></svg>')}")`;
async function toFond(blob, w = 1100) {
  try {
    const bm = await createImageBitmap(blob), r = Math.min(1, w / bm.width), c = document.createElement('canvas');
    c.width = Math.round(bm.width * r); c.height = Math.round(bm.height * r); c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', .6));
  } catch (e) { return blob; }
}
function baseCss(f) {
  const c1 = f.c1, c2 = f.c2, bg = mix(c2, '#ffffff', .93), bg2 = mix(c2, '#ffffff', .84), line = mix(c2, '#ffffff', .7);
  const hl = lum(c2) > .4 ? c2 : mix(c2, '#ffffff', .55);
  const hf = f.police === 'sans' ? 'font-family:Montserrat,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.02em' : 'font-family:"DM Serif Display",Georgia,serif;font-weight:400';
  const sm = f.police === 'sans' ? 'font:700 11px Montserrat,sans-serif;letter-spacing:.2em;text-transform:uppercase' : 'font:400 18px "Great Vibes",cursive';
  return fontCss(f) + `:root{--c1:${c1};--c2:${c2};--hl:${hl};--bg:${bg};--bg2:${bg2};--line:${line};--ink:#1d1a17;--mu:#6b645c;--ac:${lum(c2) > .62 ? '#1d1a17' : '#fff'}}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{min-height:100%;font-family:Montserrat,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--ink)}
body{background:${motif(f, c2, .09)},linear-gradient(160deg,#fff 0%,var(--bg) 55%,var(--bg2) 100%);background-attachment:fixed;overflow-y:auto;-webkit-overflow-scrolling:touch}
.h{${hf}}
.top{position:sticky;top:0;z-index:30;background:${mix(c1, '#000000', .06)};border-bottom:3px solid var(--c2);display:flex;align-items:center;gap:14px;padding:9px 20px}
.visite .top{padding-right:84px}
.top img{height:46px;width:46px;object-fit:contain;border-radius:50%;background:${f._logoLight ? mix(c1, '#000000', .1) : '#fff'};padding:3px;border:2px solid var(--hl)}
.top small{display:block;${sm};color:var(--hl);line-height:1.1}
.top b{display:block;font-size:20px;color:#fff;line-height:1.15}
.lang{margin-left:auto;display:flex;gap:4px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.25);border-radius:14px;padding:3px}
.lang button{display:flex;align-items:center;background:transparent;border:2px solid transparent;border-radius:8px;padding:3px;cursor:pointer;opacity:.6;transition:.2s}
.lang button svg{display:block;width:30px;height:20px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.lang button:hover{opacity:.9}.lang button.on{opacity:1;border-color:var(--hl);background:rgba(255,255,255,.16)}
.st{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#fff;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.25);border-radius:30px;padding:7px 14px;white-space:nowrap}
.st i{width:10px;height:10px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 4px rgba(61,220,132,.25)}
.st.c i{background:#ff7a66;box-shadow:0 0 0 4px rgba(255,122,102,.25)}
.wrap{max-width:900px;margin:0 auto;padding:22px 18px 60px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin-bottom:16px;box-shadow:0 6px 22px rgba(0,0,0,.05);animation:up .5s both}
.card h2{font-size:20px;color:var(--c1);margin-bottom:12px}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--c2);color:var(--ac);border:0;border-radius:30px;padding:12px 20px;font:700 14px Montserrat,sans-serif;text-decoration:none;cursor:pointer;transition:.2s}
.btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.btn.o{background:#fff;color:var(--c1);border:2px solid var(--c1)}
.row{display:flex;flex-wrap:wrap;gap:10px}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{background:var(--bg2);border:1px solid var(--line);border-radius:30px;padding:7px 14px;font-size:13.5px;font-weight:600;color:var(--c1)}
table{width:100%;border-collapse:collapse}td{padding:9px 6px;border-bottom:1px solid var(--line);font-size:14.5px}td:last-child{text-align:right;font-weight:600}
tr.today td{background:var(--bg);color:var(--c1);font-weight:700}
.mu{color:var(--mu);font-size:14px;line-height:1.6}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media(max-width:760px){.top{padding:8px 12px;gap:8px}.top img{height:38px;width:38px}.top b{font-size:16px}.visite .top{padding-right:62px}.st{display:none}.lang{gap:2px;padding:2px}.lang button svg{width:25px;height:17px}.card{padding:16px}}
@media(max-width:430px){.top b{display:none}}
`;
}
function langJs(D, SCH) {
  return `<script>(function(){
const D=${JSON.stringify(D)},L=['fr','es','de','en'],SCH=${JSON.stringify(SCH || null)},ST=${JSON.stringify({ o: T.ouvert, c: T.ferme })};
const els=[...document.querySelectorAll('[data-i]')];
const sv=document.getElementById('sv'),st=document.getElementById('st');let lang='fr';
function status(){if(!sv||!SCH)return;
 const p=new Intl.DateTimeFormat('en-GB',{hour:'numeric',minute:'numeric',weekday:'short',hour12:false,timeZone:'Europe/Paris'}).formatToParts(new Date());
 const wd=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(p.find(x=>x.type==='weekday').value),m=(+p.find(x=>x.type==='hour').value%24)*60+ +p.find(x=>x.type==='minute').value;
 let o=(SCH[wd]||[]).some(r=>m>=r[0]&&m<r[1]);const pv=SCH[(wd+6)%7]||[];if(!o)o=pv.some(r=>r[1]>1440&&m<r[1]-1440);
 st.classList.toggle('c',!o);sv.textContent=ST[o?'o':'c'][lang];
 document.querySelectorAll('tr[data-day]').forEach(r=>r.classList.toggle('today',+r.dataset.day===wd))}
function set(l){lang=l;els.forEach(e=>{e.innerHTML=D[e.dataset.i][l]});document.documentElement.lang=l;
 document.querySelectorAll('#lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));
 try{localStorage.setItem('nt_lang',l)}catch(e){}status();window.dispatchEvent(new CustomEvent('langchange',{detail:l}))}
window.__lang=()=>lang;
document.querySelectorAll('#lang button').forEach(b=>b.onclick=()=>set(b.dataset.l));
let l='';try{l=localStorage.getItem('nt_lang')||''}catch(e){}
if(!L.includes(l)){const n=(navigator.language||'fr').slice(0,2).toLowerCase();l=L.includes(n)?n:'fr'}
set(l);setInterval(status,60000)})();</script>`;
}
function header(f, ctx, sub, withStatus) {
  const bar = '<div class="lang" id="lang">' + LANGS.map(k => `<button data-l="${k}" title="${FLAGS[k][0]}" aria-label="${FLAGS[k][0]}">${FLAGS[k][1]}</button>`).join('') + '</div>';
  const st = withStatus ? '<div class="st" id="st"><i></i><span id="sv"></span></div>' : '';
  return `<div class="top">${f._logo ? `<img src="assets/img/${f._logo}" alt="${esc(f.nom)}">` : ''}<div><small>${esc(f.nom)}</small>${ctx.t(sub, 'b', 'h')}</div>${bar}${st}</div>`;
}
function shell(f, ctx, { title, css = '', body, js = '', sch = null }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title> <meta name="description" content="${esc(f.descCourte?.fr || f.description?.fr || f.slogan?.fr || f.nom)}"><meta property="og:title" content="${esc(f.nom)}"><meta property="og:description" content="${esc(f.descCourte?.fr || f.description?.fr || '')}">
<script>if(/[?&]visite\\b/.test(location.search))document.documentElement.classList.add('visite')</script>
<style>${baseCss(f)}${css}</style></head><body class="s${styleOf(f)}">${body}${langJs(ctx.D, sch)}${js ? `<script>${js}</script>` : ''}</body></html>`;
}
const schOf = f => { const h = (f.horaires || []).map(parseHours); return h.some(x => x.length) ? h : null; };
const fontFiles = f => ['dmserif', 'greatvibes', 'm400', 'm600', 'm700', 'm800'].map(n => ['assets/fonts/' + n + '.woff2', { url: 'fonts/' + n + '.woff2' }]);

/* ---------- pages ---------- */
function pageInfos(f) {
  { const st = styleOf(f); if (st === '5') return pageInfos5(f); if (st === '6') return pageInfos6(f); }
  const ctx = mk(), { t } = ctx, heb = f.type === 'hebergement', sch = heb ? schOf(f) : schOf(f);
  const acts = [];
  if (f.tel) acts.push(`<a class="btn" href="${telHref(f.tel)}">📞 ${t(T.appeler)}</a>`);
  if (f.booking) acts.push(`<a class="btn" href="${esc(f.booking)}" target="_blank" rel="noopener">${t(T.reserverbk)}</a>`);
  if (!heb || f.adresse) acts.push(`<a class="btn o" href="${mapsUrl(f)}" target="_blank" rel="noopener">📍 ${t(T.itineraire)}</a>`);
  if (f.site) acts.push(`<a class="btn o" href="${esc(f.site)}" target="_blank" rel="noopener">🌐 ${t(T.siteweb)}</a>`);
  const hr = (f.horaires || []).some(x => x && x.trim()) ? `<div class="card"><h2 class="h">${t(T.horaires)}</h2><table>${DAYS.fr.map((_, i) => {
    const v = (f.horaires[i] || '').trim(); const closed = !v || /^ferm/i.test(v);
    return `<tr data-day="${i}"><td>${t({ fr: DAYS.fr[i], es: DAYS.es[i], de: DAYS.de[i], en: DAYS.en[i] })}</td><td>${closed ? t(T.ferme) : esc(v)}</td></tr>`;
  }).join('')}</table></div>` : '';
  const q = f.adresse || (f.ville ? f.nom + ' ' + f.ville : f.nom);
  const map = `<iframe title="map" loading="lazy" style="width:100%;height:260px;border:0;border-radius:12px;margin-top:12px" src="https://maps.google.com/maps?q=${encodeURIComponent(heb && !f.adresse ? f.ville : q)}&z=${heb && !f.adresse ? 12 : 16}&output=embed"></iframe>`;
  const adr = `<div class="card"><h2 class="h">${t(T.adresse)}</h2><p class="mu"><b style="color:var(--ink)">${esc(f.adresse || f.ville)}</b>${heb && !f.adresse ? '<br>' + t(T.adr_apres) : ''}</p>${navBtns(f)}${map}</div>`;
  const cont = (f.tel || f.email) ? `<div class="card"><h2 class="h">${t(T.contact)}</h2><p class="mu">${f.tel ? `📞 <a href="${telHref(f.tel)}" style="color:inherit;font-weight:700">${esc(f.tel)}</a><br>` : ''}${f.email ? `✉️ <a href="mailto:${esc(f.email)}" style="color:inherit;font-weight:700">${esc(f.email)}</a>` : ''}</p></div>` : '';
  const sv = (f.services || []).length ? `<div class="card"><h2 class="h">${t(T.services)}</h2><div class="chips">${f.services.map(s => t(s)).join('')}</div></div>` : '';
  const soc = [f.facebook && ['Facebook', f.facebook], f.instagram && ['Instagram', f.instagram]].filter(Boolean);
  const rs = soc.length ? `<div class="card"><h2 class="h">${t(T.reseaux)}</h2><div class="row">${soc.map(([n, u]) => `<a class="btn o" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>` : '';
  const sub = f.slogan?.fr ? t(f.slogan, 'p', 'sl') : '';
  const hero = `<section class="hero"><div class="hp"></div><div class="hc">${f._logo ? `<img class="hl" src="assets/img/${f._logo}" alt="">` : ''}<h1 class="h">${esc(f.nom)}</h1>${sub}${f.descCourte?.fr ? t(f.descCourte, 'p', 'sd') : ''}<div class="row" style="margin-top:18px">${acts.join('')}</div></div></section>`;
  const about = f.description?.fr ? `<div class="card ab">${t(f.description, 'p', 'mu')}</div>` : '';
  const body = header(f, ctx, T.infos, !!sch) + hero + `<div class="wrap ov">${about}${hr}${adr}${cont}${sv}${rs}</div>`;
  const c1 = mix(f.c1, '#000000', .3), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const css = `.hero{position:relative;min-height:clamp(300px,50vh,480px);display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:${f._fond ? `linear-gradient(180deg,${c1}40 0%,${c1}a6 55%,${c1}f2 100%),url(assets/img/fond.jpg) center/cover` : `radial-gradient(circle at 15% 20%,${f.c2}88,transparent 50%),radial-gradient(circle at 90% 95%,${hl}44,transparent 45%),${c1}`}}
.hero::before{content:"";position:absolute;inset:0;background:${motif(f, '#ffffff', f._fond ? .05 : .1)};pointer-events:none}.hero::after{content:"";position:absolute;inset:0;background:${GRAIN};opacity:.07;mix-blend-mode:overlay;pointer-events:none}
.hc{position:relative;width:100%;max-width:900px;margin:0 auto;padding:70px 22px 64px}
.hero h1{font-size:clamp(34px,7.4vw,66px);line-height:1.04;text-shadow:0 3px 24px rgba(0,0,0,.45);animation:up .8s both}
.hero .sl{margin-top:10px;font-size:clamp(15px,2.6vw,20px);font-weight:700;color:${hl};letter-spacing:.02em;animation:up .8s .15s both}.hero .sd{margin-top:8px;max-width:560px;font-size:15px;line-height:1.6;color:rgba(255,255,255,.88);animation:up .8s .25s both}
.hero .btn{box-shadow:0 8px 22px rgba(0,0,0,.28)}.hero .btn.o{background:rgba(255,255,255,.14);color:#fff;border:1.5px solid rgba(255,255,255,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.wrap.ov{position:relative;margin-top:-34px;padding-top:0}.ov .card{animation:none;box-shadow:0 10px 30px rgba(20,20,30,.1)}.ab{border-top:4px solid var(--c2)}.ab p{font-size:15px;line-height:1.75}
.card h2.h{display:flex;align-items:center;gap:12px}.card h2.h::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.navs{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.nv{flex:1 1 120px;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;text-decoration:none;font:700 13.5px Montserrat,sans-serif;padding:11px 14px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.18);transition:.15s}.nv:hover{transform:translateY(-2px);filter:brightness(1.08)}.nv span{font-size:16px}
.hl,.hp{display:none}.hl{width:96px;height:96px;border-radius:50%;object-fit:contain;padding:8px;background:${f._logoLight ? c1 : '#fff'};border:3px solid ${hl};box-shadow:0 12px 30px rgba(0,0,0,.4);margin-bottom:16px}
body.s2 .hero{text-align:center}body.s2 .hc{display:flex;flex-direction:column;align-items:center}body.s2 .hl{display:block;width:118px;height:118px}body.s2 .hero .row{justify-content:center}body.s2 .hero .sd{margin-left:auto;margin-right:auto}body.s2 .wrap.ov{margin-top:-24px}
body.s3 .hero{min-height:clamp(280px,44vh,420px);background:linear-gradient(115deg,${c1} 0%,${mix(c1, f.c2, .4)} 100%)}body.s3 .hero::before{background:${motif(f, '#ffffff', .09)}}
body.s3 .hp{display:block;position:absolute;top:0;right:0;bottom:0;width:48%;background:${f._fond ? 'url(assets/img/fond.jpg) center/cover' : mix(f.c2, c1, .3)};-webkit-mask-image:linear-gradient(90deg,transparent,#000 42%);mask-image:linear-gradient(90deg,transparent,#000 42%)}body.s3 .hc{position:relative;z-index:1}body.s3 .hero .sd{max-width:46%}body.s3 .hl{display:block;width:84px;height:84px}
body.s4 .hero{min-height:clamp(340px,62vh,560px);background:${f._fond ? `linear-gradient(180deg,${c1}22 0%,${c1}22 40%,${c1}e0 100%),url(assets/img/fond.jpg) center/cover` : `linear-gradient(135deg,${c1},${mix(c1, f.c2, .55)})`}}body.s4 .hero h1{font-size:clamp(46px,12vw,112px);line-height:.92;letter-spacing:-.01em}body.s4 .hc{padding-bottom:42px}body.s4 .hl{display:block;position:absolute;top:26px;left:22px;width:70px;height:70px;margin:0}body.s4 .ab{border-top:0;border-left:5px solid var(--c2);border-radius:4px 18px 18px 4px}
@media(max-width:760px){.hc{padding:52px 18px 56px}body.s3 .hp{width:100%;opacity:.35}body.s3 .hero .sd{max-width:none}}`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Infos', css, body, sch }) };
}

function pageGalerie(f, photos) {
  const ctx = mk(), { t } = ctx;
  const css = `.g{columns:3 240px;column-gap:12px}.g a{display:block;margin-bottom:12px;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.12);cursor:zoom-in;break-inside:avoid;background:var(--bg2)}.g img{display:block;width:100%;height:auto;transition:.35s}.g a:hover img{transform:scale(1.04)}
body.s2 .g{columns:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:22px 18px;padding:6px}body.s2 .g a{margin:0;background:#fff;padding:10px 10px 38px;border-radius:3px;box-shadow:0 10px 26px rgba(0,0,0,.2);transform:rotate(-1.6deg);transition:.3s}body.s2 .g a:nth-child(even){transform:rotate(1.8deg)}body.s2 .g a:nth-child(3n){transform:rotate(-.6deg)}body.s2 .g a:hover{transform:none;z-index:2}body.s2 .g img{aspect-ratio:1;object-fit:cover}
body.s3 .g{columns:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}body.s3 .g a{margin:0;border-radius:18px;box-shadow:none}body.s3 .g a:first-child{grid-column:span 2;grid-row:span 2}body.s3 .g img{height:100%;min-height:150px;aspect-ratio:4/3;object-fit:cover}body.s3 .g a:first-child img{aspect-ratio:auto}
body.s4 .g{columns:auto;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-flow:dense;gap:4px}body.s4 .g a{margin:0;border-radius:0;box-shadow:none}body.s4 .g a:nth-child(5n+1){grid-column:span 2;grid-row:span 2}body.s4 .g a:nth-child(7n+4){grid-row:span 2}body.s4 .g img{height:100%;min-height:150px;aspect-ratio:1;object-fit:cover}body.s4 .wrap{max-width:1100px}
@media(max-width:640px){body.s3 .g,body.s4 .g{grid-template-columns:repeat(2,1fr)}body.s4 .g a:nth-child(5n+1){grid-column:span 2}}
body.s5 .g{columns:auto;display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:thin}body.s5 .g a{margin:0;flex:0 0 clamp(84px,14vw,130px);height:clamp(60px,10vw,90px);border-radius:10px;box-shadow:none;opacity:.55;transition:.25s;border:2px solid transparent}body.s5 .g a.on{opacity:1;border-color:var(--c2)}body.s5 .g img{height:100%;object-fit:cover}
.hero{position:relative;height:min(62vh,560px);border-radius:20px;overflow:hidden;margin-bottom:12px;background:#111;box-shadow:0 18px 44px rgba(0,0,0,.35);cursor:zoom-in}.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .9s,transform 6s ease-out}.hero img.on{opacity:1;transform:scale(1)}.hero .c{position:absolute;right:14px;bottom:12px;color:#fff;background:rgba(0,0,0,.45);padding:4px 12px;border-radius:20px;font:700 12px sans-serif}
body.s6 .g{columns:auto;display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 6vw 18px;margin:0 -6vw;scrollbar-width:none}body.s6 .g::-webkit-scrollbar{display:none}body.s6 .g a{margin:0;flex:0 0 min(78vw,440px);height:min(64vh,560px);scroll-snap-align:center;border-radius:28px;box-shadow:0 22px 46px rgba(0,0,0,.3)}body.s6 .g a:nth-child(even){margin-top:34px;height:min(58vh,510px)}body.s6 .g img{height:100%;object-fit:cover;transition:transform .8s}body.s6 .g a:hover img{transform:scale(1.06)}
#lb{position:fixed;inset:0;z-index:99;background:rgba(10,10,10,.93);display:none;align-items:center;justify-content:center;touch-action:pan-y}#lb.on{display:flex}#lb img{max-width:94vw;max-height:88vh;border-radius:10px}
#lb button{position:absolute;background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:50%;width:48px;height:48px;font-size:24px;cursor:pointer}#lb .x{top:16px;right:16px}#lb .p{left:14px;top:50%}#lb .n{right:14px;top:50%}#lb .c{position:absolute;bottom:18px;color:#fff;font:600 13px Montserrat}`;
  const body = header(f, ctx, T.galerie, false) + `<div class="wrap"><div class="g">${photos.map((p, i) => `<a href="assets/img/${p}" data-n="${i}"><img loading="lazy" src="assets/img/${p}" alt="${esc(f.nom)} ${i + 1}"></a>`).join('')}</div></div><div id="lb"><button class="x" aria-label="x">✕</button><button class="p">‹</button><img alt=""><button class="n">›</button><div class="c"></div></div>`;
  const js = `(function(){const A=[...document.querySelectorAll('.g a')],lb=document.getElementById('lb'),im=lb.querySelector('img'),c=lb.querySelector('.c');let k=0;
function show(i){k=(i+A.length)%A.length;im.src=A[k].href;c.textContent=(k+1)+' / '+A.length;lb.classList.add('on')}
A.forEach((a,i)=>a.onclick=e=>{e.preventDefault();show(i)});lb.querySelector('.x').onclick=()=>lb.classList.remove('on');lb.querySelector('.p').onclick=()=>show(k-1);lb.querySelector('.n').onclick=()=>show(k+1);
lb.onclick=e=>{if(e.target===lb)lb.classList.remove('on')};document.addEventListener('keydown',e=>{if(!lb.classList.contains('on'))return;if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowLeft')show(k-1);if(e.key==='ArrowRight')show(k+1)});
if(document.body.classList.contains('s5')){const g=document.querySelector('.g'),h=document.createElement('div');h.className='hero';h.innerHTML=A.map(a=>'<img src="'+a.href+'" alt="">').join('')+'<span class="c"></span>';g.parentNode.insertBefore(h,g);const H=[...h.querySelectorAll('img')];let cur=0,tm;function go(i){cur=(i+A.length)%A.length;H.forEach((x,j)=>x.classList.toggle('on',j===cur));A.forEach((a,j)=>a.classList.toggle('on',j===cur));h.querySelector('.c').textContent=(cur+1)+' / '+A.length;const t=A[cur];g.scrollTo({left:t.offsetLeft-g.clientWidth/2+t.clientWidth/2,behavior:'smooth'})}function auto(){clearInterval(tm);tm=setInterval(()=>go(cur+1),4200)}A.forEach((a,i)=>a.onclick=e=>{e.preventDefault();go(i);auto()});h.onclick=()=>show(cur);go(0);auto()}
let sx=0;lb.addEventListener('touchstart',e=>sx=e.touches[0].clientX);lb.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(k+(d<0?1:-1))})})();`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Galerie', css, body, js }) };
}

function pageCarte(f) {
  if (+styleOf(f) >= 5) return pageCarte5(f);
  const ctx = mk(), { t } = ctx, cats = parseCarte(f.carteTxt), ctr = f.carteTr || {}; let di = 0; const catT = i => t(Object.assign({ fr: cats[i].cat }, (ctr.cats || [])[i] || {}), 'span');
  const dk = mix(f.c1, '#000000', .45), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const css = `body{background:${dk}}body::before{content:"";position:fixed;inset:-10px;z-index:-1;background:${f._fond ? `linear-gradient(180deg,${dk}cc,${dk}f2),url(assets/img/fond.jpg) center/cover;filter:blur(7px) saturate(1.15)` : `radial-gradient(circle at 12% 8%,${f.c2}66,transparent 50%),radial-gradient(circle at 92% 92%,${hl}33,transparent 45%),${dk}`}}
body::after{content:"";position:fixed;inset:0;z-index:-1;background:${motif(f, '#ffffff', .05)},${GRAIN};background-blend-mode:normal,overlay;opacity:.22;pointer-events:none}
.tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tabs button{flex:none;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;border-radius:30px;padding:10px 20px;font:700 13px Montserrat,sans-serif;cursor:pointer;transition:.2s}.tabs button:hover{background:rgba(255,255,255,.2)}.tabs button.on{background:var(--c2);border-color:var(--c2);color:var(--ac)}
.card.sec{background:#fffdf8;border:0;border-radius:6px;padding:28px 26px 22px;box-shadow:0 22px 50px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.4) inset;position:relative}.card.sec::before{content:"";position:absolute;inset:8px;border:1px solid ${mix(f.c2, '#ffffff', .6)};border-radius:3px;pointer-events:none}
.card.sec h2{font-size:26px;text-align:center;margin-bottom:6px;padding-bottom:16px;position:relative}.card.sec h2::after{content:"";position:absolute;left:50%;bottom:0;width:56px;height:3px;border-radius:3px;background:var(--c2);transform:translateX(-50%)}
.it{display:flex;gap:14px;justify-content:space-between;align-items:baseline;padding:13px 4px;border-bottom:1px dotted ${mix(f.c2, '#000000', .1)}66}.it:last-child{border:0}.it b{font-size:15px;color:var(--ink)}.it p{font-size:13px;color:var(--mu);margin-top:3px;line-height:1.45}.it .pr{font-weight:800;color:var(--c2);white-space:nowrap;font-size:15px}.sec{display:none}.sec.on{display:block}`;
  const css2 = `body.s2{background:${mix(f.c1, '#000000', .5)}}body.s2 .card.sec{background:${mix(f.c1, '#000000', .38)};border-radius:10px;box-shadow:0 22px 50px rgba(0,0,0,.5),0 0 0 6px ${mix(f.c1, '#ffffff', .12)};color:#fff}body.s2 .card.sec::before{border:1.5px dashed rgba(255,255,255,.3);border-radius:6px}body.s2 .card.sec h2{color:${hl};font:400 clamp(34px,6vw,50px) "Great Vibes",cursive}body.s2 .card.sec h2::after{background:${hl};height:2px;width:90px}body.s2 .it{border-bottom:1px dotted rgba(255,255,255,.35)}body.s2 .it b{color:#fff}body.s2 .it p{color:rgba(255,255,255,.65)}body.s2 .it .pr{color:${hl};font-family:"DM Serif Display",Georgia,serif;font-size:19px;font-weight:400}
body.s3,body.s4{background:var(--bg)}body.s3::before,body.s3::after,body.s4::before,body.s4::after{display:none}body.s3 .tabs button,body.s4 .tabs button{background:#fff;border:1.5px solid var(--c1);color:var(--c1);backdrop-filter:none}body.s3 .tabs button.on,body.s4 .tabs button.on{background:var(--c1);color:#fff}
body.s3 .card.sec{background:transparent;box-shadow:none;border-radius:0;padding:0}body.s3 .card.sec::before{display:none}body.s3 .card.sec.on{display:grid;grid-template-columns:1fr 1fr;gap:12px}body.s3 .card.sec h2{grid-column:1/-1;text-align:left;font-size:clamp(30px,5vw,42px);padding:0 0 6px;margin:0}body.s3 .card.sec h2::after{left:0;transform:none}body.s3 .it{flex-direction:column-reverse;gap:8px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 6px 18px rgba(0,0,0,.06)}body.s3 .it .pr{align-self:flex-start;background:var(--c2);color:var(--ac);border-radius:30px;padding:4px 12px;font-size:14px}
body.s4 .card.sec{background:transparent;box-shadow:none;border-radius:0;padding:4px 0;columns:2 300px;column-gap:46px}body.s4 .card.sec::before{display:none}body.s4 .card.sec h2{column-span:all;text-align:left;font-size:clamp(34px,6vw,54px);border-top:4px double var(--c1);padding:16px 0 4px;margin-bottom:10px}body.s4 .card.sec h2::after{display:none}body.s4 .it{break-inside:avoid;border-bottom:1px solid var(--line)}body.s4 .it .pr{font-family:"DM Serif Display",Georgia,serif;font-weight:400;font-size:20px;color:var(--c1)}
@media(max-width:640px){body.s3 .card.sec.on{grid-template-columns:1fr}}`;
  const body = header(f, ctx, T.carte, !!schOf(f)) + `<div class="wrap"><div class="tabs">${cats.map((c, i) => `<button data-k="${i}" class="${i ? '' : 'on'}">${c.cat ? catT(i) : '·'}</button>`).join('')}</div>${cats.map((c, i) => `<div class="card sec ${i ? '' : 'on'}" id="s${i}"><h2 class="h">${catT(i)}</h2>${c.items.map(x => `<div class="it"><div><b>${esc(x.nom)}</b>${x.desc ? t(Object.assign({ fr: x.desc }, (ctr.descs || [])[di++] || {}), 'p') : ''}</div>${x.prix ? `<span class="pr">${esc(x.prix)}</span>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
  const js = `document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.sec').forEach(e=>e.classList.remove('on'));b.classList.add('on');document.getElementById('s'+b.dataset.k).classList.add('on')})`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Carte', css: css + css2, body, js, sch: schOf(f) }) };
}

function pageResa(f) {
  const ctx = mk(), { t } = ctx, heb = f.type === 'hebergement', msn = messengerUrl(f);
  const fld = (id, lab, type = 'text', extra = '') => `<label>${t(lab)}<input id="${id}" type="${type}" ${extra}></label>`;
  const form = heb
    ? `<div class="two">${fld('a', T.arrivee, 'date')}${fld('b', T.depart, 'date')}</div>${fld('p', T.voyageurs, 'number', 'min="1" value="2"')}`
    : `<div class="two">${fld('a', T.date, 'date')}${fld('b', T.heure, 'time', 'value="19:30"')}</div>${fld('p', T.pers, 'number', 'min="1" value="2"')}`;
  const css = `label{display:block;font-size:12.5px;font-weight:700;color:var(--mu);margin-bottom:12px}input,textarea{display:block;width:100%;margin-top:5px;padding:12px;border:1.5px solid var(--line);border-radius:12px;font:600 15px Montserrat,sans-serif;background:#fff}input:focus,textarea:focus{outline:0;border-color:var(--c2)}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}#sum{white-space:pre-wrap;background:var(--bg);border:1px dashed var(--c2);border-radius:12px;padding:14px;font-size:13.5px;line-height:1.6;margin:6px 0 16px}`;
  const acts = [f.tel && `<a class="btn" id="bt" href="${telHref(f.tel)}">📞 ${t(T.appeler)}</a>`, f.email && `<a class="btn" id="bm" href="#">✉️ ${t(T.email)}</a>`, msn && `<a class="btn" id="bs" target="_blank" rel="noopener" href="${msn}">💬 Messenger</a>`, f.booking && `<a class="btn" target="_blank" rel="noopener" href="${esc(f.booking)}">${t(T.reserverbk)}</a>`, `<button class="btn o" id="bc">${t(T.copier)}</button>`].filter(Boolean).join('');
  const body = header(f, ctx, T.reserver, false) + `<div class="wrap"><div class="card"><h2 class="h">${t(T.resa_t)}</h2><p class="mu" style="margin-bottom:16px">${t(T.resa_h)}</p>${form}${fld('n', T.nom)}${fld('t', T.tel, 'tel')}<label>${t(T.msg)}<textarea id="m" rows="3"></textarea></label><div id="sum"></div><div class="row">${acts}</div></div></div>`;
  const js = `(function(){const $=i=>document.getElementById(i),heb=${heb},nm=${JSON.stringify(f.nom)},em=${JSON.stringify(f.email || '')};
const d=new Date(Date.now()+86400000);$('a').value=d.toISOString().slice(0,10);if(heb)$('b').value=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
function txt(){const f=v=>v?new Date(v+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'…';
 return heb?'Demande de réservation — '+nm+'\\nArrivée : '+f($('a').value)+'\\nDépart : '+f($('b').value)+'\\nVoyageurs : '+($('p').value||'…')+'\\nNom : '+($('n').value||'…')+'\\nTél : '+($('t').value||'…')+($('m').value?'\\nMessage : '+$('m').value:'')
 :'Demande de réservation — '+nm+'\\nDate : '+f($('a').value)+'\\nHeure : '+($('b').value||'…')+'\\nPersonnes : '+($('p').value||'…')+'\\nNom : '+($('n').value||'…')+'\\nTél : '+($('t').value||'…')+($('m').value?'\\nMessage : '+$('m').value:'')}
function up(){$('sum').textContent=txt();if($('bm'))$('bm').href='mailto:'+em+'?subject='+encodeURIComponent('Réservation — '+nm)+'&body='+encodeURIComponent(txt())}
document.querySelectorAll('input,textarea').forEach(e=>e.oninput=up);up();
$('bc').onclick=async()=>{try{await navigator.clipboard.writeText(txt())}catch(e){const r=document.createRange();r.selectNode($('sum'));getSelection().removeAllRanges();getSelection().addRange(r);document.execCommand('copy')}
 const T=${JSON.stringify(T.copie)},o=$('bc').innerHTML;$('bc').textContent=T[window.__lang()];setTimeout(()=>$('bc').innerHTML=o,1500)}})();`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Réservation', css, body, js }) };
}

function pageIntro(f, hasBg) {
  const cin = +styleOf(f) === 5, rid = +styleOf(f) === 6;
  const D = mk(), L = o => JSON.stringify(obj4(o));
  const c1 = mix(f.c1, '#000000', .35), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const logo = f._logo ? (true ? `<img class="lg" src="assets/img/${f._logo}" alt="">` : `<div class="lgw"><img src="assets/img/${f._logo}" alt="${esc(f.nom)}"></div>`) : `<div class="lgw"><div class="fb">${esc(f.nom)}</div></div>`;
  const sub = f.slogan?.fr ? f.slogan : { fr: [f.type === 'hebergement' ? 'Hébergement' : f.type === 'commerce' ? 'Boutique' : 'Restaurant', f.ville].filter(Boolean).join(' · ') };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(f.nom)}</title> <meta name="description" content="${esc(f.descCourte?.fr || f.description?.fr || f.slogan?.fr || f.nom)}"><meta property="og:title" content="${esc(f.nom)}"><meta property="og:description" content="${esc(f.descCourte?.fr || f.description?.fr || '')}">
<script>if(/[?&]visite\\b/.test(location.search))document.documentElement.classList.add('visite')</script>
<style>${fontCss(f)}*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;font-family:Montserrat,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;background:${c1}}
.bg{position:fixed;inset:0;background:${hasBg ? c1 + ' url(assets/img/bg.jpg) center/cover' : `radial-gradient(circle at 18% 14%,${f.c2}77,transparent 48%),radial-gradient(circle at 88% 92%,${hl}3a,transparent 44%),${c1}`};transform:scale(1.12);opacity:0;animation:bg 4.6s .2s ease-out forwards}
.bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,${c1}8c 0%,${c1}a6 55%,${c1}e6 100%),linear-gradient(160deg,${f.c2}44,transparent 55%),${GRAIN};background-blend-mode:normal,normal,overlay}
body::after{content:"";position:fixed;inset:2.4vmin;border:1px solid ${hl}77;border-radius:1.8vmin;pointer-events:none;opacity:0;animation:fr 1.6s 1.2s forwards}body.s2::after{border:3px double ${hl}99;border-radius:0;inset:3vmin}body.s3::after{border:0;border-radius:0;inset:auto 0 0 0;height:1.2vmin;background:linear-gradient(90deg,transparent,${hl},transparent)}body.s4::after{border:0;border-radius:0;inset:3vmin;background:linear-gradient(${hl},${hl}) 0 0/6vmin 2px no-repeat,linear-gradient(${hl},${hl}) 0 0/2px 6vmin no-repeat,linear-gradient(${hl},${hl}) 100% 0/6vmin 2px no-repeat,linear-gradient(${hl},${hl}) 100% 0/2px 6vmin no-repeat,linear-gradient(${hl},${hl}) 0 100%/6vmin 2px no-repeat,linear-gradient(${hl},${hl}) 0 100%/2px 6vmin no-repeat,linear-gradient(${hl},${hl}) 100% 100%/6vmin 2px no-repeat,linear-gradient(${hl},${hl}) 100% 100%/2px 6vmin no-repeat}@keyframes fr{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:none}}
.c{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 6vw 12vmin}
.lg{width:min(40vmin,340px);height:min(40vmin,340px);border-radius:50%;object-fit:contain;padding:1.6vmin;border:clamp(4px,.8vmin,8px) solid ${hl};background:${f._logoLight ? c1 : '#fff'};opacity:0;transform:scale(.6) rotate(-8deg);animation:av 1.2s .5s cubic-bezier(.2,1.2,.3,1) forwards,fl 4s 1.8s ease-in-out infinite;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.lgw{opacity:0;transform:scale(.7);animation:av 1.1s .5s cubic-bezier(.2,1.2,.3,1) forwards;text-align:center;padding:3.4vmin 5vmin;border-radius:3vmin;background:${c1}b8;border:2px solid ${hl};box-shadow:0 18px 50px rgba(0,0,0,.55)}
.lgw img{display:block;width:min(52vmin,440px);max-height:30vmin;object-fit:contain}.fb{font:800 clamp(22px,5vmin,48px)/1.1 Montserrat,sans-serif;color:#fff;letter-spacing:.04em}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.hello{margin-top:3.4vmin;${f.police === 'sans' ? 'font:800 clamp(13px,2.4vmin,24px)/1 Montserrat,sans-serif;letter-spacing:.35em;text-transform:uppercase' : 'font:400 clamp(30px,6.4vmin,64px)/1 "Great Vibes",cursive'};color:${mix(hl, '#ffffff', .4)};text-shadow:0 2px 18px rgba(0,0,0,.6);opacity:0;animation:up .9s 1.7s forwards}
.sub{margin-top:1.4vmin;font-size:clamp(11px,1.9vmin,18px);letter-spacing:.3em;text-transform:uppercase;font-weight:800;color:#fff;opacity:0;animation:up .8s 2.4s forwards}
.sig{position:fixed;left:0;right:0;bottom:4vmin;display:flex;justify-content:center;align-items:center;gap:14px;opacity:0;animation:up .8s 3.1s forwards}
.sig .v{font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#7fd0e0;font-size:clamp(11px,1.7vmin,18px)}
.sig .n{font-weight:800;font-size:clamp(20px,3vmin,32px);color:#7fd0e0}.sig .n i{font-family:Georgia,serif;font-weight:400;color:#ddd;margin-right:.25em}
@keyframes av{to{opacity:1;transform:none}}@keyframes fl{50%{transform:translateY(-8px) rotate(-2deg)}}@keyframes bg{to{opacity:1;transform:scale(1)}}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
body.fin{animation:fin .8s forwards}@keyframes fin{to{opacity:0}}
@media(orientation:portrait){.lg{width:58vmin;height:58vmin}.lgw img{width:68vw}.sub{font-size:2.8vmin}.sig{flex-direction:column;gap:1.4vmin}.sig .v{font-size:2.8vmin}.sig .n{font-size:5.6vmin}}
${cin ? introCinemaCss(f, hl) : ''}${rid ? introRideauCss(f, hl) : ''}</style></head><body class="s${styleOf(f)}"><div class="bg"></div>${rid ? '<i class="dr l"></i><i class="dr r"></i><i class="dl"></i>' : ''}<div class="c">${cin ? `<div class="lw">${logo}<i class="ring r1"></i><i class="ring r2"></i></div>` : logo}<h1 class="vh">${esc(f.nom)}</h1><div class="hello" id="hi">${esc(T.bienvenue.fr)}</div><div class="sub" id="sb">${esc(obj4(sub).fr)}</div></div>
<div class="sig"><span class="v" id="vi">${esc(T.visite.fr)}</span><span class="n"><i>by</i> NovaVisio</span></div><svg id="iris" style="position:fixed;inset:0;width:100%;height:100%;z-index:50;pointer-events:none"><defs>
<linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#345C95"/><stop offset=".55" stop-color="#2B899D"/><stop offset="1" stop-color="#125C68"/></linearGradient>
<mask id="mk"><rect id="mr" fill="#fff"/><polygon id="hole" fill="#000"/></mask></defs>
<rect id="cov" fill="url(#ng)" mask="url(#mk)"/><polygon id="edge" fill="none" stroke="#A8DBE5" stroke-width="4"/><g id="blades" stroke="#A8DBE5" stroke-width="3" opacity=".8"></g></svg>
<script>
(function(){const T={bn:${JSON.stringify(T.bienvenue)},vi:${JSON.stringify(T.visite)},sb:${L(sub)}};
let l='';try{l=localStorage.getItem('nt_lang')||''}catch(e){}
if(!T.bn[l])l=((navigator.language||'fr').slice(0,2).toLowerCase());if(!T.bn[l])l='fr';
document.documentElement.lang=l;hi.textContent=T.bn[l];sb.textContent=T.sb[l];vi.textContent=T.vi[l]})();${cin ? introCinemaJs : ''}
/* Iris NovaTour (ouverture appareil photo bleu) — standard de toutes les intros */
(function(){const sv=document.getElementById('iris'),NB=8,ns='http://www.w3.org/2000/svg',bl=document.getElementById('blades');
 for(let i=0;i<NB;i++)bl.appendChild(document.createElementNS(ns,'line'));
 const W=innerWidth,H=innerHeight,cx=W/2,cy=H/2,Rmax=Math.hypot(W,H)*.62;sv.setAttribute('viewBox','0 0 '+W+' '+H);
 ['mr','cov'].forEach(i=>{const r=document.getElementById(i);r.setAttribute('width',W);r.setAttribute('height',H)});
 const eio=x=>{x=Math.max(0,Math.min(1,x));return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},D=1200,t0=performance.now()+150;
 (function f(now){const t=(now-t0)/D,o=eio(t),r=Rmax*o,rot=-60*(1-o)*Math.PI/180,p=[];
  for(let i=0;i<NB;i++){const a=rot+i*2*Math.PI/NB;p.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1))}
  document.getElementById('hole').setAttribute('points',p.join(' '));const e=document.getElementById('edge');e.setAttribute('points',p.join(' '));e.style.opacity=1-o*.6;
  [...bl.children].forEach((l,i)=>{const a=rot+i*2*Math.PI/NB,a2=a+2*Math.PI/NB*1.8;l.setAttribute('x1',cx+r*Math.cos(a));l.setAttribute('y1',cy+r*Math.sin(a));l.setAttribute('x2',cx+Rmax*1.6*Math.cos(a2));l.setAttribute('y2',cy+Rmax*1.6*Math.sin(a2))});
  bl.style.opacity=.8*(1-o);if(t<1.02)requestAnimationFrame(f);else sv.remove()})(performance.now());})();
setTimeout(()=>{document.body.classList.add('fin');setTimeout(()=>{document.documentElement.style.background='transparent';document.body.innerHTML=''},850)},4200);
</script></body></html>`;
  return { 'index.html': html };
}

/* ---------- boutons glossy ---------- */
const ICONS = {
  reserver: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M8.5 15l2.5 2.5 4.5-4.5"/>',
  appeler: '<path d="M21 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 4.2 2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  localisation: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  menu: '<path d="M7 2v8a2 2 0 0 0 2 2v10M5 2v6M9 2v6"/><path d="M17 22V2c-2.5 1-4 4-4 8 0 2 1.5 3 4 3"/>',
  photos: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
  infos: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/>',
  contact: '<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  plan: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  panoramas: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  son: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="M16 10.5l5.5-3.2v9.4L16 13.5z"/><path d="M7.5 9.6v4.8l4-2.4z" fill="currentColor"/>',
  pleinecran: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  vr: '<path d="M3 7.5h18a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-5l-2-2.5a1.6 1.6 0 0 0-2.5 0L9.5 17.5H3A1.5 1.5 0 0 1 1.5 16V9A1.5 1.5 0 0 1 3 7.5z"/><circle cx="7" cy="12.5" r="1.8"/><circle cx="17" cy="12.5" r="1.8"/>',
  maison: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
  play: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8.2v7.6l6-3.8z" fill="currentColor"/>',
  burger: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  fermer: '<path d="M6 6l12 12M18 6L6 18"/>',
  fleche: '<path d="M12 20V4M5 11l7-7 7 7"/>',
  lit: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>',
  cafe: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2.5 2.5 0 0 1 0 5h-2M7 3v3M11 3v3"/>',
  vin: '<path d="M7 2h10l-1 7a4 4 0 0 1-8 0zM12 13v8M8 21h8M7.5 7h9"/>',
  piscine: '<path d="M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M8 14V6a2.5 2.5 0 0 1 5 0M16 14V6a2.5 2.5 0 0 1 5 0M8 9h8"/>',
  tente: '<path d="M2 20L12 4l10 16z"/><path d="M12 4v16M8.5 20L12 13l3.5 7"/>',
  gateau: '<path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M8 12V8M12 12V7M16 12V8M8 6c0-1 .5-1.5.5-2M12 5c0-1 .5-1.5.5-2M16 6c0-1 .5-1.5.5-2"/>',
  velo: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l5 8M9 5h3"/>'
};
/* Style « bille de verre » (référence validée par Sylvain, 8 nov.) :
   sphère très sombre à reflet central doux, calotte de verre translucide en haut avec petit éclat blanc,
   liseré fin ton sable, ombre ovale au sol ; icône trait crème épais.
   normal = icône crème · survol = icône couleur d'accent · pressé = bille claire crème, liseré et icône foncés. */
const BTN_STYLE_PROMPT = 'Bouton rond glossy en verre : sphère très sombre (couleur de marque assombrie à 55 %) avec lueur douce au centre-haut, calotte de verre translucide sur la moitié haute (dégradé blanc 75 % vers transparent), petit éclat blanc ovale incliné en haut à gauche, fin liseré sable/doré, ombre ovale diffuse sous la bille, icône pictogramme à trait épais arrondi couleur crème. États : normal (icône crème), survol (icône couleur d\'accent chaude), pressé (bille claire crème, liseré et icône foncés, reflet atténué, légère réduction).';
function btnPalette(f) {
  const c2 = f.c2, c3 = f.c3 || mix(c2, '#ffffff', .5), light = lum(c2) > .62, cream = '#F2E6BC', sand = mix('#cdb88c', c2, .25);
  const dark = mix(c2, '#000000', light ? .75 : .58), deep = mix(c2, '#000000', .86);
  return {
    normal: { glow: mix(c2, '#ffffff', .12), mid: dark, edge: deep, rim: sand, rim2: mix(sand, '#000', .45), icon: light ? '#2a1a10' : cream, cap: .72, sw: 5 },
    survol: { glow: mix(c2, '#ffffff', .2), mid: mix(c2, '#000000', .5), edge: deep, rim: mix(c3, '#ffffff', .25), rim2: mix(c3, '#000', .4), icon: mix(c3, '#ffffff', .15), cap: .8, sw: 5 },
    presse: { glow: '#ffffff', mid: '#efe9e1', edge: '#d9d0c4', rim: mix(c2, '#000000', .7), rim2: mix(c2, '#000000', .8), icon: mix(c2, '#000000', .68), cap: .3, sw: 7 }
  };
}
function btnSvg(f, key, st, size) {
  const c = btnPalette(f)[st], tr = st === 'presse' ? 'translate(120 114) scale(.96) translate(-120 -114)' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 240 240"><defs>
<radialGradient id="g" cx="50%" cy="34%" r="68%"><stop offset="0" stop-color="${c.glow}"/><stop offset=".38" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.edge}"/></radialGradient>
<linearGradient id="cp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${c.cap}"/><stop offset=".6" stop-color="#fff" stop-opacity="${(c.cap * .16).toFixed(2)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="rm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.rim}"/><stop offset="1" stop-color="${c.rim2}"/></linearGradient>
<radialGradient id="sd" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<clipPath id="cl"><circle cx="120" cy="114" r="92"/></clipPath><filter id="bl"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
<ellipse cx="120" cy="214" rx="82" ry="13" fill="url(#sd)"/>
<g transform="${tr}"><circle cx="120" cy="114" r="96" fill="url(#g)"/><g clip-path="url(#cl)"><ellipse cx="120" cy="66" rx="80" ry="50" fill="url(#cp)"/></g><circle cx="120" cy="114" r="93.5" fill="none" stroke="url(#rm)" stroke-width="${c.sw}"/>${st === 'presse' ? '' : '<ellipse cx="86" cy="52" rx="17" ry="8" transform="rotate(-28 86 52)" fill="#fff" opacity=".85" filter="url(#bl)"/>'}</g>
<g transform="translate(120 114) scale(3.8) translate(-12 -12)" fill="none" stroke="${c.icon}" color="${c.icon}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</g></svg>`;
}
function svgToPng(svg, size) {
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(img, 0, 0, size, size); URL.revokeObjectURL(u); c.toBlob(res, 'image/png'); };
    img.onerror = rej; img.src = u;
  });
}
async function pageBoutons(f) {
  const files = {}, slug = slugOf(f.nom).toLowerCase();
  for (const k of Object.keys(ICONS)) for (const st of ['normal', 'survol', 'presse']) {
    files[`boutons/${slug}_${k}_${st}.png`] = await svgToPng(btnSvg(f, k, st, 256), 256);
    files[`boutons/128/${slug}_${k}_${st}.png`] = await svgToPng(btnSvg(f, k, st, 256), 128);
  }
  return files;
}

/* ---------- assemblage ---------- */
/* p = {fiche, photos:[{blob}], logo:Blob|null, fond:index} ; retourne {nom: {nom_fichier: contenu}} */
async function buildAll(p, which) {
  const f = Object.assign({ police: 'serif', logoForme: 'libre', type: 'restaurant', horaires: [], services: [] }, p.fiche);
  f.logoForme = 'rond'; f._logoLight = !!p.logoLight;
  if (!p.fiche?.c2 || f.c2 === '#2b899d') Object.assign(f, genPalette(f.nom, f.type));
  if (!p.logo && typeof monogram === 'function') { p = Object.assign({}, p, { logo: await monogram(f), logoLight: true }); f._logoLight = true; }
  f._logo = p.logo ? 'logo.png' : '';
  const imgs = {}; if (p.logo) imgs['assets/img/logo.png'] = p.logo;
  const names = p.photos.map((ph, i) => { const n = String(i + 1).padStart(2, '0') + '.jpg'; imgs['assets/img/' + n] = ph.blob; return n; });
  const out = {};
  const fonts = Object.fromEntries(fontFiles(f));
  const withFonts = (pg, extra = {}) => Object.assign({}, pg, fonts, extra);
  const hasPh = names.length > 0, heb = f.type === 'hebergement';
  const want = k => !which || which.includes(k);
  const logoOnly = p.logo ? { 'assets/img/logo.png': p.logo } : {};
  const fondIdx = pg => Math.min(Math.max((f.pfond && f.pfond[pg] != null) ? +f.pfond[pg] : (p.fond || 0), 0), names.length - 1);
  const fondFor = async pg => (f._fondIdx = hasPh ? fondIdx(pg) : -1, hasPh) ? { 'assets/img/fond.jpg': await toFond(p.photos[fondIdx(pg)].blob) } : {};
  if (hasPh) f._fond = true; f._names = names;
  if (want('intro')) { f._pg = 'intro';
    const bgIdx = fondIdx('intro'), bgf = hasPh ? { 'assets/img/bg.jpg': p.photos[bgIdx].blob } : {};
    out.intro = withFonts(pageIntro(f, hasPh), Object.assign({}, logoOnly, bgf));
  }
  const usedImgs = () => { const o = Object.fromEntries((f._used || []).map(n => ['assets/img/' + n, imgs['assets/img/' + n]])); f._used = []; return o; };
  if (want('infos')) { f._pg = 'infos'; f._used = []; const fd = await fondFor('infos'); out.infos = withFonts(pageInfos(f), Object.assign({}, logoOnly, fd)); Object.assign(out.infos, usedImgs()); };
  if (want('galerie') && hasPh) { f._pg = 'galerie'; } if (want('galerie') && hasPh) out.galerie = withFonts(pageGalerie(f, names), imgs);
  if (want('carte') && !heb && parseCarte(f.carteTxt).length) { f._pg = 'carte'; f._used = []; const fd = await fondFor('carte'); out.carte = withFonts(pageCarte(f), Object.assign({}, logoOnly, fd)); Object.assign(out.carte, usedImgs()); };
  if (want('video') && (p.videos || []).length) { f._pg = 'video'; const vf = {}, list = p.videos.map((v, i) => { const ext = /webm/.test(v.blob.type) ? 'webm' : /quicktime|mov/.test(v.blob.type) ? 'mov' : 'mp4', fn = `assets/video/v${i + 1}.${ext}`; vf[fn] = v.blob; return fn; }); out.video = withFonts(pageVideo(f, list), Object.assign({}, logoOnly, await fondFor('video'), vf)); }
  if (want('reservation') && f.type !== 'commerce') { f._pg = 'reservation'; } if (want('reservation') && f.type !== 'commerce') out.reservation = withFonts(pageResa(f), logoOnly);
  if (want('boutons')) out.boutons = await pageBoutons(f);
  return out;
}
const PAGE_NAMES = { video: 'video', intro: 'intro', infos: 'infos', galerie: 'galerie', carte: 'carte', reservation: 'reservation', boutons: 'boutons' };
