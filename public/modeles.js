/* ============================================================================
   BIBLIOTHÈQUE DE MODÈLES NovaGen — pages de référence de Sylvain, adaptées
   automatiquement selon les données disponibles (photos, horaires, carte, vidéos…).
   Ajouter un modèle = ajouter une entrée dans MODELES + sa fonction page.
   ========================================================================== */
const MODELES = [
  { id: 'intro-cinema', page: 'intro', style: '5', nom: 'Cinéma (logo 3D, titre lettre par lettre)', ref: 'https://gaiacuisine.vercel.app/', quand: 'établissement avec au moins une photo' },
  { id: 'infos-fiche', page: 'infos', style: '5', nom: 'Fiche (cartes à icônes + grande carte)', ref: 'https://miozavercel3dvista.vercel.app/', quand: 'peu de photos ; horaires/adresse mis en avant' },
  { id: 'infos-vitrine', page: 'infos', style: '6', nom: 'Vitrine (hero, note Google, sections)', ref: 'https://gaia-infos.vercel.app/', quand: '2 photos ou plus' },
  { id: 'carte-editoriale', page: 'carte', style: '5', nom: 'Éditoriale (photo + liste de plats)', ref: 'https://miozacarte.vercel.app/', quand: 'restaurant avec photos' },
  { id: 'video-signature', page: 'video', style: '', nom: 'Vidéo signature (cadre téléphone)', ref: 'https://flambadou-gaia.vercel.app/', quand: 'au moins une vidéo ajoutée' }
];

const T2 = {
  avis_t: { fr: 'Tu t\'es régalé ?', es: '¿Te encantó?', de: 'Hat es geschmeckt?', en: 'Enjoyed it?' },
  avis_s: { fr: 'Laisse-nous un avis sur Google', es: 'Déjanos una reseña en Google', de: 'Hinterlasse uns eine Google-Bewertung', en: 'Leave us a Google review' },
  veg: { fr: 'Végétarien', es: 'Vegetariano', de: 'Vegetarisch', en: 'Vegetarian' },
  emporter: { fr: 'Sur place ou à emporter', es: 'En el local o para llevar', de: 'Vor Ort oder zum Mitnehmen', en: 'Dine in or take away' },
  ambiance: { fr: 'Ambiance', es: 'Ambiente', de: 'Ambiente', en: 'Atmosphere' },
  acces: { fr: 'Accès', es: 'Cómo llegar', de: 'Anfahrt', en: 'Getting here' },
  bienv: { fr: 'Bienvenue', es: 'Bienvenidos', de: 'Willkommen', en: 'Welcome' },
  sig: { fr: 'Notre signature', es: 'Nuestra firma', de: 'Unsere Spezialität', en: 'Our signature' },
  son: { fr: 'Activer le son', es: 'Activar el sonido', de: 'Ton einschalten', en: 'Turn sound on' },
  video: { fr: 'Vidéo', es: 'Vídeo', de: 'Video', en: 'Video' }
};

/* photos choisies pour une page, différentes de la photo de fond, stables d'un aperçu à l'autre */
function pickNames(f, n, pg, skip = []) {
  const names = f._names || [], fi = f._fondIdx != null ? f._fondIdx : -1, out = [], H = hashStr(f.nom + pg);
  for (let i = 0; i < names.length * 2 && out.length < n; i++) { const j = (H + i * 5 + 1) % names.length, nm = names[j]; if ((j === fi && names.length > n) || out.includes(nm) || skip.includes(nm)) continue; out.push(nm); }
  for (let j = 0; out.length < n && j < names.length; j++) if (!out.includes(names[j])) out.push(names[j]);
  return out;
}
const svgI = p => `<svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const stars = '<span class="stars" aria-hidden="true">★★★★★</span>';
const mapEmbed = (f, h) => { const heb = f.type === 'hebergement' && !f.adresse, q = f.adresse || (f.ville ? f.nom + ' ' + f.ville : f.nom); return `<iframe title="map" loading="lazy" style="width:100%;height:${h};border:0;display:block" src="https://maps.google.com/maps?q=${encodeURIComponent(heb ? f.ville : q)}&z=${heb ? 12 : 16}&output=embed"></iframe>`; };
const hoursTable = (f, t) => (f.horaires || []).some(x => x && x.trim()) ? `<table>${DAYS.fr.map((_, i) => { const v = (f.horaires[i] || '').trim(), closed = !v || /^ferm/i.test(v); return `<tr data-day="${i}"><td>${t({ fr: DAYS.fr[i], es: DAYS.es[i], de: DAYS.de[i], en: DAYS.en[i] })}</td><td>${closed ? t(T.ferme) : esc(v)}</td></tr>`; }).join('')}</table>` : '';
const socialBtns = f => socIcons(f);
const NAV_CSS = '.navs{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.nv{flex:1 1 120px;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;text-decoration:none;font:700 13.5px Montserrat,sans-serif;padding:11px 14px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.18);transition:.15s}.nv:hover{transform:translateY(-2px);filter:brightness(1.08)}.nv span{font-size:16px}';
const SOC_CSS = SOC_ICON_CSS;

/* ---------- POINT INFO « Fiche » (modèle Mioza) ---------- */
function pageInfos5(f) {
  const ctx = mk(), { t } = ctx, sch = schOf(f), heb = f.type === 'hebergement';
  const card = (icon, title, inner) => `<div class="c5"><div class="ci5">${svgI(icon)}</div><div class="cb5">${title ? `<h3>${title}</h3>` : ''}${inner}</div></div>`;
  const parts = [];
  const adr = f.adresse || f.ville;
  if (adr) parts.push(card(ICONS.localisation, esc(adr), `<p>${heb && !f.adresse ? t(T.adr_apres) : (f.ville && !String(f.adresse || '').toLowerCase().includes(f.ville.toLowerCase()) && f.adresse ? esc(f.ville) : '')}</p>`));
  if (f.tel) parts.push(card(ICONS.appeler, `<a href="${telHref(f.tel)}" style="color:inherit;text-decoration:none">${esc(f.tel)}</a>`, f.email ? `<p><a href="mailto:${esc(f.email)}" style="color:inherit">${esc(f.email)}</a></p>` : `<p>${t(T.appeler)}</p>`));
  else if (f.email) parts.push(card(ICONS.contact, `<a href="mailto:${esc(f.email)}" style="color:inherit;text-decoration:none">${esc(f.email)}</a>`, ''));
  const ht = hoursTable(f, t); if (ht) parts.push(card('<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>', t(T.horaires, 'span'), ht));
  if ((f.services || []).length) parts.push(card('<path d="M4 8h16M4 16h16M9 3v18M15 3v18"/>', t(T.services, 'span'), `<p>${f.services.map(s => t(s)).join(' · ')}</p>`));
  const sb = socialBtns(f); if (sb) parts.push(`<div class="row5">${sb}</div>`);
  parts.push(`<a class="c5 rv" href="${mapsUrl(f)}" target="_blank" rel="noopener"><div class="ci5"><svg class="ci" viewBox="0 0 24 24"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.600-4.100H3.100v2.600A10 10 0 0 0 12 22z"/><path fill="#fbbc05" d="M6.400 13.900a6 6 0 0 1 0-3.800V7.500H3.100a10 10 0 0 0 0 9z"/><path fill="#ea4335" d="M12 6c1.500 0 2.800.5 3.800 1.500l2.800-2.800A10 10 0 0 0 3.100 7.500l3.300 2.600C7.200 7.800 9.400 6 12 6z"/></svg></div><div class="cb5"><h3>${t(T.avis_t, 'span')}</h3><p>${t(T.avis_s, 'span')}</p></div>${stars}</a>`);
  const css = `body{background:var(--bg)}.g5{display:grid;grid-template-columns:minmax(300px,390px) 1fr;gap:18px;max-width:1240px;margin:0 auto;padding:20px 18px 36px;align-items:start}
.c5{display:flex;gap:14px;align-items:flex-start;background:#fffdfb;border:1px solid var(--line);border-radius:20px;padding:16px 18px;margin-bottom:12px;box-shadow:0 6px 22px rgba(0,0,0,.05);text-decoration:none;color:inherit}
.ci5{flex:none;color:var(--c2);padding-top:2px}.ci{width:24px;height:24px;display:block}.cb5{flex:1}.cb5 h3{font:700 16px Montserrat,sans-serif;color:var(--c1)}.cb5 p{font-size:13.5px;color:var(--mu);margin-top:3px;line-height:1.5}.cb5 table{width:100%;border-collapse:collapse;margin-top:8px}
.cb5 td{padding:4px 0;font-size:13px;color:var(--mu)}.cb5 td:last-child{text-align:right;color:var(--ink);font-weight:600}.cb5 tr.today td{background:none;color:var(--c2);font-weight:800}
.row5{display:flex;gap:10px;margin-bottom:12px}${SOC_CSS}.rv{align-items:center}.rv .stars{color:#f5b301;font-size:17px;letter-spacing:2px}
.mp{position:sticky;top:78px;height:calc(100vh - 104px);min-height:440px;border-radius:26px;overflow:hidden;background:var(--bg2);box-shadow:0 14px 40px rgba(0,0,0,.14);border:1px solid var(--line)}.mp iframe{position:absolute;inset:0;width:100%!important;height:100%!important}
.mp .navs{position:absolute;left:14px;right:14px;bottom:14px;margin:0;z-index:2}.mp .nv{box-shadow:0 8px 20px rgba(0,0,0,.25)}
${NAV_CSS}@media(max-width:860px){.g5{grid-template-columns:1fr}.mp{position:relative;top:0;height:380px;min-height:0}}`;
  const body = header(f, ctx, T.infos, !!sch) + `<div class="g5"><div>${parts.join('')}</div><div class="mp">${mapEmbed(f, '100%')}${navBtns(f)}</div></div>`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Infos', css, body, sch }) };
}

/* ---------- POINT INFO « Vitrine » (modèle Gaïa) ---------- */
function pageInfos6(f) {
  const ctx = mk(), { t } = ctx, sch = schOf(f), heb = f.type === 'hebergement', ph = pickNames(f, 2, 'infos'), used = ph.slice();
  f._used = used;
  const dk = mix(f.c1, '#000000', .55), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const sub = f.slogan?.fr ? t(f.slogan, 'p', 'sl') : '', desc = f.description?.fr || f.descCourte?.fr;
  const ht = hoursTable(f, t), acts = [f.tel && `<a class="btn" href="${telHref(f.tel)}">📞 ${t(T.appeler)}</a>`, f.booking && `<a class="btn" href="${esc(f.booking)}" target="_blank" rel="noopener">${t(T.reserverbk)}</a>`, f.email && `<a class="btn o" href="mailto:${esc(f.email)}">✉️ ${t(T.email)}</a>`].filter(Boolean).join('');
  const nav = [['bv', T2.bienv], ph.length ? ['am', T2.ambiance] : null, ht ? ['hr', T.horaires] : null, ['ac', T2.acces], acts ? ['rs', T.reserver] : null].filter(Boolean);
  const sec = (id, title, inner) => `<section id="${id}"><h2 class="h">${title}<i></i></h2>${inner}</section>`;
  const body = header(f, ctx, T.infos, !!sch) + `<div class="hero6"><div class="hc6">${f._logo ? `<img class="lg6" src="assets/img/${f._logo}" alt="">` : ''}<h1 class="h">${esc(f.nom)}</h1>${sub}${f.avis ? `<div class="av6">${stars}<span>${esc(f.avis)}</span></div>` : ''}</div></div>
<nav class="pl6">${nav.map(([id, l]) => `<a href="#${id}">${t(l)}</a>`).join('')}</nav><div class="w6">
${sec('bv', t(T2.bienv), `<p class="tx6">${desc ? t(f.description?.fr ? f.description : f.descCourte, 'span') : ''}</p>`)}
${ph.length ? sec('am', t(T2.ambiance), `<div class="sp6"><div class="sg6"><small>${t(T2.sig)}</small><h3 class="h">${esc(f.nom)}</h3><p>${f.descCourte?.fr ? t(f.descCourte, 'span') : ''}</p></div>${ph.map(p => `<img src="assets/img/${p}" alt="">`).join('')}</div>`) : ''}
${ht ? sec('hr', t(T.horaires), `<div class="cd6">${ht}</div>`) : ''}
${sec('ac', t(T2.acces), `<div class="cd6"><p><b>${esc(f.adresse || f.ville || '')}</b>${f.tel ? `<br><a href="${telHref(f.tel)}" style="color:inherit">${esc(f.tel)}</a>` : ''}</p>${navBtns(f)}<div class="mp6">${mapEmbed(f, '300px')}</div></div>`)}
${acts ? sec('rs', t(T.reserver), `<div class="row" style="justify-content:center">${acts}${socialBtns(f) ? `</div><div class="row" style="justify-content:center;margin-top:12px;max-width:420px;margin-inline:auto">${socialBtns(f)}` : ''}</div>`) : ''}</div>`;
  const css = `html{scroll-behavior:smooth}body{background:${dk};color:#efe7df}.top{background:${mix(dk, '#000000', .3)}cc;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.hero6{min-height:min(72vh,560px);display:flex;align-items:center;justify-content:center;text-align:center;padding:40px 20px;background:${f._fond ? `linear-gradient(180deg,${dk}55,${dk}cc 85%,${dk}),url(assets/img/fond.jpg) center/cover` : `radial-gradient(circle at 20% 15%,${f.c2}66,transparent 55%),${dk}`}}
.lg6{width:min(24vmin,150px);height:min(24vmin,150px);border-radius:50%;object-fit:contain;padding:8px;background:${f._logoLight ? dk : '#f6f1ea'};box-shadow:0 14px 40px rgba(0,0,0,.55);margin-bottom:18px}
.hero6 h1{font-size:clamp(38px,8vw,78px);text-transform:uppercase;letter-spacing:.06em;font-weight:400;line-height:1;color:#fff}.hero6 .sl{font:italic 400 clamp(17px,3vw,24px) "DM Serif Display",Georgia,serif;margin-top:12px;color:#e9ddd0}
.av6{margin-top:16px;display:flex;gap:10px;justify-content:center;align-items:center;font-size:14px;color:#d8cdbf;flex-wrap:wrap}.stars{color:${hl};font-size:20px;letter-spacing:3px}
.pl6{position:sticky;top:62px;z-index:20;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:14px 12px;background:${mix(dk, '#000000', .25)}ee;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid #ffffff14}
.pl6 a{color:#fff;text-decoration:none;border:1px solid #ffffff55;border-radius:30px;padding:9px 20px;font:500 14px Montserrat,sans-serif;transition:.2s}.pl6 a:hover{background:${hl};color:#1d1a17;border-color:${hl}}
.w6{max-width:1100px;margin:0 auto;padding:30px 20px 70px}.w6 section{scroll-margin-top:130px;margin-top:54px}.w6 h2{display:flex;align-items:center;gap:18px;font-size:clamp(26px,4vw,38px);font-weight:400;color:${mix(hl, '#ffffff', .15)};margin-bottom:22px}.w6 h2 i{flex:1;height:1px;background:linear-gradient(90deg,#ffffff30,transparent)}
.tx6{font-size:16px;line-height:1.85;color:#d9cfc4;max-width:820px}.sp6{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:16px}.sp6 img{width:100%;height:100%;min-height:300px;object-fit:cover;border-radius:18px}
.sg6{border:1px solid ${hl}55;border-radius:18px;padding:34px 30px;background:linear-gradient(135deg,${f.c2}22,transparent);display:flex;flex-direction:column;justify-content:center}.sg6 small{font:600 11px Montserrat,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:${hl}}.sg6 h3{font-size:34px;font-weight:400;margin:10px 0 12px;color:#fff}.sg6 p{font-size:15px;line-height:1.75;color:#cfc4b8}
.cd6{background:#ffffff0a;border:1px solid #ffffff1a;border-radius:20px;padding:22px 24px}.cd6 table{width:100%;max-width:520px;border-collapse:collapse}.cd6 td{padding:7px 0;font-size:15px;color:#cfc4b8}.cd6 td:last-child{text-align:right;color:#fff}.cd6 tr.today td{background:none;color:${hl};font-weight:800}
.cd6 .btn.o{background:transparent;color:#fff;border-color:#ffffff66}.mp6{margin-top:14px;border-radius:16px;overflow:hidden}.cd6 p{font-size:15px;line-height:1.7}
@media(max-width:820px){.sp6{grid-template-columns:1fr}.sp6 img{min-height:220px}}${SOC_CSS}${NAV_CSS}`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Infos', css, body, sch }) };
}

/* ---------- CARTE « Éditoriale » (modèle Mioza) ---------- */
function pageCarte5(f) {
  const ctx = mk(), { t } = ctx, cats = parseCarte(f.carteTxt), ctr = f.carteTr || {}; let di = 0;
  const catT = i => t(Object.assign({ fr: cats[i].cat }, (ctr.cats || [])[i] || {}), 'span');
  const nph = (f._names || []).length, used = [], H = hashStr(f.nom);
  const photoOf = (c, i) => { if (!nph) return ''; const n = c.photo && c.photo >= 1 && c.photo <= nph ? f._names[c.photo - 1] : pickNames(f, Math.min(nph, cats.length), 'carte')[i % Math.min(nph, cats.length)]; if (n && !used.includes(n)) used.push(n); return n; };
  const hasVeg = cats.some(c => c.items.some(x => x.veg)), sub0 = [f.type === 'commerce' ? '' : f.slogan?.fr ? '' : '', f.ville].join('');
  const sections = cats.map((c, i) => { const ph = photoOf(c, i); return `<section class="sc ${i ? '' : 'on'}" id="s${i}">${ph ? `<div class="pz"><img src="assets/img/${ph}" alt=""></div>` : ''}<div class="lz"><h2 class="h">${catT(i)}</h2>${c.sub ? `<p class="cs">${esc(c.sub)}</p>` : ''}<div class="rl"></div>${c.items.map(x => `<div class="it5"><div class="l1"><b>${esc(x.nom)}</b>${x.veg ? '<span class="vg">🌿</span>' : ''}<i></i>${x.prix ? `<span class="pr">${esc(x.prix)}</span>` : ''}</div>${x.desc ? t(Object.assign({ fr: x.desc }, (ctr.descs || [])[di++] || {}), 'p') : ''}</div>`).join('')}</div></section>`; }).join('');
  f._used = used;
  const dk = mix(f.c1, '#000000', .1);
  const body = header(f, ctx, T.carte, !!schOf(f)) + `<div class="hd5"><h1 class="sc5">${t(T.carte)}</h1><p>${esc([f.type === 'commerce' ? '' : f.type === 'hebergement' ? '' : (f.slogan?.fr || ''), f.ville].filter(Boolean).join(' · '))}</p></div><nav class="tb5">${cats.map((c, i) => `<button data-k="${i}" class="${i ? '' : 'on'}">${c.cat ? catT(i) : '·'}</button>`).join('')}</nav><div class="w5">${sections}<footer class="ft5">${hasVeg ? `🌿 ${t(T2.veg)} · ` : ''}${t(T2.emporter)}<br>${esc([f.nom, f.adresse, f.tel].filter(Boolean).join(' · '))}</footer></div>`;
  const css = `body{background:linear-gradient(160deg,#fff 0%,var(--bg) 60%,var(--bg2) 100%)}.hd5{text-align:center;padding:30px 18px 6px}.sc5{font:400 clamp(54px,11vw,96px)/1 "Great Vibes",cursive;color:${dk}}.hd5 p{font:600 12px Montserrat,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:var(--c2);margin-top:6px}
.tb5{position:sticky;top:62px;z-index:20;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:14px 12px;margin-top:14px;background:#ffffffd9;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.tb5 button{border:1px solid var(--line);background:#fff;border-radius:30px;padding:9px 20px;font:700 13.5px Montserrat,sans-serif;color:var(--c1);cursor:pointer;transition:.2s}.tb5 button.on{background:var(--c2);border-color:var(--c2);color:var(--ac);box-shadow:0 8px 20px ${f.c2}55}
.w5{max-width:1060px;margin:0 auto;padding:30px 20px 50px}.sc{display:none;grid-template-columns:minmax(260px,.9fr) 1.15fr;gap:46px;align-items:start}.sc.on{display:grid}.sc:not(:has(.pz)){grid-template-columns:1fr;max-width:720px;margin:0 auto}
.pz{position:sticky;top:150px;background:#fff;padding:6px;border-radius:30px;box-shadow:0 22px 50px rgba(0,0,0,.16)}.pz img{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:24px}
.lz h2{font-size:clamp(34px,5vw,50px);color:${dk};line-height:1.05}.cs{font:italic 400 19px "DM Serif Display",Georgia,serif;color:var(--c2);margin-top:6px}.rl{height:2px;background:linear-gradient(90deg,var(--line),transparent);margin:16px 0 8px}
.it5{padding:13px 0;border-bottom:1px dashed var(--line)}.it5 .l1{display:flex;align-items:baseline;gap:8px}.it5 b{font:400 21px "DM Serif Display",Georgia,serif;color:var(--ink)}.vg{font-size:15px}.it5 i{flex:1;border-bottom:1px dotted ${mix(f.c2, '#000000', .1)}88;transform:translateY(-4px)}.it5 .pr{font:800 16px Montserrat,sans-serif;color:var(--c2);white-space:nowrap}.it5 p{font-size:13.5px;color:var(--mu);margin-top:4px;line-height:1.5}
.ft5{grid-column:1/-1;text-align:center;font-size:13px;color:var(--mu);line-height:1.8;margin-top:36px}.w5>.ft5{display:block}
@media(max-width:760px){.sc.on{grid-template-columns:1fr;gap:20px}.pz{position:static}.pz img{aspect-ratio:16/10}}`;
  const js = `document.querySelectorAll('.tb5 button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tb5 button,.sc').forEach(e=>e.classList.remove('on'));b.classList.add('on');document.getElementById('s'+b.dataset.k).classList.add('on');window.scrollTo({top:0,behavior:'smooth'})})`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Carte', css, body, js, sch: schOf(f) }) };
}

/* ---------- VIDÉO « signature » (modèle Flambadou) ---------- */
function pageVideo(f, vids) {
  const ctx = mk(), { t } = ctx, dk = mix(f.c1, '#000000', .6), hl = lum(f.c2) > .4 ? f.c2 : mix(f.c2, '#ffffff', .55);
  const titre = f.videoTitre || f.slogan?.fr || f.nom, sur = f.videoSur || T2.sig.fr, texte = f.videoTexte || f.descCourte?.fr || '';
  const ico = { play: '<path d="M8 5v14l11-7z" fill="currentColor"/>', pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>', on: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>', off: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M17 9l5 6M22 9l-5 6"/>', re: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>' };
  const ib = (id, k, label) => `<button id="${id}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico[k]}</svg></button>`;
  const body = header(f, ctx, T2.video, false) + `<div class="bgv"></div><main class="mv"><div class="ph"><video id="v" playsinline muted preload="auto"></video><button id="snd" class="snd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico.on}</svg><span>${t(T2.son)}</span></button><div class="ctl">${ib('pp', 'pause', 'pause')}${ib('mu', 'off', 'son')}${ib('rp', 're', 'replay')}</div><div class="pg" id="pg">${vids.map(() => '<i><b></b></i>').join('')}</div></div>
<div class="tv">${f._logo ? `<img class="lgv" src="assets/img/${f._logo}" alt="">` : ''}<small>${esc(sur)}</small><h1 class="h">${esc(titre)}</h1><div class="rl"></div><p>${esc(texte)}</p></div></main>`;
  const css = `body{background:${dk};color:#f3ece4;min-height:100vh}.bgv{position:fixed;inset:-30px;z-index:-1;background:${f._fond ? `linear-gradient(${dk}cc,${dk}ee),url(assets/img/fond.jpg) center/cover;filter:blur(18px) saturate(1.1)` : `radial-gradient(circle at 25% 20%,${f.c2}55,transparent 55%),${dk}`}}
.top{background:${mix(dk, '#000000', .3)}cc}.mv{display:grid;grid-template-columns:auto minmax(260px,420px);gap:clamp(30px,7vw,100px);align-items:center;justify-content:center;padding:28px 20px 50px;min-height:calc(100vh - 66px)}
.ph{position:relative;height:min(78vh,720px);aspect-ratio:9/16;background:#000;border-radius:34px;border:7px solid #efe7dc;box-shadow:0 30px 70px rgba(0,0,0,.6);overflow:hidden}.ph video{width:100%;height:100%;object-fit:cover;display:block}
.snd{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:0;color:#fff;cursor:pointer;font:italic 400 15px "DM Serif Display",Georgia,serif}.snd svg{width:64px;height:64px;padding:16px;border-radius:50%;background:#efe7dc;color:#2a211c;box-shadow:0 8px 24px rgba(0,0,0,.45)}.snd.off{display:none}
.ctl{position:absolute;left:0;right:0;bottom:22px;display:flex;justify-content:center;gap:12px}.ctl button{width:46px;height:46px;border-radius:50%;border:2px solid #2a211c;background:#efe7dc;color:#2a211c;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4)}.ctl svg{width:22px;height:22px}
.pg{position:absolute;left:12px;right:12px;bottom:8px;display:flex;gap:4px}.pg i{flex:1;height:3px;border-radius:3px;background:#ffffff40;overflow:hidden}.pg b{display:block;height:100%;width:0;background:${hl}}
.tv .lgv{width:96px;height:96px;border-radius:50%;object-fit:contain;padding:6px;background:${f._logoLight ? dk : '#efe7dc'};box-shadow:0 12px 30px rgba(0,0,0,.5);margin-bottom:22px}.tv small{display:block;font:600 11px Montserrat,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:${hl}}
.tv h1{font-size:clamp(34px,5vw,54px);font-weight:400;line-height:1.05;margin:10px 0 14px;color:#fff}.tv .rl{width:70px;height:2px;background:${hl};margin-bottom:16px}.tv p{font-size:15.5px;line-height:1.8;color:#e0d6ca}
@media(max-width:820px){.mv{grid-template-columns:1fr;justify-items:center;text-align:center}.ph{height:min(70vh,560px)}.tv .rl{margin-inline:auto}}`;
  const js = `(function(){const L=${JSON.stringify(vids)},v=document.getElementById('v'),bars=[...document.querySelectorAll('#pg b')],snd=document.getElementById('snd'),pp=document.getElementById('pp'),mu=document.getElementById('mu'),ph=document.querySelector('.ph');let k=0,ic={p:pp.innerHTML,pl:${JSON.stringify(ico.play)},on:${JSON.stringify(ico.on)},off:${JSON.stringify(ico.off)}};
function svg(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
function load(i){k=(i+L.length)%L.length;v.src=L[k];bars.forEach((b,j)=>b.style.width=j<k?'100%':'0');v.play().catch(()=>{})}
v.addEventListener('loadedmetadata',()=>{if(v.videoWidth&&v.videoHeight)ph.style.aspectRatio=v.videoWidth+'/'+v.videoHeight;});
v.addEventListener('timeupdate',()=>{if(v.duration)bars[k].style.width=(v.currentTime/v.duration*100)+'%'});v.addEventListener('ended',()=>{if(L.length>1)load(k+1);else{v.currentTime=0;v.play()}});
snd.onclick=()=>{v.muted=false;mu.innerHTML=svg(ic.on);snd.classList.add('off');v.play().catch(()=>{})};
mu.onclick=()=>{v.muted=!v.muted;mu.innerHTML=svg(v.muted?ic.off:ic.on);if(!v.muted)snd.classList.add('off')};
pp.onclick=()=>{if(v.paused){v.play();pp.innerHTML=svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>')}else{v.pause();pp.innerHTML=svg(ic.pl)}};
document.getElementById('rp').onclick=()=>{load(0)};load(0)})();`;
  return { 'index.html': shell(f, ctx, { title: f.nom + ' — Vidéo', css, body, js }) };
}

/* ---------- INTRO « Cinéma » : CSS/JS ajoutés à l'intro standard (iris NovaTour conservé) ---------- */
function introCinemaCss(f, hl) {
  return `.c{perspective:900px}.lw{position:relative;opacity:0;transform:translateZ(-2600px) rotateY(-540deg);filter:blur(14px);animation:far 1.3s cubic-bezier(.16,.9,.3,1) .5s forwards}
.lw .lg,.lw .lgw{animation:none;opacity:1;transform:none}.lw::after{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.75) 50%,transparent 65%) -200% 0/250% 100% no-repeat;animation:shn .8s ease-in-out 1.9s forwards;pointer-events:none}
.ring{position:absolute;inset:0;border-radius:50%;border:2px solid ${hl};opacity:0;pointer-events:none}.r1{animation:rng 1.3s ease-out 1.8s forwards}.r2{animation:rng 1.3s ease-out 2.05s forwards}
.hello.lt{opacity:1;animation:none}.hello.lt span{display:inline-block;opacity:0;transform:translateY(.7em) rotateX(-80deg);animation:lt .6s cubic-bezier(.2,.9,.3,1) forwards}
.sub{position:relative}.sub::before{content:"";display:block;width:0;height:1px;background:${hl};margin:0 auto 1.6vmin;animation:ln 1s 2.3s forwards}
@keyframes far{to{opacity:1;transform:none;filter:none}}@keyframes shn{to{background-position:200% 0}}@keyframes rng{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(1.9)}}@keyframes lt{to{opacity:1;transform:none}}@keyframes ln{to{width:min(34vmin,260px)}}
.bg{animation:bg 4.6s .2s ease-out forwards,kb 7s .2s ease-out forwards}@keyframes kb{from{filter:brightness(.8) saturate(1.1)}to{filter:brightness(1) saturate(1.15)}}`;
}
const introCinemaJs = `(function(){const h=document.getElementById('hi');if(!h)return;h.classList.add('lt');const s=h.textContent;h.innerHTML=[...s].map((c,i)=>'<span style="animation-delay:'+(1.7+i*.05).toFixed(2)+'s">'+(c===' '?'&nbsp;':c)+'</span>').join('')})();`;

/* ---- intro « rideau » (proposition 6) : deux panneaux s'ouvrent, logo en zoom doux, filet doré qui se trace ---- */
function introRideauCss(f, hl) {
  const pn = mix(f.c1, '#000000', .55);
  return `.dr{position:fixed;top:0;bottom:0;width:50.4%;z-index:20;background:linear-gradient(160deg,${mix(f.c2, '#000000', .45)},${pn});animation:dro 1.5s cubic-bezier(.76,0,.24,1) .7s forwards}.dr.l{left:0;--x:-101%;border-right:2px solid ${hl}}.dr.r{right:0;--x:101%;border-left:2px solid ${hl}}
.dl{position:fixed;left:50%;top:0;bottom:0;width:2px;margin-left:-1px;z-index:21;background:linear-gradient(${hl},transparent);transform:scaleY(0);transform-origin:top;animation:dlx .7s ease-out forwards,dlo .3s 1.4s forwards}
.bg{animation:bg 1.6s 1.1s forwards,kb 18s 1.1s ease-out forwards}.lg,.lgw{animation:zin 1.7s 1.4s cubic-bezier(.2,.8,.2,1) forwards;transform:scale(1.5);filter:blur(10px)}
.hello{animation:up .9s 2.5s forwards}.sub{animation:up .9s 2.8s forwards}.sub::before{content:"";display:block;width:0;height:1px;background:${hl};margin:0 auto 1.6vmin;animation:ln 1s 2.6s forwards}
@keyframes dro{to{transform:translateX(var(--x))}}@keyframes dlx{to{transform:scaleY(1)}}@keyframes dlo{to{opacity:0}}@keyframes kb{to{transform:scale(1.0)}}@keyframes zin{to{opacity:1;transform:none;filter:none}}@keyframes ln{to{width:min(34vmin,260px)}}`;
}
