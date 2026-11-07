# Bibliothèque de modèles NovaGen

Pages de référence de Sylvain, reproduites dans `public/modeles.js` (registre `MODELES`) et choisies automatiquement selon les données de la fiche. Choix manuel : sélecteur de style par page (5 = Signature, 6 = Vitrine pour Point Info). Ajouter un modèle = une entrée dans `MODELES` + une fonction page.

| Page | Modèle | Référence | Choisi quand |
|---|---|---|---|
| Intro | Cinéma : Ken Burns, logo 3D + reflet + anneaux, titre lettre par lettre, iris NovaTour conservé | https://gaiacuisine.vercel.app/ | restaurant/commerce avec photo |
| Point Info | Fiche : cartes à icônes, jour courant en gras, avis Google, grande carte + Maps/Waze/Plans | https://miozavercel3dvista.vercel.app/ | par défaut (1 établissement sur 2) |
| Point Info | Vitrine : hero, note Google, pills sticky, sections sombres | https://gaia-infos.vercel.app/ | 2 photos ou plus (1 sur 2) |
| Carte | Éditoriale : photo + liste, pointillés, 🌿 végé, pied de page | https://miozacarte.vercel.app/ | restaurant avec photos |
| Vidéo | Cadre téléphone, son / pause / rejouer, progression multi-vidéos | https://flambadou-gaia.vercel.app/ | au moins une vidéo ajoutée |

Syntaxe carte : `# Catégorie | sous-titre | 2` (le 2 = n° de photo, facultatif) ; `Plat 🌿 | prix | description` (🌿 ou `(végé)` = végétarien).
Champs fiche ajoutés : `avis` (note Google), `videoSur`, `videoTitre`, `videoTexte`.
Vidéos : stockées sur l'ordinateur (non synchronisées), ~3 Mo max par fichier pour « Déployer » ; au-delà, ZIP à déposer sur Vercel.
