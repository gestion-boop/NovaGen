# NovaGen — mise en ligne (5 minutes)

1. Mets ce dossier sur GitHub (nouveau dépôt privé, « Upload files »), puis sur Vercel : **Add New → Project → importe le dépôt**. Aucun réglage de build.
   (Ou en ligne de commande : `npm i -g vercel` puis `vercel --prod` dans ce dossier.)
2. Vercel → **Settings → Environment Variables**, ajoute :
   - `ANTHROPIC_API_KEY` : ta clé API (console.anthropic.com → API keys). **Obligatoire.**
   - `APP_PASSWORD` : un mot de passe de ton choix. **Conseillé** : sans lui, n'importe qui avec le lien consomme ta clé.
   - `CLAUDE_MODEL` : facultatif (par défaut `claude-sonnet-5-5`).
3. **Redéploie** (Deployments → Redeploy), puis ouvre l'adresse du projet.

## Utilisation
Nouvel établissement → colle les liens (site, Facebook, Instagram…) → dépose le logo si tu l'as → **Chercher les infos** → vérifie la fiche (surtout « À confirmer ») → **Aperçu / ZIP** pour chaque page, ou **Tout télécharger** (un ZIP par page, téléchargés à la suite ; si le navigateur demande « autoriser plusieurs téléchargements », accepte).

- Les établissements sont enregistrés dans ton navigateur (pas sur un serveur). Utilise toujours le même navigateur.
- La recherche dure 30 à 60 s. Si Vercel coupe avant (offre gratuite), relance : ça repart de ce qui est déjà saisi.
- Facebook et Instagram sont souvent illisibles : l'outil se rabat sur le site, Tripadvisor, etc. Dépose logo et photos à la main si besoin.
- Les ZIP se déposent tels quels sur Vercel, comme avant (`?visite=1` géré, 4 langues).
