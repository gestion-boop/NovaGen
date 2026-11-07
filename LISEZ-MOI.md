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

## Publication directe sur Vercel (bouton 🚀 Publier)
Ajoute dans Vercel → Settings → Environment Variables, puis redéploie :
- `VERCEL_TOKEN` : crée-le sur vercel.com/account/tokens (nom : NovaGen, durée au choix).
- `VERCEL_TEAM_ID` : l'identifiant de ton équipe (Settings de l'équipe → General → Team ID), si tes projets sont dans une équipe.
- `VERCEL_PROTECTED` (facultatif) : noms de projets à ne jamais écraser, séparés par des virgules.

Chaque page (intro, infos, galerie, carte, réservation) est un projet Vercel à part. Dans chaque carte, le champ « Projet Vercel » contient le nom du projet : mets le nom **exact** du projet déjà en ligne pour le mettre à jour, sinon un nouveau projet est créé.
Le repère « ✓ à jour / ● modifiée / jamais publiée » indique ce qui a changé depuis la dernière publication.

## Sauvegarde serveur (Supabase)
Les fiches, photos et logos sont copiés sur Supabase (projet « Site Novatour », table `novagen_projects`, bucket privé `novagen`) pour être retrouvés sur n'importe quel appareil.
Variables Vercel à ajouter : `SUPABASE_URL` (https://kcqzpcupaunxqiynolqo.supabase.co) et `SUPABASE_SERVICE_KEY` (clé service_role, Project Settings → API Keys), puis redéployer.
Le navigateur garde une copie locale ; au démarrage et au retour sur l'onglet, l'outil se resynchronise (dernier modifié gagne). Un « supprimer définitivement » efface aussi les fichiers sur le serveur.
