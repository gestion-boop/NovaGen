# NovaGen — consignes pour Claude Code

Outil interne de Sylvain Grazia (NovaTour / NovaVisio, Narbonne) : prépare les visites virtuelles NovaTour (pages intro, infos, galerie, carte, réservation) et les dossiers de pub vidéo des établissements clients.
Toujours répondre et écrire l'interface **en français**.

## Architecture
- Site statique dans `public/` + fonctions serverless Vercel dans `api/`. Pas de build, pas de framework, pas de dépendances npm.
- `public/index.html` charge, dans l'ordre : `gen.js` (génération des pages / ZIP), `modeles.js` (modèles de pages), `pub.js` (onglet Publicité), `app.js` (écrans et logique), `sync.js` (synchro Supabase). Chaque balise script porte `?v=<timestamp>` : **le mettre à jour à chaque modification** (sinon cache navigateur).
- `api/fiche.js` : appels Claude (modes : fiche, voicescript, voicetags…). Modèle = `CLAUDE_MODEL` ou `claude-sonnet-5-5`.
- `api/store.js` : Supabase (modes put/get/list/upload/remove/purge/upsign/dl/grabvid). Table `novagen_projects`, bucket privé `novagen` (50 Mo max) : `<id>/p/` photos, `<id>/pv/` vidéos pub finales, `<id>/tv/` vidéos aspirées temporaires.
- `api/tts.js` : ElevenLabs (status, voices, library, addlib, speak). Clé via en-tête `x-el-key` (saisie dans le navigateur) ou `ELEVENLABS_API_KEY`. `eleven_v3` si balises audio, sinon `eleven_multilingual_v2`.
- `api/img.js` : proxy image. `api/publish.js` : publication directe des pages sur Vercel.
- `public/ref/PROMPT_MAITRE_MOTION.md` : prompt maître ajouté au ZIP « Exporter le ZIP pour Claude ».

## Variables d'environnement (Vercel)
`ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `APP_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ELEVENLABS_API_KEY`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROTECTED`.
Ne jamais écrire de clé dans le code ni dans un commit (`.env.local` est ignoré par git).

## Règles métier
- NovaGen ne génère **pas** les vidéos (coût en crédits) : il prépare le ZIP pour Claude (prompt, photos, logo, voix, musique) et stocke les vidéos finales par fiche client.
- Pubs : charte NovaVisio (bleu #345C95, turquoise #2B899D, teal #125C68, bleu clair #A8DBE5, fond #0B1F33), pas de jaune, aucun prix dans les pubs clients, signature « Publicité créée par NovaVisio », mention « visite immersive sur app.novavisio.fr » seulement si la case est cochée.
- Voix : 45 s environ, accroche, découverte, atouts, appel à l'action.

## Travail
- Tester en local : `vercel dev` (après `vercel link` et `vercel env pull .env.local`), ou servir `public/` avec `python3 -m http.server`.
- Déploiement : un push sur `main` redéploie sur Vercel.
- Documentation utilisateur : `LISEZ-MOI.md`, `MODELES.md`.
