/* NovaGen — sauvegarde serveur (Supabase via /api/store). Le navigateur reste une copie locale rapide. */
const SY = { on: false, q: new Map(), busy: false, t: 0, last: 0 };
const syncStatus = (t, k) => { const e = document.getElementById('cl'); if (!e) return; e.textContent = t; e.style.color = k === 'e' ? '#ffd2cc' : ''; e.style.cursor = k === 'n' || k === 'e' ? 'pointer' : ''; e.title = SY.msg || ''; };
const toB64 = blob => new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(blob); });
const logoKey = p => p.logo.size + '|' + (p.logoAuto ? (p.fiche?.c1 || '') + (p.fiche?.c2 || '') : '');
const strip = p => { const d = {}; for (const k in p) if (!['photos', 'logo', 'videos', '_sv', '_sy'].includes(k)) d[k] = p[k]; d.photos = (p.photos || []).map(({ blob, ...r }) => r); d.logo = p.logo ? { k: logoKey(p) } : null; return d; };

async function pushOne(p) {
  const sy = p._sy || { photos: [], logo: '' }, have = new Set(sy.photos);
  for (const ph of p.photos || []) if (!have.has(ph.id) && ph.blob) { await api('/api/store', { mode: 'upload', id: p.id, name: 'p/' + ph.id + '.jpg', b64: await toB64(ph.blob) }); have.add(ph.id); }
  if (p.logo) { const k = logoKey(p); if (sy.logo !== k) { await api('/api/store', { mode: 'upload', id: p.id, name: 'logo.png', b64: await toB64(p.logo) }); sy.logo = k; } } else sy.logo = '';
  const keep = new Set((p.photos || []).map(x => x.id)), gone = [...have].filter(id => !keep.has(id));
  if (gone.length) await api('/api/store', { mode: 'remove', id: p.id, names: gone.map(id => 'p/' + id + '.jpg') });
  sy.photos = [...have].filter(id => keep.has(id));
  const r = await api('/api/store', { mode: 'put', id: p.id, data: strip(p) });
  p._sv = Date.parse(r.updated_at); p._sy = sy; await dbPutRaw(p);
}
function syncQueue(p) { if (!SY.on || !p || !p.id) return; SY.q.set(p.id, p); clearTimeout(SY.t); SY.t = setTimeout(syncRun, 2000); syncStatus('☁ Envoi…'); }
async function syncRun() {
  if (SY.busy) { SY.t = setTimeout(syncRun, 1500); return; }
  SY.busy = true; let failed = null;
  for (const [id, p] of [...SY.q]) { SY.q.delete(id); try { await pushOne(p); } catch (e) { failed = e; SY.q.set(id, p); } }
  SY.busy = false;
  if (failed) { SY.msg = failed.message; syncStatus('☁ Erreur — nouvel essai…', 'e'); SY.t = setTimeout(syncRun, 30000); } else { SY.msg = ''; syncStatus('☁ Sauvegardé ✓'); }
}
function syncPurge(id) { if (!SY.on) return; api('/api/store', { mode: 'purge', id }).catch(() => { }); }

async function pullOne(id) {
  const { row, urls } = await api('/api/store', { mode: 'get', id }), d = row.data || {}, photos = [];
  const list = d.photos || []; let i = 0, bad = false;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < list.length && !bad) { const ph = list[i++]; try { const r = await fetch(urls['p/' + ph.id + '.jpg']); if (!r.ok) throw 0; photos[list.indexOf(ph)] = Object.assign({}, ph, { blob: await r.blob() }); } catch (e) { bad = true; } } }));
  if (bad) throw new Error('photos injoignables');
  const p = Object.assign({}, d, { photos, logo: null });
  if (d.logo && urls['logo.png']) { const r = await fetch(urls['logo.png']); if (!r.ok) throw new Error('logo injoignable'); p.logo = await r.blob(); }
  { const lv = (await dbAll()).find(x => x.id === id); if (lv && lv.videos) p.videos = lv.videos; }
  p._sv = Date.parse(row.updated_at); p._sy = { photos: photos.map(x => x.id), logo: d.logo ? d.logo.k : '' };
  await dbPutRaw(p);
}
async function syncPull() {
  if (!SY.on || SY.pulling) return; SY.pulling = true; SY.last = Date.now();
  try {
    const { items } = await api('/api/store', { mode: 'list' }), local = await dbAll(), lm = new Map(local.map(p => [p.id, p])); let changed = false;
    for (const it of items) {
      const l = lm.get(it.id), sMs = Date.parse(it.updated_at);
      if (it.deleted_at) { if (l) { await dbDelRaw(it.id); changed = true; } continue; }
      if (!l || (sMs > (l._sv || 0) + 1000 && sMs > (l.upd || 0))) {
        if (cur && cur.id === it.id && Date.now() - (cur.upd || 0) < 8000) continue;
        try { await pullOne(it.id); changed = true; } catch (e) { }
      } else if (!l._sv || (l.upd || 0) > sMs + 1000) syncQueue(l);
    }
    for (const l of local) if (!items.some(i => i.id === l.id)) syncQueue(l);
    if (changed) {
      const all = (await dbAll()).filter(p => !p.del);
      if (cur) cur = all.find(p => p.id === cur.id) || null;
      if (!cur && all.length) cur = all.sort((a, b) => b.upd - a.upd)[0];
      renderList(); render();
    }
    if (!SY.q.size) { SY.msg = ''; syncStatus('☁ Sauvegardé ✓'); }
  } catch (e) { SY.msg = e.message; syncStatus('☁ Hors ligne', 'e'); }
  SY.pulling = false;
}
async function syncInit() {
  const e = document.getElementById('cl');
  try {
    const s = await api('/api/store', { mode: 'status' });
    if (!s.configured) { syncStatus('☁ Sauvegarde serveur non configurée', 'n'); if (e) e.onclick = () => alert('Pour sauvegarder sur Supabase, ajoute dans Vercel (Settings → Environment Variables) :\n• SUPABASE_URL = https://kcqzpcupaunxqiynolqo.supabase.co\n• SUPABASE_SERVICE_KEY = la clé « service_role » de Supabase (Project Settings → API Keys)\npuis redéploie.'); return; }
    SY.on = true; if (e) e.onclick = () => { if (SY.msg) alert(SY.msg); syncPull(); };
    syncStatus('☁ Synchronisation…'); await syncPull();
    window.addEventListener('focus', () => { if (Date.now() - SY.last > 20000) syncPull(); });
    setInterval(() => { if (!document.hidden) syncPull(); }, 90000);
  } catch (x) { SY.msg = x.message; syncStatus('☁ Hors ligne', 'e'); }
}
syncInit();
