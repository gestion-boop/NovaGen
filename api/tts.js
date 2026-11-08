/* NovaGen — voix off ElevenLabs. Variable Vercel : ELEVENLABS_API_KEY (jamais exposée au navigateur). */
module.exports = async (req, res) => {
  try {
    if (process.env.APP_PASSWORD && req.headers['x-pass'] !== process.env.APP_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const hk = String(req.headers['x-el-key'] || '').trim(), KEY = (/^[A-Za-z0-9_-]{20,120}$/.test(hk) ? hk : '') || process.env.ELEVENLABS_API_KEY || '';
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.mode === 'status') return res.json({ configured: !!KEY });
    if (!KEY) return res.status(501).json({ error: 'Clé ElevenLabs absente : clique sur 🔑 et colle ta clé API ElevenLabs.' });
    const H = { 'xi-api-key': KEY };
    if (b.mode === 'voices') {
      const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: H }), j = await r.json().catch(() => ({}));
      if (!r.ok) { const d = j.detail || {}, st = d.status || '', msg = d.message || (typeof d === 'string' ? d : ''); return res.status(r.status === 401 ? 400 : r.status).json({ error: /permission/i.test(st + msg) ? 'Ta clé n\'a pas le droit de lire les voix (« Voices : Read »). Coche-le dans ElevenLabs → API Keys → ta clé, ou colle directement l\'ID de la voix ci-dessous.' : /invalid/i.test(st + msg) ? 'Clé ElevenLabs invalide : recopie-la en entier (elle commence par sk_).' : 'ElevenLabs ' + r.status + (st ? ' (' + st + ')' : '') + (msg ? ' : ' + msg : ''), code: st }); }
      return res.json({ voices: (j.voices || []).map(v => ({ id: v.voice_id, name: v.name, cat: v.category || '', prev: v.preview_url || '', lang: (v.labels && (v.labels.accent || v.labels.language)) || '', gender: (v.labels && v.labels.gender) || '' })).sort((a, b) => a.name.localeCompare(b.name)) });
    }
    if (b.mode === 'library') {
      const q = new URLSearchParams({ page_size: '40', language: 'fr', sort: 'trending' }); if (b.q) q.set('search', String(b.q).slice(0, 60)); if (/^(male|female)$/.test(b.gender || '')) q.set('gender', b.gender); if (/^\d{1,3}$/.test(String(b.page || ''))) q.set('page', String(b.page));
      const r = await fetch('https://api.elevenlabs.io/v1/shared-voices?' + q, { headers: H }), j = await r.json().catch(() => ({}));
      if (!r.ok) { const d = j.detail || {}; return res.status(r.status === 401 ? 400 : r.status).json({ error: 'Bibliothèque ElevenLabs : ' + (d.message || d.status || r.status) }); }
      return res.json({ more: !!j.has_more, voices: (j.voices || []).map(v => ({ id: v.voice_id, owner: v.public_owner_id, name: v.name, desc: String(v.description || '').slice(0, 160), gender: v.gender || '', age: v.age || '', accent: v.accent || '', use: v.use_case || '', prev: v.preview_url || '' })) });
    }
    if (b.mode === 'addlib') {
      if (!/^[A-Za-z0-9]{8,40}$/.test(b.id || '') || !/^[A-Za-z0-9]{8,80}$/.test(b.owner || '')) return res.status(400).json({ error: 'voix invalide' });
      const r = await fetch('https://api.elevenlabs.io/v1/voices/add/' + b.owner + '/' + b.id, { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, H), body: JSON.stringify({ new_name: String(b.name || 'Voix').slice(0, 60) }) }), j = await r.json().catch(() => ({}));
      if (!r.ok) { const d = j.detail || {}; return res.status(r.status === 401 ? 400 : r.status).json({ error: 'Ajout impossible : ' + (d.message || d.status || r.status) }); }
      return res.json({ id: j.voice_id || b.id });
    }
    if (b.mode === 'speak') {
      const text = String(b.text || '').trim(), vid = String(b.voice || '');
      if (!text || text.length > 5000) return res.status(400).json({ error: 'texte vide ou trop long (5000 caractères max)' });
      if (!/^[A-Za-z0-9]{8,40}$/.test(vid)) return res.status(400).json({ error: 'voix invalide' });
      const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + vid + '?output_format=mp3_44100_128', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json', accept: 'audio/mpeg' }, H), body: JSON.stringify({ text, model_id: b.model || (/\[[a-z][a-z ]{1,25}\]/i.test(text) ? 'eleven_v3' : 'eleven_multilingual_v2'), voice_settings: { stability: .5, similarity_boost: .75, style: .2, use_speaker_boost: true } }) });
      if (!r.ok) { const t = await r.text(); let m = t; try { const j = JSON.parse(t); m = (j.detail && (j.detail.message || j.detail.status || JSON.stringify(j.detail))) || t; } catch (e) { } return res.status(r.status).json({ error: 'ElevenLabs : ' + String(m).slice(0, 200) }); }
      const buf = Buffer.from(await r.arrayBuffer()); res.setHeader('content-type', 'audio/mpeg'); return res.status(200).send(buf);
    }
    res.status(400).json({ error: 'mode inconnu' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
