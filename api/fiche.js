// NovaGen — recherche automatique de la fiche d'un établissement
// Variables Vercel : ANTHROPIC_API_KEY (obligatoire), APP_PASSWORD (conseillé), CLAUDE_MODEL (facultatif)
const UA = 'Mozilla/5.0 (compatible; NovaGen/1.0)';
const MODEL = () => process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

async function get(url, ms = 9000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': UA, 'accept-language': 'fr-FR,fr;q=0.9', accept: 'text/html,*/*' } });
    if (!r.ok) return '';
    return await r.text();
  } catch (e) { return ''; } finally { clearTimeout(t); }
}
const clean = h => h.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

function extract(html, base) {
  const photos = [], logos = [], abs = u => { try { return new URL(u.replace(/&amp;/g, '&'), base).href; } catch (e) { return ''; } };
  const add = (u, arr, hint = '') => { u = abs(u); if (!u || /^data:/.test(u)) return; if (/\.(svg|gif|ico)(\?|$)/i.test(u)) return; if (/logo/i.test(u + hint)) { if (/\.(png|jpe?g|webp)(\?|$)/i.test(u)) logos.push(u); return; } if (/(icon|favicon|sprite|pixel|flag|avatar|emoji|placeholder|loader|spinner|payment|badge|tripadvisor|google|facebook|instagram)/i.test(u)) return; arr.push(u.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)(\?|$))/i, '')); };
  let m; const reImg = /<img\b[^>]*>/gi;
  while ((m = reImg.exec(html))) {
    const tag = m[0], alt = (tag.match(/alt=["']([^"']*)/i) || [])[1] || '';
    const ss = (tag.match(/(?:data-)?srcset=["']([^"']+)/i) || [])[1];
    let src = (tag.match(/data-(?:lazy-)?src=["']([^"']+)/i) || tag.match(/\ssrc=["']([^"']+)/i) || [])[1];
    if (ss) { const best = ss.split(',').map(s => s.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || 0) - parseInt(a[1] || 0))[0]; if (best && best[0]) src = best[0]; }
    if (src) add(src, photos, alt);
  }
  const reBg = /url\((['"]?)([^)'"]+\.(?:jpe?g|png|webp)[^)'"]*)\1\)/gi;
  while ((m = reBg.exec(html))) add(m[2], photos);
  const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) || [])[1]; if (og) add(og, photos);
  const ap = (html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon)[^>]*href=["']([^"']+)/i) || [])[1]; if (ap && /\.(png|jpe?g|webp)/i.test(ap)) logos.push(abs(ap));
  const theme = (html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-f]{3,6})/i) || [])[1] || '';
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].map(x => abs(x[1])).filter(u => u && new URL(u).host === new URL(base).host && /(galerie|gallery|photo|carte|menu|contact|horaire|infos|a-propos|about|tarif|services|restaurant|hebergement|logement)/i.test(u));
  return { photos, logos, theme, links: [...new Set(links)] };
}

async function claude(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-fetch-2025-09-10', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Erreur API ' + r.status); return j;
}
const textOf = j => (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
function jsonOf(s) { const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < 0) throw new Error('Réponse non exploitable'); return JSON.parse(s.slice(a, b + 1)); }

const SCHEMA = `{
 "type": "restaurant | hebergement | commerce",
 "nom": "", "ville": "",
 "slogan": {"fr":"court, 3 à 6 mots, ex. Burgers · Cassolettes · Narbonne","es":"","de":"","en":""},
 "description": {"fr":"2-3 phrases, ton chaleureux, factuel","es":"","de":"","en":""},
 "adresse": "adresse postale complète (vide pour un hébergement)", "tel": "", "email": "", "site": "", "facebook": "", "instagram": "", "reservation_url": "lien de réservation en ligne s'il existe (Airbnb, Booking, TheFork...)",
 "horaires": ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"] (7 chaînes, ex. "12h–14h · 19h–22h" ou "Fermé"; tableau vide pour un hébergement),
 "services": [{"fr":"Wi-Fi","es":"Wi-Fi","de":"WLAN","en":"Wi-Fi"}],
 "carte": [{"cat":"Burgers","items":[{"nom":"","prix":"12,50 €","desc":""}]}] (restaurant uniquement, seulement si la carte est réellement publiée),
 "c1": "#hex couleur sombre de l'identité visuelle", "c2": "#hex couleur d'accent principale", "c3": "#hex couleur d'accent secondaire (survol)",
 "notes": ["chaque donnée incertaine, contradictoire ou introuvable, en français"]
}`;

async function search(b) {
  const links = [b.site, b.facebook, b.instagram, ...(b.autres || '').split(/\s+/)].filter(x => /^https?:\/\//i.test(x || ''));
  if (!links.length && !b.nom) throw new Error('Colle au moins un lien ou un nom.');
  const site = [b.site, ...links].find(u => u && !/facebook|instagram|airbnb|tripadvisor|google|booking|tiktok/i.test(u));
  let text = '', photos = [], logos = [], theme = '';
  if (site) {
    const home = await get(site); const ex = extract(home, site); photos.push(...ex.photos); logos.push(...ex.logos); theme = ex.theme; text += '--- ' + site + '\n' + clean(home).slice(0, 7000) + '\n';
    const subs = await Promise.all(ex.links.slice(0, 4).map(async u => [u, await get(u)]));
    for (const [u, h] of subs) { if (!h) continue; const e2 = extract(h, u); photos.push(...e2.photos); logos.push(...e2.logos); text += '--- ' + u + '\n' + clean(h).slice(0, 4500) + '\n'; }
  }
  let social = '';
  for (const u of links.filter(x => /facebook\.com|instagram\.com/i.test(x)).slice(0, 2)) {
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'accept-language': 'fr-FR,fr;q=0.9' } }); clearTimeout(tm);
      const h = r.ok ? await r.text() : '';
      const og = k => ((h.match(new RegExp('<meta[^>]+property=["\\\']og:' + k + '["\\\'][^>]+content=["\\\']([^"\\\']+)', 'i')) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#x27;|&#039;/g, "'").replace(/&quot;/g, '"');
      const img = og('image'); if (img) photos.push(img);
      const t = [og('title'), og('description')].filter(Boolean).join(' — '); if (t) social += '--- ' + u + ' (aperçu public) : ' + t.slice(0, 600) + '\n';
    } catch (e) { }
  }
  if (social) text += social;
  const uniq = a => [...new Set(a)];
  photos = uniq(photos).slice(0, 40); logos = uniq(logos).slice(0, 5);
  const prompt = `Tu prépares la fiche d'un établissement pour une visite virtuelle (NovaTour, Narbonne).
Liens fournis : ${links.join(' , ') || '(aucun)'}${b.nom ? '\nNom indiqué : ' + b.nom : ''}${b.adresse ? '\nAdresse de l\'établissement visé : ' + b.adresse : ''}${b.tel ? '\nTéléphone connu : ' + b.tel : ''}${b.type ? '\nType imposé : ' + b.type : ''}
${text ? 'Texte déjà extrait du site officiel :\n' + text.slice(0, 15000) : "Aucun texte de site : utilise la recherche web (site officiel, Tripadvisor, office de tourisme, presse locale)."}

Consignes :
- Utilise la recherche web pour compléter et recouper (horaires, téléphone, adresse, carte), surtout si le texte du site est pauvre. Facebook et Instagram sont souvent inaccessibles : si c'est le cas, passe par d'autres sources.
- N'INVENTE RIEN. Une donnée introuvable reste vide. Toute donnée incertaine, contradictoire ou venant d'une seule source douteuse va dans "notes".
- Détecte le type. Hébergement : pas d'adresse précise, pas d'horaires.
- Traduis slogan, description et services en espagnol, allemand, anglais.
- Couleurs c1/c2/c3 : celles de la marque (logo, site${theme ? ', theme-color ' + theme : ''}) ; sinon un choix sobre cohérent avec le type d'établissement.
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, selon ce modèle :
${SCHEMA}`;
  const messages = [{ role: 'user', content: prompt }];
  let j, f = null, lastText = '';
  const parse = t => { try { return jsonOf(t); } catch (e) { return null; } };
  for (let i = 0; i < 4; i++) {
    j = await claude({ model: MODEL(), max_tokens: 12000, messages, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }, { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 4 }] });
    lastText = textOf(j);
    if (j.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: j.content });
  }
  f = parse(lastText);
  if (!f) {
    // 2e passage sans outils : on force la réponse JSON à partir de ce qui a été trouvé
    messages.push({ role: 'assistant', content: j.content.length ? j.content : [{ type: 'text', text: 'Recherche terminée.' }] });
    messages.push({ role: 'user', content: 'Maintenant, réponds UNIQUEMENT par l\'objet JSON de la fiche (aucun texte avant ou après), selon le modèle demandé, avec ce que tu as trouvé. Donnée introuvable = chaîne vide.' });
    const j2 = await claude({ model: MODEL(), max_tokens: 12000, messages });
    f = parse(textOf(j2));
    if (!f) throw new Error('Réponse non exploitable (' + (j2.stop_reason || '?') + ') : ' + textOf(j2).slice(0, 160));
  }
  return { fiche: f, photos, logos, theme };
}
async function translate(b) {
  const j = await claude({ model: MODEL(), max_tokens: 4000, messages: [{ role: 'user', content: 'Traduis du français vers l\'espagnol (es), l\'allemand (de) et l\'anglais (en), en gardant le ton commercial chaleureux et les noms propres. Réponds UNIQUEMENT en JSON : {"slogan":{"es":"","de":"","en":""},"description":{"es":"","de":"","en":""},"services":[{"es":"","de":"","en":""}]} (services dans le même ordre et même nombre que ci-dessous).\n\n' + JSON.stringify({ slogan: b.slogan, description: b.description, services: b.services }) }] });
  return jsonOf(textOf(j));
}


// Propositions d'établissements à partir d'un nom ou d'une adresse (OpenStreetMap)
async function suggest(b) {
  const q = String(b.q || '').trim(); if (q.length < 3) return { resultats: [] };
  const r = await fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', extratags: '1', limit: '10', 'accept-language': 'fr' }), { headers: { 'user-agent': 'NovaGen/1.0 (outil interne NovaTour)' } });
  if (!r.ok) throw new Error('Service d\'adresses indisponible (' + r.status + ')');
  const kind = (c, t) => c === 'amenity' && /^(restaurant|cafe|bar|pub|fast_food|biergarten|ice_cream|food_court)$/.test(t) ? 'restaurant' : c === 'tourism' && /^(hotel|guest_house|apartment|hostel|motel|camp_site|caravan_site|chalet|resort)$/.test(t) ? 'hebergement' : c === 'shop' ? 'commerce' : '';
  const seen = new Set(), out = [];
  for (const x of await r.json()) {
    const a = x.address || {}, ex = x.extratags || {}, ville = a.city || a.town || a.village || a.municipality || '', rue = [a.house_number, a.road].filter(Boolean).join(' ');
    const adresse = [rue, [a.postcode, ville].filter(Boolean).join(' ')].filter(Boolean).join(', '), nom = x.name || '', k = (nom + adresse).toLowerCase();
    if ((!nom && !adresse) || seen.has(k)) continue; seen.add(k);
    out.push({ nom, adresse, ville, type: kind(x.category, x.type), site: ex.website || ex['contact:website'] || '', facebook: ex['contact:facebook'] || '', tel: ex.phone || ex['contact:phone'] || '' });
  }
  out.sort((p, q) => (q.nom ? 1 : 0) - (p.nom ? 1 : 0));
  return { resultats: out.slice(0, 8) };
}
async function suggestWeb(b) {
  const j = await claude({ model: MODEL(), max_tokens: 3000, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }], messages: [{ role: 'user', content: `Trouve jusqu'à 5 établissements (restaurant, bar, hébergement, commerce) qui correspondent à : « ${String(b.q || '').slice(0, 200)} ». Si c'est une adresse, liste les établissements installés à cette adresse. N'invente rien. Réponds UNIQUEMENT en JSON : {"resultats":[{"nom":"","adresse":"adresse complète","ville":"","type":"restaurant|hebergement|commerce","site":"site officiel si connu"}]}` }] });
  try { const r = jsonOf(textOf(j)); return { resultats: (r.resultats || []).filter(x => x && x.nom).slice(0, 5) }; } catch (e) { return { resultats: [] }; }
}

// Parcourir les établissements d'une ville par catégorie (OpenStreetMap / Overpass)
async function browse(b) {
  const insee = String(b.insee || '').replace(/\D/g, ''); if (!insee) throw new Error('Choisis une ville.');
  const cats = { restaurant: ['["amenity"~"^(restaurant|fast_food|food_court)$"]', 'restaurant'], bar: ['["amenity"~"^(cafe|bar|pub|ice_cream)$"]', 'restaurant'], hebergement: ['["tourism"~"^(hotel|guest_house|apartment|hostel|motel|chalet|resort)$"]', 'hebergement'], camping: ['["tourism"~"^(camp_site|caravan_site)$"]', 'hebergement'], commerce: ['["shop"]', 'commerce'] };
  const c = cats[b.cat]; if (!c) throw new Error('Catégorie inconnue');
  const q = `[out:json][timeout:25];area["ref:INSEE"="${insee}"]["boundary"="administrative"]->.a;nwr${c[0]}["name"](area.a);out center tags 200;`;
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'NovaGen/1.0 (outil interne NovaTour)' }, body: 'data=' + encodeURIComponent(q) });
  if (!r.ok) throw new Error('Service de cartographie occupé, réessaie dans un instant (' + r.status + ')');
  const j = await r.json(), seen = new Set(), out = [];
  for (const e of j.elements || []) {
    const t = e.tags || {}, k = (t.name || '').toLowerCase(); if (!t.name || seen.has(k)) continue; seen.add(k);
    const rue = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '), ville = t['addr:city'] || b.ville || '';
    out.push({ nom: t.name, adresse: [rue, [t['addr:postcode'], ville].filter(Boolean).join(' ')].filter(Boolean).join(', '), ville, type: c[1], site: t.website || t['contact:website'] || '', tel: t.phone || t['contact:phone'] || '', facebook: t['contact:facebook'] || '' });
  }
  out.sort((x, y) => (y.site ? 1 : 0) - (x.site ? 1 : 0) || x.nom.localeCompare(y.nom));
  return { resultats: out.slice(0, 80), total: out.length };
}

const PATCH_KEYS = ['nom', 'ville', 'type', 'slogan', 'description', 'adresse', 'tel', 'email', 'site', 'facebook', 'instagram', 'booking', 'horaires', 'services', 'carteTxt', 'c1', 'c2', 'c3', 'police', 'logoForme'];
async function assist(b) {
  const hist = (b.history || []).map(m => (m.r === 'u' ? 'Utilisateur : ' : 'Assistant : ') + String(m.t || '').slice(0, 400)).join('\n');
  const prompt = `Tu es l'assistant intégré à NovaGen, l'outil de Sylvain (NovaVisio / NovaTour) qui génère les pages d'une visite virtuelle (intro, infos, galerie, carte, réservation, boutons) pour UN établissement.
Fiche actuelle (JSON, texte en français) :
${JSON.stringify(b.fiche)}
Photos : ${b.nbPhotos} (numérotées à partir de 1). Photo de fond de l'intro : n°${(b.fond || 0) + 1}.
${hist ? 'Échanges récents :\n' + hist + '\n' : ''}
Demande : ${b.instruction}

Réponds UNIQUEMENT par un objet JSON valide :
{"message":"réponse courte en français : ce que tu as fait, ou ta question, ou ce que tu n'as pas trouvé","patch":{ champs modifiés uniquement },"actions":[{"type":"remove_photo","n":3},{"type":"set_fond","n":2}]}
Règles :
- patch : clés autorisées = ${PATCH_KEYS.join(', ')}. slogan et description = texte français simple ; services = tableau de textes français ; horaires = tableau de 7 textes (lundi→dimanche, ex. "12h–14h · 19h–22h" ou "Fermé") ; c1/c2/c3 = couleurs #hex ; type = restaurant | hebergement | commerce ; police = serif | sans ; logoForme = libre | rond.
- Pour modifier la carte, renvoie la carte COMPLÈTE dans carteTxt, au format : lignes "# Catégorie" puis "Plat | prix | description" (en reprenant ce qui existe déjà et en appliquant le changement).
- actions : seulement si la demande concerne les photos (remove_photo, set_fond). Sinon tableau vide.
- N'invente aucune donnée (prix, horaires, téléphone). Si une info manque, demande-la dans "message" sans modifier. N'utilise la recherche web que si la demande l'exige (vérifier ou trouver une information).
- Ne modifie que ce qui est demandé.`;
  const messages = [{ role: 'user', content: prompt }];
  let j;
  for (let i = 0; i < 3; i++) {
    j = await claude({ model: MODEL(), max_tokens: 8000, messages, tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }] });
    if (j.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: j.content });
  }
  const txt = textOf(j);
  let r; try { r = jsonOf(txt); } catch (e) { return { message: txt.trim().slice(0, 600) || 'Je n\'ai pas pu traiter la demande.', patch: {}, actions: [] }; }
  const patch = {}; for (const k of PATCH_KEYS) if (r.patch && k in r.patch) patch[k] = r.patch[k];
  return { message: r.message || 'Fait.', patch, actions: Array.isArray(r.actions) ? r.actions.filter(a => a && /^(remove_photo|set_fond)$/.test(a.type)) : [] };
}

module.exports = async (req, res) => {
  try {
    if (process.env.APP_PASSWORD && req.headers['x-pass'] !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.mode === 'ping') return res.json({ ok: true, key: !!process.env.ANTHROPIC_API_KEY });
    if (b.mode === 'suggest') return res.json(await suggest(b));
    if (b.mode === 'browse') return res.json(await browse(b));
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante dans Vercel (Settings → Environment Variables).' });
    if (b.mode === 'suggest_web') return res.json(await suggestWeb(b));
    if (b.mode === 'assist') return res.json(await assist(b));
    if (b.mode === 'translate') return res.json(await translate(b));
    return res.json(await search(b));
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
