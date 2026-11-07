// Proxy d'images : permet au navigateur de récupérer les photos/logo d'un site (contourne le CORS)
module.exports = async (req, res) => {
  if (process.env.APP_PASSWORD && req.headers['x-pass'] !== process.env.APP_PASSWORD) return res.status(401).end();
  try {
    const u = new URL(String(req.query.u || ''));
    if (!/^https?:$/.test(u.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname) || !u.hostname.includes('.')) return res.status(400).end();
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(u, { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; NovaGen/1.0)', referer: u.origin + '/', accept: 'image/*,*/*' } });
    if (!r.ok) return res.status(502).end();
    const type = r.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//.test(type)) return res.status(415).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 12e6) return res.status(413).end();
    res.setHeader('content-type', type); res.setHeader('cache-control', 'private, max-age=3600');
    res.status(200).send(buf);
  } catch (e) { res.status(500).end(); }
};
