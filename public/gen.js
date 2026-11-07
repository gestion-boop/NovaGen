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
    if (/^#/.test(l)) { cur = { cat: l.replace(/^#+\s*/, ''), items: [] }; cats.push(cur); return; }
    if (!cur) { cur = { cat: '', items: [] }; cats.push(cur); }
    const p = l.split('|').map(x => x.trim());
    cur.items.push({ nom: p[0], prix: p[1] || '', desc: p[2] || '' });
  });
  return cats.filter(c => c.items.length);
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
function baseCss(f) {
  const c1 = f.c1, c2 = f.c2, bg = mix(c2, '#ffffff', .93), bg2 = mix(c2, '#ffffff', .84), line = mix(c2, '#ffffff', .7);
  const hl = lum(c2) > .4 ? c2 : mix(c2, '#ffffff', .55);
  const hf = f.police === 'sans' ? 'font-family:Montserrat,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.02em' : 'font-family:"DM Serif Display",Georgia,serif;font-weight:400';
  const sm = f.police === 'sans' ? 'font:700 11px Montserrat,sans-serif;letter-spacing:.2em;text-transform:uppercase' : 'font:400 18px "Great Vibes",cursive';
  return fontCss(f) + `:root{--c1:${c1};--c2:${c2};--hl:${hl};--bg:${bg};--bg2:${bg2};--line:${line};--ink:#1d1a17;--mu:#6b645c;--ac:${lum(c2) > .62 ? '#1d1a17' : '#fff'}}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{min-height:100%;font-family:Montserrat,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--ink)}
body{background:linear-gradient(160deg,#fff 0%,var(--bg) 55%,var(--bg2) 100%);background-attachment:fixed;overflow-y:auto;-webkit-overflow-scrolling:touch}
.h{${hf}}
.top{position:sticky;top:0;z-index:30;background:${mix(c1, '#000000', .06)};border-bottom:3px solid var(--c2);display:flex;align-items:center;gap:14px;padding:9px 20px}
.visite .top{padding-right:84px}
.top img{height:46px;width:46px;object-fit:contain;border-radius:${f.logoForme === 'rond' ? '50%' : '8px'};background:${f.logoForme === 'rond' ? '#fff' : 'transparent'};${f.logoForme === 'rond' ? 'border:2px solid var(--hl)' : ''}}
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
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title>
<script>if(/[?&]visite\\b/.test(location.search))document.documentElement.classList.add('visite')</script>
<style>${baseCss(f)}${css}</style></head><body>${body}${langJs(ctx.D, sch)}${js ? `<script>${js}</script>` : ''}</body></html>`;
}
const schOf = f => { const h = (f.horaires || []).map(parseHours); return h.some(x => x.length) ? h : null; };
const fontFiles = f => ['dmserif', 'greatvibes', 'm400', 'm600', 'm700', 'm800'].map(n => ['assets/fonts/' + n + '.woff2', { url: 'fonts/' + n + '.woff2' }]);

/* ---------- pages ---------- */
function pageInfos(f) {
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
  const adr = `<div class="card"><h2 class="h">${t(T.adresse)}</h2><p class="mu"><b style="color:var(--ink)">${esc(f.adresse || f.ville)}</b>${heb && !f.adresse ? '<br>' + t(T.adr_apres) : ''}</p>${map}</div>`;
  const cont = (f.tel || f.email) ? `<div class="card"><h2 class="h">${t(T.contact)}</h2><p class="mu">${f.tel ? `📞 <a href="${telHref(f.tel)}" style="color:inherit;font-weight:700">${esc(f.tel)}</a><br>` : ''}${f.email ? `✉️ <a href="mailto:${esc(f.email)}" style="color:inherit;font-weight:700">${esc(f.email)}</a>` : ''}</p></div>` : '';
  const sv = (f.services || []).length ? `<div class="card"><h2 class="h">${t(T.services)}</h2><div class="chips">${f.services.map(s => t(s)).join('')}</div></div>` : '';
  const soc = [f.facebook && ['Facebook', f.facebook], f.instagram && ['Instagram', f.instagram]].filter(Boolean);
  const rs = soc.length ? `<div class="card"><h2 class="h">${t(T.reseaux)}</h2><div class="row">${soc.map(([n, u]) => `<a class="btn o" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>` : '';
  const hero = `<div class="card"><h2 class="h" style="font-size:26px">${esc(f.nom)}</h2>${f.slogan?.fr ? t(f.slogan, 'p', 'mu', ' style="margin-bottom:10px;font-weight:600;color:var(--c2)"') : ''}${f.description?.fr ? t(f.description, 'p', 'mu') : ''}<div class="row" style="margin-top:16px">${acts.join('')}</div></div>`;
  const body = header(f, ctx, T.infos, !!sch) + `<div class="wrap">${hero}${hr}${adr}${cont}${sv}${rs}</div>`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Infos', body, sch }) };
}

function pageGalerie(f, photos) {
  const ctx = mk(), { t } = ctx;
  const css = `.g{columns:3 240px;column-gap:12px}.g a{display:block;margin-bottom:12px;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.12);cursor:zoom-in;break-inside:avoid;background:var(--bg2)}.g img{display:block;width:100%;height:auto;transition:.35s}.g a:hover img{transform:scale(1.04)}
#lb{position:fixed;inset:0;z-index:99;background:rgba(10,10,10,.93);display:none;align-items:center;justify-content:center;touch-action:pan-y}#lb.on{display:flex}#lb img{max-width:94vw;max-height:88vh;border-radius:10px}
#lb button{position:absolute;background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:50%;width:48px;height:48px;font-size:24px;cursor:pointer}#lb .x{top:16px;right:16px}#lb .p{left:14px;top:50%}#lb .n{right:14px;top:50%}#lb .c{position:absolute;bottom:18px;color:#fff;font:600 13px Montserrat}`;
  const body = header(f, ctx, T.galerie, false) + `<div class="wrap"><div class="g">${photos.map((p, i) => `<a href="assets/img/${p}" data-n="${i}"><img loading="lazy" src="assets/img/${p}" alt="${esc(f.nom)} ${i + 1}"></a>`).join('')}</div></div><div id="lb"><button class="x" aria-label="x">✕</button><button class="p">‹</button><img alt=""><button class="n">›</button><div class="c"></div></div>`;
  const js = `(function(){const A=[...document.querySelectorAll('.g a')],lb=document.getElementById('lb'),im=lb.querySelector('img'),c=lb.querySelector('.c');let k=0;
function show(i){k=(i+A.length)%A.length;im.src=A[k].href;c.textContent=(k+1)+' / '+A.length;lb.classList.add('on')}
A.forEach((a,i)=>a.onclick=e=>{e.preventDefault();show(i)});lb.querySelector('.x').onclick=()=>lb.classList.remove('on');lb.querySelector('.p').onclick=()=>show(k-1);lb.querySelector('.n').onclick=()=>show(k+1);
lb.onclick=e=>{if(e.target===lb)lb.classList.remove('on')};document.addEventListener('keydown',e=>{if(!lb.classList.contains('on'))return;if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowLeft')show(k-1);if(e.key==='ArrowRight')show(k+1)});
let sx=0;lb.addEventListener('touchstart',e=>sx=e.touches[0].clientX);lb.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)show(k+(d<0?1:-1))})})();`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Galerie', css, body, js }) };
}

function pageCarte(f) {
  const ctx = mk(), { t } = ctx, cats = parseCarte(f.carteTxt);
  const css = `.tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px}.tabs button{flex:none;border:2px solid var(--c1);background:#fff;color:var(--c1);border-radius:30px;padding:9px 18px;font:700 13px Montserrat,sans-serif;cursor:pointer}.tabs button.on{background:var(--c1);color:#fff}
.it{display:flex;gap:14px;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:1px dashed var(--line)}.it:last-child{border:0}.it b{font-size:15px;color:var(--ink)}.it p{font-size:13px;color:var(--mu);margin-top:3px;line-height:1.45}.it .pr{font-weight:800;color:var(--c2);white-space:nowrap;font-size:15px}.sec{display:none}.sec.on{display:block}`;
  const body = header(f, ctx, T.carte, !!schOf(f)) + `<div class="wrap"><div class="tabs">${cats.map((c, i) => `<button data-k="${i}" class="${i ? '' : 'on'}">${esc(c.cat || '·')}</button>`).join('')}</div>${cats.map((c, i) => `<div class="card sec ${i ? '' : 'on'}" id="s${i}"><h2 class="h">${esc(c.cat)}</h2>${c.items.map(x => `<div class="it"><div><b>${esc(x.nom)}</b>${x.desc ? `<p>${esc(x.desc)}</p>` : ''}</div>${x.prix ? `<span class="pr">${esc(x.prix)}</span>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
  const js = `document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.sec').forEach(e=>e.classList.remove('on'));b.classList.add('on');document.getElementById('s'+b.dataset.k).classList.add('on')})`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Carte', css, body, js, sch: schOf(f) }) };
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
  const D = mk(), L = o => JSON.stringify(obj4(o));
  const c1 = mix(f.c1, '#000000', .35), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const logo = f._logo ? (f.logoForme === 'rond' ? `<img class="lg" src="assets/img/${f._logo}" alt="">` : `<div class="lgw"><img src="assets/img/${f._logo}" alt="${esc(f.nom)}"></div>`) : `<div class="lgw"><div class="fb">${esc(f.nom)}</div></div>`;
  const sub = f.slogan?.fr ? f.slogan : { fr: [f.type === 'hebergement' ? 'Hébergement' : f.type === 'commerce' ? 'Boutique' : 'Restaurant', f.ville].filter(Boolean).join(' · ') };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(f.nom)}</title>
<script>if(/[?&]visite\\b/.test(location.search))document.documentElement.classList.add('visite')</script>
<style>${fontCss(f)}*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;font-family:Montserrat,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;background:${c1}}
.bg{position:fixed;inset:0;background:${c1}${hasBg ? ' url(assets/img/bg.jpg) center/cover' : ''};transform:scale(1.12);opacity:0;animation:bg 4.6s .2s ease-out forwards}
.bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,${c1}8c,${c1}f0)}
.c{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 6vw 12vmin}
.lg{width:min(40vmin,340px);height:min(40vmin,340px);border-radius:50%;object-fit:contain;border:clamp(4px,.8vmin,8px) solid ${hl};background:#fff;opacity:0;transform:scale(.6) rotate(-8deg);animation:av 1.2s .5s cubic-bezier(.2,1.2,.3,1) forwards,fl 4s 1.8s ease-in-out infinite;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.lgw{opacity:0;transform:scale(.7);animation:av 1.1s .5s cubic-bezier(.2,1.2,.3,1) forwards;text-align:center;padding:3.4vmin 5vmin;border-radius:3vmin;background:${c1}b8;border:2px solid ${hl};box-shadow:0 18px 50px rgba(0,0,0,.55)}
.lgw img{display:block;width:min(52vmin,440px);max-height:30vmin;object-fit:contain}.fb{font:800 clamp(22px,5vmin,48px)/1.1 Montserrat,sans-serif;color:#fff;letter-spacing:.04em}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.hello{margin-top:3.4vmin;${f.police === 'sans' ? 'font:800 clamp(13px,2.4vmin,24px)/1 Montserrat,sans-serif;letter-spacing:.35em;text-transform:uppercase' : 'font:400 clamp(30px,6.4vmin,64px)/1 "Great Vibes",cursive'};color:${hl};opacity:0;animation:up .9s 1.7s forwards}
.sub{margin-top:1.4vmin;font-size:clamp(11px,1.9vmin,18px);letter-spacing:.3em;text-transform:uppercase;font-weight:800;color:#fff;opacity:0;animation:up .8s 2.4s forwards}
.sig{position:fixed;left:0;right:0;bottom:4vmin;display:flex;justify-content:center;align-items:center;gap:14px;opacity:0;animation:up .8s 3.1s forwards}
.sig .v{font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#7fd0e0;font-size:clamp(11px,1.7vmin,18px)}
.sig .n{font-weight:800;font-size:clamp(20px,3vmin,32px);color:#7fd0e0}.sig .n i{font-family:Georgia,serif;font-weight:400;color:#ddd;margin-right:.25em}
@keyframes av{to{opacity:1;transform:none}}@keyframes fl{50%{transform:translateY(-8px) rotate(-2deg)}}@keyframes bg{to{opacity:1;transform:scale(1)}}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
body.fin{animation:fin .8s forwards}@keyframes fin{to{opacity:0}}
@media(orientation:portrait){.lg{width:58vmin;height:58vmin}.lgw img{width:68vw}.sub{font-size:2.8vmin}.sig{flex-direction:column;gap:1.4vmin}.sig .v{font-size:2.8vmin}.sig .n{font-size:5.6vmin}}
</style></head><body><div class="bg"></div><div class="c">${logo}<h1 class="vh">${esc(f.nom)}</h1><div class="hello" id="hi">${esc(T.bienvenue.fr)}</div><div class="sub" id="sb">${esc(obj4(sub).fr)}</div></div>
<div class="sig"><span class="v" id="vi">${esc(T.visite.fr)}</span><span class="n"><i>by</i> NovaVisio</span></div><svg id="iris" style="position:fixed;inset:0;width:100%;height:100%;z-index:50;pointer-events:none"><defs>
<linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#345C95"/><stop offset=".55" stop-color="#2B899D"/><stop offset="1" stop-color="#125C68"/></linearGradient>
<mask id="mk"><rect id="mr" fill="#fff"/><polygon id="hole" fill="#000"/></mask></defs>
<rect id="cov" fill="url(#ng)" mask="url(#mk)"/><polygon id="edge" fill="none" stroke="#A8DBE5" stroke-width="4"/><g id="blades" stroke="#A8DBE5" stroke-width="3" opacity=".8"></g></svg>
<script>
(function(){const T={bn:${JSON.stringify(T.bienvenue)},vi:${JSON.stringify(T.visite)},sb:${L(sub)}};
let l='';try{l=localStorage.getItem('nt_lang')||''}catch(e){}
if(!T.bn[l])l=((navigator.language||'fr').slice(0,2).toLowerCase());if(!T.bn[l])l='fr';
document.documentElement.lang=l;hi.textContent=T.bn[l];sb.textContent=T.sb[l];vi.textContent=T.vi[l]})();
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
function btnPalette(f) {
  const c2 = f.c2, c3 = f.c3 || mix(c2, '#ffffff', .5), icon = lum(c2) > .62 ? '#2a1a10' : '#FFF6E3';
  return {
    normal: [mix(c2, '#ffffff', .22), c2, mix(c2, '#000000', .45), mix(c2, '#ffffff', .8), icon, .42],
    survol: [mix(c3, '#ffffff', .3), c3, mix(c3, '#000000', .35), mix(c3, '#000000', .78), mix(c3, '#000000', .8), .38],
    presse: [mix(c2, '#000000', .45), mix(c2, '#000000', .6), mix(c2, '#000000', .75), mix(c2, '#ffffff', .6), mix(c2, '#ffffff', .82), .12]
  };
}
function btnSvg(f, key, st, size) {
  const c = btnPalette(f)[st], tr = st === 'presse' ? 'translate(120 114) scale(.96) translate(-120 -114)' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 240 240"><defs>
<radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".7" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>
<radialGradient id="hl" cx="38%" cy="20%" r="48%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter></defs>
<g transform="${tr}"><circle cx="120" cy="114" r="96" fill="url(#g)" filter="url(#sh)"/><circle cx="120" cy="114" r="94" fill="none" stroke="${c[3]}" stroke-width="5"/><ellipse cx="108" cy="62" rx="50" ry="24" fill="url(#hl)" opacity="${c[5]}"/></g>
<g transform="translate(120 114) scale(3.2) translate(-12 -12)" fill="none" stroke="${c[4]}" color="${c[4]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]}</g></svg>`;
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
  const f = Object.assign({ c1: '#1f2a44', c2: '#2b899d', police: 'serif', logoForme: 'libre', type: 'restaurant', horaires: [], services: [] }, p.fiche);
  f._logo = p.logo ? 'logo.png' : '';
  const imgs = {}; if (p.logo) imgs['assets/img/logo.png'] = p.logo;
  const names = p.photos.map((ph, i) => { const n = String(i + 1).padStart(2, '0') + '.jpg'; imgs['assets/img/' + n] = ph.blob; return n; });
  const out = {};
  const fonts = Object.fromEntries(fontFiles(f));
  const withFonts = (pg, extra = {}) => Object.assign({}, pg, fonts, extra);
  const hasPh = names.length > 0, heb = f.type === 'hebergement';
  const want = k => !which || which.includes(k);
  const logoOnly = p.logo ? { 'assets/img/logo.png': p.logo } : {};
  if (want('intro')) {
    const bgIdx = Math.min(p.fond || 0, names.length - 1), bgf = hasPh ? { 'assets/img/bg.jpg': p.photos[bgIdx].blob } : {};
    out.intro = withFonts(pageIntro(f, hasPh), Object.assign({}, logoOnly, bgf));
  }
  if (want('infos')) out.infos = withFonts(pageInfos(f), logoOnly);
  if (want('galerie') && hasPh) out.galerie = withFonts(pageGalerie(f, names), imgs);
  if (want('carte') && !heb && parseCarte(f.carteTxt).length) out.carte = withFonts(pageCarte(f), logoOnly);
  if (want('reservation') && f.type !== 'commerce') out.reservation = withFonts(pageResa(f), logoOnly);
  if (want('boutons')) out.boutons = await pageBoutons(f);
  return out;
}
const PAGE_NAMES = { intro: 'intro', infos: 'infos', galerie: 'galerie', carte: 'carte', reservation: 'reservation', boutons: 'boutons' };
