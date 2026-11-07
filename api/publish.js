// Publication directe d'une page sur Vercel (un projet Vercel par page)
// Variables : VERCEL_TOKEN (obligatoire), VERCEL_TEAM_ID (si compte d'équipe), VERCEL_PROTECTED (noms de projets interdits, séparés par des virgules)
const crypto = require('crypto');
const V = 'https://api.vercel.com';
const head = () => ({ authorization: 'Bearer ' + process.env.VERCEL_TOKEN });
const team = (first = '?') => process.env.VERCEL_TEAM_ID ? first + 'teamId=' + encodeURIComponent(process.env.VERCEL_TEAM_ID) : '';

module.exports = async (req, res) => {
  try {
    if (process.env.APP_PASSWORD && req.headers['x-pass'] !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect' });
    if (!process.env.VERCEL_TOKEN) return res.status(500).json({ error: 'VERCEL_TOKEN manquant dans Vercel (Settings → Environment Variables). Crée-le sur vercel.com/account/tokens.' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.mode === 'projects') {
      const r = await fetch(V + '/v10/projects' + team() + (team() ? '&' : '?') + 'limit=100', { headers: head() }), j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ error: 'Liste des projets Vercel indisponible : ' + (j.error?.message || r.status) });
      return res.json({ projects: (j.projects || []).map(p => { const al = (p.targets?.production?.alias || []).filter(Boolean); return { name: p.name, domain: al.find(a => !/\.vercel\.app$/.test(a)) || al[0] || p.name + '.vercel.app' }; }) });
    }
    if (b.mode === 'status') {
      if (!/^dpl_[\w]+$/.test(String(b.id || ''))) return res.status(400).json({ error: 'id invalide' });
      const r = await fetch(V + '/v13/deployments/' + b.id + team(), { headers: head() }), j = await r.json().catch(() => ({}));
      return res.json({ state: j.readyState || j.status || '?', error: j.errorMessage || '' });
    }
    if (b.mode === 'file') {
      const buf = Buffer.from(String(b.data || ''), 'base64'), sha = crypto.createHash('sha1').update(buf).digest('hex');
      if (sha !== b.sha) return res.status(400).json({ error: 'Fichier corrompu pendant le transfert' });
      const r = await fetch(V + '/v2/files' + team(), { method: 'POST', headers: { ...head(), 'x-vercel-digest': sha, 'content-type': 'application/octet-stream', 'content-length': String(buf.length) }, body: buf });
      if (!r.ok) { const j = await r.json().catch(() => ({})); return res.status(502).json({ error: 'Envoi refusé : ' + (j.error?.message || r.status) }); }
      return res.json({ ok: true });
    }
    if (b.mode === 'deploy') {
      const name = String(b.project || '').toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{1,98}$/.test(name)) return res.status(400).json({ error: 'Nom de projet invalide (lettres minuscules, chiffres, tirets).' });
      const blocked = ['novagen', ...String(process.env.VERCEL_PROTECTED || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)];
      if (blocked.includes(name)) return res.status(400).json({ error: 'Le projet « ' + name + ' » est protégé : choisis un autre nom.' });
      const files = (b.files || []).filter(f => f && /^[\w\-./]+$/.test(f.file) && !f.file.includes('..') && /^[a-f0-9]{40}$/.test(f.sha)).map(f => ({ file: f.file, sha: f.sha, size: +f.size }));
      if (!files.some(f => f.file === 'index.html')) return res.status(400).json({ error: 'index.html manquant' });
      const r = await fetch(V + '/v13/deployments' + team() + (process.env.VERCEL_TEAM_ID ? '&' : '?') + 'skipAutoDetectionConfirmation=1', { method: 'POST', headers: { ...head(), 'content-type': 'application/json' }, body: JSON.stringify({ name, files, target: 'production', projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ error: 'Déploiement refusé : ' + (j.error?.message || r.status) });
      return res.json({ ok: true, id: j.id, url: 'https://' + name + '.vercel.app', deployUrl: 'https://' + j.url, state: j.readyState });
    }
    res.status(400).json({ error: 'Mode inconnu' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
