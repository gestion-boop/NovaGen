/* NovaGen — sauvegarde serveur (Supabase) : table novagen_projects + bucket privé "novagen".
   Variables Vercel : SUPABASE_URL, SUPABASE_SERVICE_KEY (clé service_role, jamais exposée au navigateur). */
const URL_ = () => (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = () => process.env.SUPABASE_SERVICE_KEY || '';
const H = (x = {}) => Object.assign({ apikey: KEY(), Authorization: 'Bearer ' + KEY() }, x);
const ID = /^[A-Za-z0-9_-]{3,60}$/, NAME = /^(logo\.png|p\/[A-Za-z0-9_-]{3,60}\.jpg|pv\/[A-Za-z0-9_-]{3,60}\.mp4|tv\/[A-Za-z0-9_-]{3,60}\.mp4)$/;
const j = async r => { const t = await r.text(); let o; try { o = JSON.parse(t); } catch (e) { o = t; } if (!r.ok) throw new Error((o && (o.message || o.error)) || ('Supabase ' + r.status)); return o; };
const rest = (path, opt = {}) => fetch(URL_() + '/rest/v1/' + path, Object.assign({}, opt, { headers: H(Object.assign({ 'content-type': 'application/json' }, opt.headers || {})) })).then(j);
const sign = async (id, names) => {
  if (!names.length) return {};
  const o = await fetch(URL_() + '/storage/v1/object/sign/novagen', { method: 'POST', headers: H({ 'content-type': 'application/json' }), body: JSON.stringify({ expiresIn: 3600, paths: names.map(n => id + '/' + n) }) }).then(j), out = {};
  for (const x of o) if (x.signedURL) out[x.path.slice(id.length + 1)] = URL_() + '/storage/v1' + x.signedURL;
  return out;
};
const rmFiles = async (id, names) => { if (!names.length) return; await fetch(URL_() + '/storage/v1/object/novagen', { method: 'DELETE', headers: H({ 'content-type': 'application/json' }), body: JSON.stringify({ prefixes: names.map(n => id + '/' + n) }) }).then(j); };
const listFiles = async id => {
  const out = [];
  for (const dir of ['', 'p', 'pv', 'tv']) { const o = await fetch(URL_() + '/storage/v1/object/list/novagen', { method: 'POST', headers: H({ 'content-type': 'application/json' }), body: JSON.stringify({ prefix: id + (dir ? '/' + dir : ''), limit: 1000 }) }).then(j); for (const f of o) if (f.id) out.push((dir ? dir + '/' : '') + f.name); }
  return out;
};

module.exports = async (req, res) => {
  try {
    if (process.env.APP_PASSWORD && req.headers['x-pass'] !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.mode === 'status') return res.json({ configured: !!(URL_() && KEY()) });
    if (!URL_() || !KEY()) return res.status(501).json({ error: 'Sauvegarde serveur non configurée (SUPABASE_URL et SUPABASE_SERVICE_KEY dans Vercel).' });
    if (b.mode === 'list') return res.json({ items: await rest('novagen_projects?select=id,updated_at,deleted_at&order=updated_at.desc&limit=1000') });
    if (b.id !== undefined && !ID.test(b.id)) return res.status(400).json({ error: 'id invalide' });
    if (b.mode === 'get') {
      const [row] = await rest('novagen_projects?select=id,data,updated_at,deleted_at&id=eq.' + encodeURIComponent(b.id));
      if (!row) return res.status(404).json({ error: 'introuvable' });
      const d = row.data || {}, names = (d.photos || []).map(p => 'p/' + p.id + '.jpg'); if (d.logo) names.push('logo.png');
      return res.json({ row, urls: await sign(b.id, names) });
    }
    if (b.mode === 'put') {
      if (!b.data || typeof b.data !== 'object') return res.status(400).json({ error: 'data manquant' });
      const [row] = await rest('novagen_projects?on_conflict=id&select=updated_at', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: b.id, data: b.data, updated_at: new Date().toISOString(), deleted_at: null }) });
      return res.json({ updated_at: row.updated_at });
    }
    if (b.mode === 'upload') {
      if (!NAME.test(b.name || '')) return res.status(400).json({ error: 'nom de fichier invalide' });
      const buf = Buffer.from(String(b.b64 || ''), 'base64'); if (!buf.length || buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: 'fichier vide ou trop gros' });
      await fetch(URL_() + '/storage/v1/object/novagen/' + b.id + '/' + b.name, { method: 'POST', headers: H({ 'content-type': b.name.endsWith('.png') ? 'image/png' : 'image/jpeg', 'x-upsert': 'true' }), body: buf }).then(j);
      return res.json({ ok: true });
    }
    if (b.mode === 'upsign') {
      if (!/^pv\/[A-Za-z0-9_-]{3,60}\.mp4$/.test(b.name || '')) return res.status(400).json({ error: 'nom de vidéo invalide' });
      const o = await fetch(URL_() + '/storage/v1/object/upload/sign/novagen/' + b.id + '/' + b.name, { method: 'POST', headers: H({ 'content-type': 'application/json', 'x-upsert': 'true' }), body: '{}' }).then(j);
      return res.json({ url: URL_() + '/storage/v1' + o.url });
    }
    if (b.mode === 'grabvid') {
      const u = new URL(String(b.u || ''));
      if (u.protocol !== 'https:' || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname) || !u.hostname.includes('.')) return res.status(400).json({ error: 'lien vidéo invalide' });
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 40000);
      const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', referer: 'https://www.facebook.com/', accept: 'video/*,*/*' } });
      if (!r.ok) return res.status(502).json({ error: 'vidéo injoignable (' + r.status + ')' });
      const type = (r.headers.get('content-type') || '').toLowerCase();
      if (!/^video\/|octet-stream/.test(type)) return res.status(415).json({ error: 'ce lien n\'est pas une vidéo' });
      if (+r.headers.get('content-length') > 45 * 1048576) return res.status(413).json({ error: 'vidéo trop lourde (45 Mo max)' });
      const buf = Buffer.from(await r.arrayBuffer()); if (!buf.length || buf.length > 45 * 1048576) return res.status(413).json({ error: 'vidéo vide ou trop lourde' });
      const name = 'tv/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + '.mp4';
      await fetch(URL_() + '/storage/v1/object/novagen/' + b.id + '/' + name, { method: 'POST', headers: H({ 'content-type': 'video/mp4', 'x-upsert': 'true' }), body: buf }).then(j);
      const urls = await sign(b.id, [name]);
      return res.json({ name, url: urls[name], size: buf.length });
    }
    if (b.mode === 'dl') {
      const n = (b.names || []).filter(x => NAME.test(x)), u = await sign(b.id, n);
      return res.json({ urls: u });
    }
    if (b.mode === 'remove') { const n = (b.names || []).filter(x => NAME.test(x)); await rmFiles(b.id, n); return res.json({ ok: true }); }
    if (b.mode === 'purge') {
      await rmFiles(b.id, await listFiles(b.id).catch(() => []));
      const [row] = await rest('novagen_projects?on_conflict=id&select=updated_at', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: b.id, data: {}, updated_at: new Date().toISOString(), deleted_at: new Date().toISOString() }) });
      return res.json({ ok: true, updated_at: row.updated_at });
    }
    res.status(400).json({ error: 'mode inconnu' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
